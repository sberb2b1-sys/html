import json
import os
from contextlib import asynccontextmanager
from datetime import date
from typing import Optional

from dotenv import load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

import auth
import crud
from database import Base, engine, get_db, SessionLocal, run_legacy_migrations
from migrations.add_owner_id import run_migration as run_owner_id_migration
from migrations.add_sprints import run_add_sprints_migration
from migrations.analysis_council import run_analysis_council_migration
from migrations.artifacts import run_artifacts_migration
from migrations.project_agents import run_project_agents_migration
from migrations.sprint2 import run_sprint2_migrations
from models import (
    Agent,
    AnalysisJob,
    AnalysisReport,
    Artifact,
    ChatMessage,
    GeneralMessage,
    Project,
    Sprint,
    Task,
    TaskApproval,
    User,
)
from services.orchestrator import AgentOrchestrator
from services.task_worker import run_artifact_continuation, run_task_execution
from services.llm import (
    DeepSeekAPIError,
    DeepSeekNotConfigured,
    DeepSeekRateLimit,
    DeepSeekTimeout,
    call_deepseek,
)

load_dotenv()

# ---------------------------------------------------------------------------
# Pydantic-схемы (API models)
# ---------------------------------------------------------------------------


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=3)
    name: str = Field(min_length=1)


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    deadline: str = "Без срока"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    deadline: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "todo"
    priority: str = "Medium"
    project_id: Optional[int] = None
    sprint_id: Optional[int] = None
    assignee_agent_id: Optional[str] = None


class AgentTaskCreate(TaskCreate):
    user_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    project_id: Optional[int] = None
    sprint_id: Optional[int] = None
    assignee_agent_id: Optional[str] = None


class TaskSprintUpdate(BaseModel):
    sprint_id: Optional[int] = None


class TaskStatusUpdate(BaseModel):
    status: str


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    project_id: Optional[int] = None
    sprint_id: Optional[int] = None
    assignee_agent_id: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class SprintCreate(BaseModel):
    project_id: int
    name: str
    description: str = ""
    start_date: date
    end_date: date
    status: str = "planning"


class SprintUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


class SprintResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: str = ""
    start_date: date
    end_date: date
    status: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class AgentCreate(BaseModel):
    id: str = Field(min_length=1, max_length=50)
    name: str
    role: str
    system_prompt: str = ""
    avatar_url: str = ""
    is_online: bool = True


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    system_prompt: Optional[str] = None
    avatar_url: Optional[str] = None
    is_online: Optional[bool] = None


class AgentResponse(BaseModel):
    id: str
    project_id: Optional[int] = None
    name: str
    role: str
    system_prompt: str
    avatar_url: str = ""
    is_online: bool

    class Config:
        from_attributes = True


class AgentPromptUpdate(BaseModel):
    system_prompt: str = Field(min_length=1)


class ProjectAgentCreate(BaseModel):
    slug: str = Field(min_length=1, max_length=40)
    name: str
    role: str
    system_prompt: str = ""
    avatar_url: str = ""
    is_online: bool = True


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatMessageUpdate(BaseModel):
    message: str = Field(min_length=1)


class ChatMessageResponse(BaseModel):
    id: int
    agent_id: str
    role: str
    content: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ChatExchangeResponse(BaseModel):
    user_message: ChatMessageResponse
    agent_message: ChatMessageResponse


class GeneralMessageCreate(BaseModel):
    project_id: int
    content: str = Field(min_length=1)
    agent_id: Optional[str] = None


class GeneralMessageResponse(BaseModel):
    id: int
    project_id: int
    user_id: int
    user_name: str
    agent_id: Optional[str] = None
    content: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class AnalyzeIdeaRequest(BaseModel):
    idea: str = Field(min_length=3)


class AnalyzeIdeaResponse(BaseModel):
    task_id: int
    report_id: int
    winner: str
    report: str
    message: str


