import os
from datetime import date

from sqlalchemy.orm import Session

from models import Agent, ChatMessage, GeneralMessage, Project, Sprint, Task, User

TASK_CREATION_PROMPT = (
    " Если пользователь просит что-то сделать, что требует работы другого агента — "
    "предложи создать задачу и укажи название и описание. "
    'Например: «Создаю задачу для архитектора: „Спроектировать авторизацию через Google"».'
)

DEFAULT_AGENTS = [
    {
        "id": "ba",
        "name": "Бизнес Аналитик",
        "role": "Business Analyst",
        "system_prompt": "Ты — бизнес-аналитик IT-команды. Помогай с требованиями и user stories."
        + TASK_CREATION_PROMPT,
        "is_online": True,
    },
    {
        "id": "sa",
        "name": "Системный Аналитик",
        "role": "System Analyst",
        "system_prompt": "Ты системный аналитик IT-команды." + TASK_CREATION_PROMPT,
        "is_online": True,
    },
    {
        "id": "arch",
        "name": "Архитектор",
        "role": "Architect",
        "system_prompt": "Ты архитектор программных систем." + TASK_CREATION_PROMPT,
        "is_online": True,
    },
    {
        "id": "fe",
        "name": "Фронтенд Разработчик",
        "role": "Frontend Developer",
        "system_prompt": "Ты фронтенд-разработчик." + TASK_CREATION_PROMPT,
        "is_online": True,
    },
    {
        "id": "be",
        "name": "Бэкенд Разработчик",
        "role": "Backend Developer",
        "system_prompt": "Ты бэкенд-разработчик." + TASK_CREATION_PROMPT,
        "is_online": True,
    },
    {
        "id": "lead",
        "name": "Лид Разработки",
        "role": "Tech Lead",
        "system_prompt": "Ты технический лид команды." + TASK_CREATION_PROMPT,
        "is_online": True,
    },
    {
        "id": "design",
        "name": "Дизайнер",
        "role": "UI/UX Designer",
        "system_prompt": "Ты UI/UX дизайнер." + TASK_CREATION_PROMPT,
        "is_online": True,
    },
    {
        "id": "sm",
        "name": "Скрам Мастер",
        "role": "Scrum Master",
        "system_prompt": "Ты скрам-мастер команды." + TASK_CREATION_PROMPT,
        "is_online": True,
    },
]


def make_agent_id(project_id: int, slug: str) -> str:
    return f"{project_id}_{slug}"


def seed_agents_for_project(db: Session, project_id: int) -> None:
    for template in DEFAULT_AGENTS:
        agent_id = make_agent_id(project_id, template["id"])
        if db.query(Agent).filter(Agent.id == agent_id).first():
            continue
        db.add(
            Agent(
                id=agent_id,
                project_id=project_id,
                name=template["name"],
                role=template["role"],
                system_prompt=template["system_prompt"],
                is_online=template.get("is_online", True),
            )
        )
    db.commit()


def seed_agents(db: Session) -> None:
    """Устарело: агенты создаются при создании проекта."""
    projects = db.query(Project).all()
    for project in projects:
        seed_agents_for_project(db, project.id)


def ensure_agent_task_prompts(db: Session) -> None:
    marker = "предложи создать задачу"
    agents = db.query(Agent).all()
    changed = False
    for agent in agents:
        prompt = agent.system_prompt or ""
        if marker not in prompt:
            agent.system_prompt = prompt.rstrip() + TASK_CREATION_PROMPT
            changed = True
    if changed:
        db.commit()


# Users
def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, email: str, hashed_password: str, name: str) -> User:
    user = User(email=email, hashed_password=hashed_password, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def check_and_increment_llm_calls(db: Session, user: User) -> None:
    limit = int(os.getenv("DAILY_LLM_LIMIT", "100"))
    today = date.today()

    if user.last_call_reset != today:
        user.llm_calls_today = 0
        user.last_call_reset = today

    if user.llm_calls_today >= limit:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=429,
            detail="Лимит запросов исчерпан на сегодня",
        )

    user.llm_calls_today += 1
    db.commit()
    db.refresh(user)


