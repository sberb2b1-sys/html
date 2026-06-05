import os
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

import auth
import crud
from database import Base, engine, get_db, run_legacy_migrations
from migrations.add_owner_id import run_migration as run_owner_id_migration
from models import Agent, Project, Task, User

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
    assignee_agent_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    project_id: Optional[int] = None
    assignee_agent_id: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: str


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    project_id: Optional[int] = None
    assignee_agent_id: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class AgentResponse(BaseModel):
    id: str
    name: str
    role: str
    system_prompt: str
    is_online: bool

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatResponse(BaseModel):
    id: int
    agent_id: str
    user_message: str
    agent_response: str
    reply: str
    timestamp: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Mock-ответы чата (без DeepSeek)
# ---------------------------------------------------------------------------

MOCK_AGENT_REPLIES: dict[str, str] = {
    "ba": (
        "Принял ваш запрос как бизнес-аналитик. «{message}» — предлагаю оформить "
        "user story и критерии приёмки. [mock]"
    ),
    "sa": (
        "Как системный аналитик уточню детали по «{message}» и подготовлю "
        "техническое описание. [mock]"
    ),
    "arch": (
        "С точки зрения архитектуры по теме «{message}» рекомендую разбить "
        "на сервисы и описать интеграции. [mock]"
    ),
    "fe": (
        "Фронтенд-перспектива: для «{message}» нужны компоненты, состояние "
        "и маршрутизация. [mock]"
    ),
    "be": (
        "Бэкенд-перспектива: для «{message}» спроектируем API и модели данных. [mock]"
    ),
    "lead": (
        "Как техлид по «{message}» оценю риски, сроки и распределю задачи команде. [mock]"
    ),
    "design": (
        "Дизайнерский взгляд на «{message}»: набросаю wireframe и UI-паттерны. [mock]"
    ),
    "sm": (
        "Скрам-мастер: по «{message}» добавим в бэклог и спланируем спринт. [mock]"
    ),
}

DEFAULT_MOCK_REPLY = (
    "Спасибо за сообщение! {agent_name} ({role}) получил: «{message}». [mock]"
)


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_owner_id_migration(engine)
    run_legacy_migrations()
    db = next(get_db())
    try:
        crud.seed_agents(db)
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
        assignee_agent_id=task.assignee_agent_id,
        created_at=task.created_at.isoformat() if task.created_at else None,
    )


def generate_mock_response(agent: Agent, message: str) -> str:
    template = MOCK_AGENT_REPLIES.get(agent.id)
    if template:
        return template.format(message=message)
    return DEFAULT_MOCK_REPLY.format(
        agent_name=agent.name,
        role=agent.role,
        message=message,
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
    task = crud.create_task(db, current_user.id, payload.model_dump())
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
# Agents (JWT)
# ---------------------------------------------------------------------------


@app.get("/api/agents", response_model=list[AgentResponse])
def list_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    return crud.get_agents(db)


# ---------------------------------------------------------------------------
# Chat — mock (JWT)
# ---------------------------------------------------------------------------


@app.post("/api/chat/{agent_id}", response_model=ChatResponse)
def send_chat_message(
    agent_id: str,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    agent = crud.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Агент не найден")

    agent_response = generate_mock_response(agent, payload.message)
    message = crud.create_chat_message(
        db,
        user_id=current_user.id,
        agent_id=agent_id,
        user_message=payload.message,
        agent_response=agent_response,
    )

    return ChatResponse(
        id=message.id,
        agent_id=message.agent_id,
        user_message=message.user_message,
        agent_response=message.agent_response,
        reply=message.agent_response,
        timestamp=message.timestamp.isoformat() if message.timestamp else None,
    )