class AnalyzeJobStartResponse(BaseModel):
    job_id: int
    status: str
    message: str


class AnalyzeJobStatusResponse(BaseModel):
    job_id: int
    status: str
    progress: str
    result: Optional[AnalyzeIdeaResponse] = None
    error: Optional[str] = None


class AnalysisReportResponse(BaseModel):
    id: int
    project_id: int
    task_id: Optional[int] = None
    user_idea: str
    winner_analyst: str
    winner_proposal: str
    report: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ApprovalTaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    assignee_agent_id: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: int
    project_id: int
    task_id: int
    report_id: Optional[int] = None
    status: str
    rejection_reason: str
    created_at: Optional[str] = None
    task: ApprovalTaskResponse
    report: Optional[str] = None


class RejectApprovalRequest(BaseModel):
    reason: str = Field(default="Требуются доработки", min_length=1)


class RejectArtifactRequest(BaseModel):
    feedback: str = Field(default="Требуются доработки", min_length=1)


class ArtifactResponse(BaseModel):
    id: int
    task_id: int
    task_title: str
    project_id: int
    agent_id: str
    agent_name: Optional[str] = None
    artifact_type: str
    title: str
    content: str
    file_url: Optional[str] = None
    status: str
    feedback: Optional[str] = None
    created_at: Optional[str] = None
    approved_at: Optional[str] = None


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_owner_id_migration(engine)
    run_legacy_migrations()
    run_sprint2_migrations()
    run_add_sprints_migration()
    run_project_agents_migration()
    run_analysis_council_migration()
    run_artifacts_migration()
    db = next(get_db())
    try:
        crud.ensure_agent_task_prompts(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="IT Team API",
    description="REST API для мультиагентной IT-команды",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://itteam.tech",
        "http://itteam.tech",
        "https://www.itteam.tech",
        "http://www.itteam.tech",
        *[
            origin.strip()
            for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
            if origin.strip()
        ],
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def project_to_response(project: Project) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description or "",
        deadline=project.deadline or "Без срока",
        created_at=project.created_at.isoformat() if project.created_at else None,
    )


def task_to_response(task: Task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description or "",
        status=task.status,
        priority=task.priority,
        project_id=task.project_id,
        sprint_id=task.sprint_id,
        assignee_agent_id=task.assignee_agent_id,
        created_at=task.created_at.isoformat() if task.created_at else None,
    )


def sprint_to_response(sprint: Sprint) -> SprintResponse:
    created = sprint.created_at.isoformat() if sprint.created_at else None
    return SprintResponse(
        id=sprint.id,
        project_id=sprint.project_id,
        name=sprint.name,
        description=sprint.description or "",
        start_date=sprint.start_date,
        end_date=sprint.end_date,
        status=sprint.status,
        created_at=created,
    )


def ensure_task_sprint_valid(
    db: Session, sprint_id: int | None, project_id: int | None, owner_id: int
) -> None:
    if sprint_id is None:
        return
    sprint = crud.get_sprint(db, sprint_id, owner_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Спринт не найден")
    if project_id is not None and sprint.project_id != project_id:
        raise HTTPException(
            status_code=400, detail="Спринт не принадлежит выбранному проекту"
        )


def chat_msg_to_response(message: ChatMessage) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=message.id,
        agent_id=message.agent_id,
        role=message.role,
        content=message.content,
        created_at=message.created_at.isoformat() if message.created_at else None,
    )


def general_msg_to_response(message: GeneralMessage, user_name: str) -> GeneralMessageResponse:
    return GeneralMessageResponse(
        id=message.id,
        project_id=message.project_id,
        user_id=message.user_id,
        user_name=user_name,
        agent_id=message.agent_id,
        content=message.content,
        created_at=message.created_at.isoformat() if message.created_at else None,
    )