# Projects
def get_projects(db: Session, owner_id: int) -> list[Project]:
    return (
        db.query(Project)
        .filter(Project.owner_id == owner_id)
        .order_by(Project.created_at.desc())
        .all()
    )


def get_project(db: Session, project_id: int, owner_id: int) -> Project | None:
    return (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == owner_id)
        .first()
    )


def create_project(db: Session, owner_id: int, data: dict) -> Project:
    if not owner_id:
        raise ValueError("owner_id обязателен при создании проекта")
    safe_data = {k: v for k, v in data.items() if k != "owner_id"}
    project = Project(owner_id=owner_id, **safe_data)
    db.add(project)
    db.flush()
    seed_agents_for_project(db, project.id)
    db.refresh(project)
    return project


def update_project(db: Session, project: Project, data: dict) -> Project:
    for key, value in data.items():
        if value is not None:
            setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()


# Sprints
def get_sprints(db: Session, project_id: int, owner_id: int) -> list[Sprint]:
    project = get_project(db, project_id, owner_id)
    if not project:
        return []
    return (
        db.query(Sprint)
        .filter(Sprint.project_id == project_id)
        .order_by(Sprint.start_date.desc())
        .all()
    )


def get_sprint(db: Session, sprint_id: int, owner_id: int) -> Sprint | None:
    return (
        db.query(Sprint)
        .join(Project)
        .filter(Sprint.id == sprint_id, Project.owner_id == owner_id)
        .first()
    )


def create_sprint(db: Session, owner_id: int, data: dict) -> Sprint | None:
    project = get_project(db, data["project_id"], owner_id)
    if not project:
        return None
    sprint = Sprint(**data)
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return sprint


def update_sprint(db: Session, sprint: Sprint, data: dict) -> Sprint:
    for key, value in data.items():
        if value is not None:
            setattr(sprint, key, value)
    db.commit()
    db.refresh(sprint)
    return sprint


def delete_sprint(db: Session, sprint: Sprint) -> None:
    db.query(Task).filter(Task.sprint_id == sprint.id).update({Task.sprint_id: None})
    db.delete(sprint)
    db.commit()


# Tasks
def get_tasks(
    db: Session, owner_id: int, project_id: int | None = None, sprint_id: int | None = None
) -> list[Task]:
    query = db.query(Task).filter(Task.owner_id == owner_id)
    if project_id is not None:
        query = query.filter(Task.project_id == project_id)
    if sprint_id is not None:
        query = query.filter(Task.sprint_id == sprint_id)
    return query.order_by(Task.created_at.desc()).all()


def get_task(db: Session, task_id: int, owner_id: int) -> Task | None:
    return (
        db.query(Task)
        .filter(Task.id == task_id, Task.owner_id == owner_id)
        .first()
    )


def create_task(db: Session, owner_id: int, data: dict) -> Task:
    if not owner_id:
        raise ValueError("owner_id обязателен при создании задачи")
    safe_data = {k: v for k, v in data.items() if k != "owner_id"}
    task = Task(owner_id=owner_id, **safe_data)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task: Task, data: dict) -> Task:
    for key, value in data.items():
        if value is not None or key == "sprint_id":
            setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()


def assign_task_sprint(
    db: Session, task: Task, sprint_id: int | None, owner_id: int
) -> Task | None:
    if sprint_id is not None:
        sprint = get_sprint(db, sprint_id, owner_id)
        if not sprint or sprint.project_id != task.project_id:
            return None
    task.sprint_id = sprint_id
    db.commit()
    db.refresh(task)
    return task


# Agents
def get_agents(db: Session, owner_id: int | None = None) -> list[Agent]:
    query = db.query(Agent)
    if owner_id is not None:
        query = query.join(Project).filter(Project.owner_id == owner_id)
    return query.order_by(Agent.name).all()


def get_agents_by_project(
    db: Session, project_id: int, owner_id: int
) -> list[Agent]:
    if not get_project(db, project_id, owner_id):
        return []
    return (
        db.query(Agent)
        .filter(Agent.project_id == project_id)
        .order_by(Agent.name)
        .all()
    )


def get_agent(db: Session, agent_id: str) -> Agent | None:
    return db.query(Agent).filter(Agent.id == agent_id).first()