def agent_to_response(agent: Agent) -> AgentResponse:
    return AgentResponse(
        id=agent.id,
        project_id=agent.project_id,
        name=agent.name,
        role=agent.role,
        system_prompt=agent.system_prompt or "",
        avatar_url=agent.avatar_url or "",
        is_online=agent.is_online,
    )


def require_po_role(x_user_role: Optional[str] = Header(None, alias="X-User-Role")) -> None:
    if x_user_role != "po":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только PO может изменять настройки агентов",
        )


def ensure_project_belongs_to_user(
    db: Session, project_id: int | None, owner_id: int
) -> None:
    if project_id is None:
        return
    project = crud.get_project(db, project_id, owner_id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------


@app.get("/")
def root():
    return {"message": "IT Team API", "docs": "/docs"}


@app.get("/api")
def api_root():
    return {"message": "API is working"}


@app.get("/ping")
def ping():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Auth (без JWT)
# ---------------------------------------------------------------------------


@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    return auth.register_user(db, payload.email, payload.password, payload.name)


@app.post("/api/auth/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ---------------------------------------------------------------------------
# Auth (JWT)
# ---------------------------------------------------------------------------


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(auth.get_current_user)):
    return current_user


# ---------------------------------------------------------------------------
# Projects (JWT)
# ---------------------------------------------------------------------------


@app.get("/api/projects", response_model=list[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    return [project_to_response(p) for p in crud.get_projects(db, current_user.id)]


@app.post("/api/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    project = crud.create_project(db, current_user.id, payload.model_dump())
    return project_to_response(project)


@app.put("/api/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    project = crud.get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    updated = crud.update_project(
        db, project, payload.model_dump(exclude_unset=True)
    )
    return project_to_response(updated)


@app.delete("/api/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    project = crud.get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    crud.delete_project(db, project)


# ---------------------------------------------------------------------------
# Tasks (JWT)
# ---------------------------------------------------------------------------


@app.get("/api/tasks", response_model=list[TaskResponse])
def list_tasks(
    project_id: Optional[int] = Query(None, description="Фильтр по проекту"),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    if project_id is not None:
        ensure_project_belongs_to_user(db, project_id, current_user.id)
    tasks = crud.get_tasks(db, current_user.id, project_id=project_id)
    return [task_to_response(t) for t in tasks]


@app.post("/api/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    ensure_project_belongs_to_user(db, payload.project_id, current_user.id)
    if payload.assignee_agent_id and not crud.get_agent(db, payload.assignee_agent_id):
        raise HTTPException(status_code=404, detail="Агент не найден")
    ensure_task_sprint_valid(db, payload.sprint_id, payload.project_id, current_user.id)
    task = crud.create_task(db, current_user.id, payload.model_dump())
    return task_to_response(task)


async def resolve_agent_task_owner_id(
    payload: AgentTaskCreate,
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(auth.oauth2_scheme_optional),
    x_agent_api_key: Optional[str] = Header(None, alias="X-Agent-API-Key"),
) -> int:
    if x_agent_api_key:
        auth.verify_agent_api_key(x_agent_api_key)
        if payload.user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id обязателен при вызове с API-ключом агента",
            )
        user = crud.get_user(db, payload.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        return payload.user_id

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await auth.get_user_from_token(token, db)
    return user.id


@app.post(
    "/api/agent/create-task",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def agent_create_task(
    payload: AgentTaskCreate,
    db: Session = Depends(get_db),
    owner_id: int = Depends(resolve_agent_task_owner_id),
):
    ensure_project_belongs_to_user(db, payload.project_id, owner_id)
    if payload.assignee_agent_id and not crud.get_agent(db, payload.assignee_agent_id):
        raise HTTPException(status_code=404, detail="Агент не найден")
    ensure_task_sprint_valid(db, payload.sprint_id, payload.project_id, owner_id)
    data = payload.model_dump(exclude={"user_id"})
    task = crud.create_task(db, owner_id, data)
    return task_to_response(task)


@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    task = crud.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    data = payload.model_dump(exclude_unset=True)
    if "project_id" in data:
        ensure_project_belongs_to_user(db, data["project_id"], current_user.id)
    if data.get("assignee_agent_id") and not crud.get_agent(db, data["assignee_agent_id"]):
        raise HTTPException(status_code=404, detail="Агент не найден")
    project_id = data.get("project_id", task.project_id)
    if "sprint_id" in data:
        ensure_task_sprint_valid(db, data["sprint_id"], project_id, current_user.id)

    updated = crud.update_task(db, task, data)
    return task_to_response(updated)


@app.patch("/api/tasks/{task_id}/status", response_model=TaskResponse)
def patch_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    task = crud.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    updated = crud.update_task(db, task, {"status": payload.status})
    return task_to_response(updated)


@app.patch("/api/tasks/{task_id}/sprint", response_model=TaskResponse)
def patch_task_sprint(
    task_id: int,
    payload: TaskSprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    task = crud.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    updated = crud.assign_task_sprint(db, task, payload.sprint_id, current_user.id)
    if not updated:
        raise HTTPException(status_code=400, detail="Спринт не принадлежит проекту задачи")
    return task_to_response(updated)


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    task = crud.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    crud.delete_task(db, task)


# ---------------------------------------------------------------------------
# Sprints (JWT)
# ---------------------------------------------------------------------------


@app.get("/api/sprints", response_model=list[SprintResponse])
def list_sprints(
    project_id: int = Query(..., description="ID проекта"),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    ensure_project_belongs_to_user(db, project_id, current_user.id)
    return [sprint_to_response(s) for s in crud.get_sprints(db, project_id, current_user.id)]


@app.get("/api/sprints/{sprint_id}", response_model=SprintResponse)
def get_sprint_by_id(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    sprint = crud.get_sprint(db, sprint_id, current_user.id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Спринт не найден")
    return sprint_to_response(sprint)


@app.post("/api/sprints", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
def create_sprint(
    payload: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    sprint = crud.create_sprint(db, current_user.id, payload.model_dump())
    if not sprint:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return sprint_to_response(sprint)


@app.put("/api/sprints/{sprint_id}", response_model=SprintResponse)
def update_sprint(
    sprint_id: int,
    payload: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    sprint = crud.get_sprint(db, sprint_id, current_user.id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Спринт не найден")
    updated = crud.update_sprint(db, sprint, payload.model_dump(exclude_unset=True))
    return sprint_to_response(updated)


@app.delete("/api/sprints/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    sprint = crud.get_sprint(db, sprint_id, current_user.id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Спринт не найден")
    crud.delete_sprint(db, sprint)


# ---------------------------------------------------------------------------
# Agents (JWT)
# ---------------------------------------------------------------------------


@app.get("/api/agents", response_model=list[AgentResponse])
def list_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    return [agent_to_response(a) for a in crud.get_agents(db, current_user.id)]


@app.get("/api/projects/{project_id}/agents", response_model=list[AgentResponse])
def list_project_agents(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    agents = crud.get_agents_by_project(db, project_id, current_user.id)
    if not crud.get_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Проект не найден")
    return [agent_to_response(a) for a in agents]


@app.post(
    "/api/projects/{project_id}/agents",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project_agent(
    project_id: int,
    payload: ProjectAgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
    _: None = Depends(require_po_role),
):
    agent = crud.create_agent(db, project_id, current_user.id, payload.model_dump())
    if not agent:
        raise HTTPException(status_code=404, detail="Проект не найден или агент уже существует")
    return agent_to_response(agent)


@app.patch("/api/projects/{project_id}/agents/{agent_id}", response_model=AgentResponse)
def update_project_agent_prompt(
    project_id: int,
    agent_id: str,
    payload: AgentPromptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
    _: None = Depends(require_po_role),
):
    agent = crud.get_project_agent(db, project_id, agent_id, current_user.id)
    if not agent:
        raise HTTPException(status_code=404, detail="Агент не найден")
    updated = crud.update_agent(db, agent, {"system_prompt": payload.system_prompt})
    return agent_to_response(updated)


@app.post("/api/agents", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
    payload: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Создавайте агентов через POST /api/projects/{project_id}/agents",
    )


@app.put("/api/agents/{agent_id}", response_model=AgentResponse)
def update_agent(
    agent_id: str,
    payload: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Агент не найден")
    updated = crud.update_agent(db, agent, payload.model_dump(exclude_unset=True))
    return agent_to_response(updated)


@app.delete("/api/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Агент не найден")
    crud.delete_agent(db, agent)


# ---------------------------------------------------------------------------
# Chat — DeepSeek (JWT)
# ---------------------------------------------------------------------------


@app.get("/api/chat/history/{agent_id}", response_model=list[ChatMessageResponse])
def get_chat_history(
    agent_id: str,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Агент не найден")
    project_id = agent.project_id
    if not project_id:
        raise HTTPException(status_code=400, detail="Агент не привязан к проекту")
    messages = crud.get_chat_history(
        db, current_user.id, project_id, agent_id, limit=limit
    )
    return [chat_msg_to_response(m) for m in messages]


@app.get(
    "/api/projects/{project_id}/chats/{agent_id}",
    response_model=list[ChatMessageResponse],
)
def get_project_chat_history(
    project_id: int,
    agent_id: str,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    agent = crud.get_project_agent(db, project_id, agent_id, current_user.id)
    if not agent:
        raise HTTPException(status_code=404, detail="Агент не найден")
    messages = crud.get_chat_history(
        db, current_user.id, project_id, agent_id, limit=limit
    )
    return [chat_msg_to_response(m) for m in messages]


@app.get("/api/chat/{agent_id}/messages", response_model=list[ChatMessageResponse])
def list_chat_messages_legacy(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    return get_chat_history(agent_id, 50, db, current_user)


@app.post("/api/chat/{agent_id}", response_model=ChatExchangeResponse)
def send_chat_message(
    agent_id: str,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Агент не найден")

    project_id = agent.project_id
    if not project_id:
        raise HTTPException(status_code=400, detail="Агент не привязан к проекту")

    crud.check_and_increment_llm_calls(db, current_user)

    history = crud.get_chat_history(db, current_user.id, project_id, agent_id, limit=10)
    context = [
        {
            "role": "assistant" if m.role == "assistant" else "user",
            "content": m.content,
        }
        for m in history
    ]
    context.append({"role": "user", "content": payload.message})

    try:
        reply = call_deepseek(context, agent.system_prompt or "")
    except DeepSeekNotConfigured:
        raise HTTPException(status_code=503, detail="DeepSeek API не настроен")
    except DeepSeekRateLimit as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except DeepSeekTimeout as exc:
        raise HTTPException(status_code=504, detail=str(exc))
    except DeepSeekAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    user_row = crud.add_chat_message(
        db, current_user.id, project_id, agent_id, "user", payload.message
    )
    agent_row = crud.add_chat_message(
        db, current_user.id, project_id, agent_id, "assistant", reply
    )

    return ChatExchangeResponse(
        user_message=chat_msg_to_response(user_row),
        agent_message=chat_msg_to_response(agent_row),
    )


@app.post(
    "/api/projects/{project_id}/chats/{agent_id}",
    response_model=ChatExchangeResponse,
)
def send_project_chat_message(
    project_id: int,
    agent_id: str,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    agent = crud.get_project_agent(db, project_id, agent_id, current_user.id)
    if not agent:
        raise HTTPException(status_code=404, detail="Агент не найден")

    crud.check_and_increment_llm_calls(db, current_user)

    history = crud.get_chat_history(db, current_user.id, project_id, agent_id, limit=10)
    context = [
        {
            "role": "assistant" if m.role == "assistant" else "user",
            "content": m.content,
        }
        for m in history
    ]
    context.append({"role": "user", "content": payload.message})

    try:
        reply = call_deepseek(context, agent.system_prompt or "")
    except DeepSeekNotConfigured:
        raise HTTPException(status_code=503, detail="DeepSeek API не настроен")
    except DeepSeekRateLimit as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except DeepSeekTimeout as exc:
        raise HTTPException(status_code=504, detail=str(exc))
    except DeepSeekAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    user_row = crud.add_chat_message(
        db, current_user.id, project_id, agent_id, "user", payload.message
    )
    agent_row = crud.add_chat_message(
        db, current_user.id, project_id, agent_id, "assistant", reply
    )

    return ChatExchangeResponse(
        user_message=chat_msg_to_response(user_row),
        agent_message=chat_msg_to_response(agent_row),
    )


@app.put("/api/chat/messages/{message_id}", response_model=ChatMessageResponse)
def update_chat_message(
    message_id: int,
    payload: ChatMessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    message = crud.update_chat_message_content(
        db, message_id, current_user.id, payload.message
    )
    if not message:
        raise HTTPException(status_code=404, detail="Сообщение не найдено")
    return chat_msg_to_response(message)


@app.delete("/api/chat/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_chat_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    if not crud.delete_chat_message(db, message_id, current_user.id):
        raise HTTPException(status_code=404, detail="Сообщение не найдено")


# ---------------------------------------------------------------------------
# General chat (JWT)
# ---------------------------------------------------------------------------


@app.get("/api/chat/general", response_model=list[GeneralMessageResponse])
def list_general_messages(
    project_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    messages = crud.get_general_messages(db, project_id, current_user.id)
    result = []
    for m in messages:
        user = crud.get_user(db, m.user_id)
        result.append(general_msg_to_response(m, user.name if user else "User"))
    return result


@app.post("/api/chat/general", response_model=GeneralMessageResponse, status_code=status.HTTP_201_CREATED)
def post_general_message(
    payload: GeneralMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    if payload.agent_id and not crud.get_agent(db, payload.agent_id):
        raise HTTPException(status_code=404, detail="Агент не найден")
    message = crud.create_general_message(
        db,
        payload.project_id,
        current_user.id,
        payload.content,
        payload.agent_id,
    )
    if not message:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return general_msg_to_response(message, current_user.name)


# ---------------------------------------------------------------------------
# Analysis council & approvals (JWT, PO for analyze)
# ---------------------------------------------------------------------------


def analysis_report_to_response(report: AnalysisReport) -> AnalysisReportResponse:
    return AnalysisReportResponse(
        id=report.id,
        project_id=report.project_id,
        task_id=report.task_id,
        user_idea=report.user_idea,
        winner_analyst=report.winner_analyst or "",
        winner_proposal=report.winner_proposal or "",
        report=report.report or "",
        created_at=report.created_at.isoformat() if report.created_at else None,
    )


def approval_to_response(
    approval: TaskApproval, db: Session, owner_id: int
) -> ApprovalResponse:
    task = crud.get_task(db, approval.task_id, owner_id)
    report_text = None
    if approval.report_id:
        report = db.query(AnalysisReport).filter(AnalysisReport.id == approval.report_id).first()
        report_text = report.report if report else None
    return ApprovalResponse(
        id=approval.id,
        project_id=approval.project_id,
        task_id=approval.task_id,
        report_id=approval.report_id,
        status=approval.status,
        rejection_reason=approval.rejection_reason or "",
        created_at=approval.created_at.isoformat() if approval.created_at else None,
        task=ApprovalTaskResponse(
            id=task.id,
            title=task.title,
            description=task.description or "",
            status=task.status,
            priority=task.priority,
            assignee_agent_id=task.assignee_agent_id,
        )
        if task
        else ApprovalTaskResponse(
            id=approval.task_id,
            title="Задача",
            description="",
            status="pending_approval",
            priority="Medium",
            assignee_agent_id=None,
        ),
        report=report_text,
    )


@app.post(
    "/api/projects/{project_id}/analyze",
    response_model=AnalyzeJobStartResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def analyze_idea(
    project_id: int,
    payload: AnalyzeIdeaRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
    _: None = Depends(require_po_role),
):
    project = crud.get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    job = crud.create_analysis_job(db, project_id, current_user.id, payload.idea)
    if not job:
        raise HTTPException(status_code=404, detail="Проект не найден")

    background_tasks.add_task(run_analysis_background, job.id)

    return AnalyzeJobStartResponse(
        job_id=job.id,
        status=job.status,
        message="Анализ запущен. Опросите статус через GET /analyze/jobs/{job_id}.",
    )


@app.get(
    "/api/projects/{project_id}/analyze/jobs/{job_id}",
    response_model=AnalyzeJobStatusResponse,
)
def get_analysis_job_status(
    project_id: int,
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    job = crud.get_analysis_job(db, job_id, project_id, current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Задача анализа не найдена")

    result = None
    if job.status == "completed" and job.result_json:
        try:
            result = AnalyzeIdeaResponse(**json.loads(job.result_json))
        except (json.JSONDecodeError, TypeError, ValueError):
            result = None

    return AnalyzeJobStatusResponse(
        job_id=job.id,
        status=job.status,
        progress=job.progress or "",
        result=result,
        error=job.error or None,
    )


async def run_analysis_background(job_id: int) -> None:
    db = SessionLocal()
    try:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job:
            return

        crud.update_analysis_job(
            db, job, status="running", progress="Совет аналитиков обсуждает идею..."
        )

        orchestrator = AgentOrchestrator(
            job.project_id, job.user_idea, db, job.owner_id
        )
        result = await orchestrator.run_full_analysis()

        crud.update_analysis_job(
            db,
            job,
            status="completed",
            progress="Готово",
            result_json=json.dumps(result, ensure_ascii=False),
            completed=True,
        )
    except HTTPException as exc:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            crud.update_analysis_job(
                db,
                job,
                status="failed",
                progress="Ошибка",
                error=str(exc.detail),
                completed=True,
            )
    except Exception as exc:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            crud.update_analysis_job(
                db,
                job,
                status="failed",
                progress="Ошибка",
                error=str(exc),
                completed=True,
            )
    finally:
        db.close()


@app.post(
    "/api/projects/{project_id}/analyze/sync",
    response_model=AnalyzeIdeaResponse,
    include_in_schema=False,
)
async def analyze_idea_sync(
    project_id: int,
    payload: AnalyzeIdeaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
    _: None = Depends(require_po_role),
):
    """Синхронный анализ (только для локальной отладки)."""
    project = crud.get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    orchestrator = AgentOrchestrator(
        project_id, payload.idea, db, current_user.id
    )
    try:
        result = await orchestrator.run_full_analysis()
    except HTTPException:
        raise
    except Exception as exc:
        from services.llm import DeepSeekError

        if isinstance(exc, DeepSeekError):
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка анализа: {exc}",
        ) from exc

    return AnalyzeIdeaResponse(**result)


@app.get(
    "/api/projects/{project_id}/analysis-history",
    response_model=list[AnalysisReportResponse],
)
def get_analysis_history(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    reports = crud.get_analysis_history(db, project_id, current_user.id)
    if not crud.get_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Проект не найден")
    return [analysis_report_to_response(r) for r in reports]


@app.get(
    "/api/projects/{project_id}/approvals",
    response_model=list[ApprovalResponse],
)
def list_approvals(
    project_id: int,
    pending_only: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    if not crud.get_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Проект не найден")
    approvals = crud.get_all_approvals(
        db, project_id, current_user.id, pending_only=pending_only
    )
    return [approval_to_response(a, db, current_user.id) for a in approvals]


@app.post("/api/projects/{project_id}/approvals/{task_id}/approve")
async def approve_task_endpoint(
    project_id: int,
    task_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
    _: None = Depends(require_po_role),
):
    approval = crud.get_task_approval(db, project_id, task_id, current_user.id)
    if not approval:
        raise HTTPException(status_code=404, detail="Согласование не найдено")
    task = crud.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    crud.approve_task(db, approval, task)
    background_tasks.add_task(run_task_execution, task_id)
    return {
        "message": "Задача утверждена, агенты начали работу",
        "task_id": task_id,
    }


@app.post("/api/projects/{project_id}/approvals/{task_id}/reject")
def reject_task_endpoint(
    project_id: int,
    task_id: int,
    payload: RejectApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
    _: None = Depends(require_po_role),
):
    approval = crud.get_task_approval(db, project_id, task_id, current_user.id)
    if not approval:
        raise HTTPException(status_code=404, detail="Согласование не найдено")
    task = crud.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    crud.reject_task(db, approval, task, payload.reason)
    return {"message": "Задача отправлена на доработку", "task_id": task_id}


# ---------------------------------------------------------------------------
# Artifacts (JWT, PO for approve/reject)
# ---------------------------------------------------------------------------


def artifact_to_response(artifact: Artifact, db: Session) -> ArtifactResponse:
    task = db.query(Task).filter(Task.id == artifact.task_id).first()
    agent = crud.get_agent(db, artifact.agent_id)
    return ArtifactResponse(
        id=artifact.id,
        task_id=artifact.task_id,
        task_title=task.title if task else "",
        project_id=artifact.project_id,
        agent_id=artifact.agent_id,
        agent_name=agent.name if agent else None,
        artifact_type=artifact.artifact_type,
        title=artifact.title,
        content=artifact.content,
        file_url=artifact.file_url,
        status=artifact.status,
        feedback=artifact.feedback,
        created_at=artifact.created_at.isoformat() if artifact.created_at else None,
        approved_at=artifact.approved_at.isoformat() if artifact.approved_at else None,
    )


@app.get(
    "/api/projects/{project_id}/artifacts/pending",
    response_model=list[ArtifactResponse],
)
def list_pending_artifacts(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    if not crud.get_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Проект не найден")
    rows = crud.get_pending_artifacts(db, project_id, current_user.id)
    return [artifact_to_response(a, db) for a in rows]


@app.get(
    "/api/projects/{project_id}/artifacts",
    response_model=list[ArtifactResponse],
)
def list_project_artifacts(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    if not crud.get_project(db, project_id, current_user.id):
        raise HTTPException(status_code=404, detail="Проект не найден")
    rows = crud.get_project_artifacts(db, project_id, current_user.id)
    return [artifact_to_response(a, db) for a in rows]


@app.post("/api/projects/{project_id}/artifacts/{artifact_id}/approve")
async def approve_artifact_endpoint(
    project_id: int,
    artifact_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
    _: None = Depends(require_po_role),
):
    artifact = crud.get_artifact(db, artifact_id, project_id, current_user.id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Артефакт не найден")
    crud.approve_artifact(db, artifact)
    background_tasks.add_task(run_artifact_continuation, artifact_id)
    return {
        "message": "Артефакт утверждён, запущен следующий этап",
        "artifact_id": artifact_id,
    }


@app.post("/api/projects/{project_id}/artifacts/{artifact_id}/reject")
def reject_artifact_endpoint(
    project_id: int,
    artifact_id: int,
    payload: RejectArtifactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
    _: None = Depends(require_po_role),
):
    artifact = crud.get_artifact(db, artifact_id, project_id, current_user.id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Артефакт не найден")
    crud.reject_artifact(db, artifact, payload.feedback)
    return {"message": "Артефакт отправлен на доработку", "artifact_id": artifact_id}