def get_project_agent(
    db: Session, project_id: int, agent_id: str, owner_id: int
) -> Agent | None:
    if not get_project(db, project_id, owner_id):
        return None
    return (
        db.query(Agent)
        .filter(Agent.id == agent_id, Agent.project_id == project_id)
        .first()
    )


def create_agent(db: Session, project_id: int, owner_id: int, data: dict) -> Agent | None:
    if not get_project(db, project_id, owner_id):
        return None
    slug = data.get("slug") or data.get("id", "")
    agent_id = data.get("id") or make_agent_id(project_id, slug)
    if db.query(Agent).filter(Agent.id == agent_id).first():
        return None
    agent = Agent(
        id=agent_id,
        project_id=project_id,
        name=data["name"],
        role=data["role"],
        system_prompt=data.get("system_prompt", ""),
        avatar_url=data.get("avatar_url", ""),
        is_online=data.get("is_online", True),
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


def update_agent(db: Session, agent: Agent, data: dict) -> Agent:
    for key, value in data.items():
        if value is not None:
            setattr(agent, key, value)
    db.commit()
    db.refresh(agent)
    return agent


def delete_agent(db: Session, agent: Agent) -> None:
    db.query(Task).filter(Task.assignee_agent_id == agent.id).update(
        {Task.assignee_agent_id: None}
    )
    db.delete(agent)
    db.commit()


# Chat (role/content rows)
def add_chat_message(
    db: Session,
    user_id: int,
    project_id: int,
    agent_id: str,
    role: str,
    content: str,
) -> ChatMessage:
    message = ChatMessage(
        project_id=project_id,
        user_id=user_id,
        agent_id=agent_id,
        role=role,
        content=content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_chat_history(
    db: Session,
    user_id: int,
    project_id: int,
    agent_id: str,
    limit: int = 50,
) -> list[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user_id,
            ChatMessage.project_id == project_id,
            ChatMessage.agent_id == agent_id,
        )
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
        .all()[::-1]
    )


def get_chat_message(db: Session, message_id: int, user_id: int) -> ChatMessage | None:
    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id == message_id,
            ChatMessage.user_id == user_id,
            ChatMessage.role == "user",
        )
        .first()
    )


def update_chat_message_content(
    db: Session, message_id: int, user_id: int, content: str
) -> ChatMessage | None:
    message = get_chat_message(db, message_id, user_id)
    if not message:
        return None
    message.content = content
    db.commit()
    db.refresh(message)
    return message


def delete_chat_message(db: Session, message_id: int, user_id: int) -> bool:
    message = get_chat_message(db, message_id, user_id)
    if not message:
        return False
    db.delete(message)
    db.commit()
    return True


# General chat
def get_general_messages(
    db: Session, project_id: int, owner_id: int, limit: int = 100
) -> list[GeneralMessage]:
    project = get_project(db, project_id, owner_id)
    if not project:
        return []
    return (
        db.query(GeneralMessage)
        .filter(GeneralMessage.project_id == project_id)
        .order_by(GeneralMessage.created_at.asc())
        .limit(limit)
        .all()
    )


def create_general_message(
    db: Session,
    project_id: int,
    user_id: int,
    content: str,
    agent_id: str | None = None,
) -> GeneralMessage | None:
    project = get_project(db, project_id, user_id)
    if not project:
        return None
    message = GeneralMessage(
        project_id=project_id,
        user_id=user_id,
        content=content,
        agent_id=agent_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def update_general_message(
    db: Session, message_id: int, user_id: int, content: str
) -> GeneralMessage | None:
    message = (
        db.query(GeneralMessage)
        .filter(GeneralMessage.id == message_id, GeneralMessage.user_id == user_id)
        .first()
    )
    if not message:
        return None
    message.content = content
    db.commit()
    db.refresh(message)
    return message


def delete_general_message(db: Session, message_id: int, user_id: int) -> bool:
    message = (
        db.query(GeneralMessage)
        .filter(GeneralMessage.id == message_id, GeneralMessage.user_id == user_id)
        .first()
    )
    if not message:
        return False
    db.delete(message)
    db.commit()
    return True
