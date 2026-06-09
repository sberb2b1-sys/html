from sqlalchemy.orm import Session

from models import Agent, ChatMessage, Project, Task, User

DEFAULT_AGENTS = [
    {
        "id": "ba",
        "name": "Бизнес Аналитик",
        "role": "Business Analyst",
        "system_prompt": "Ты — бизнес-аналитик IT-команды. Помогай с требованиями и user stories.",
        "is_online": True,
    },
    {
        "id": "sa",
        "name": "Системный Аналитик",
        "role": "System Analyst",
        "system_prompt": "Ты системный аналитик IT-команды.",
        "is_online": True,
    },
    {
        "id": "arch",
        "name": "Архитектор",
        "role": "Architect",
        "system_prompt": "Ты архитектор программных систем.",
        "is_online": True,
    },
    {
        "id": "fe",
        "name": "Фронтенд Разработчик",
        "role": "Frontend Developer",
        "system_prompt": "Ты фронтенд-разработчик.",
        "is_online": True,
    },
    {
        "id": "be",
        "name": "Бэкенд Разработчик",
        "role": "Backend Developer",
        "system_prompt": "Ты бэкенд-разработчик.",
        "is_online": True,
    },
    {
        "id": "lead",
        "name": "Лид Разработки",
        "role": "Tech Lead",
        "system_prompt": "Ты технический лид команды.",
        "is_online": True,
    },
    {
        "id": "design",
        "name": "Дизайнер",
        "role": "UI/UX Designer",
        "system_prompt": "Ты UI/UX дизайнер.",
        "is_online": True,
    },
    {
        "id": "sm",
        "name": "Скрам Мастер",
        "role": "Scrum Master",
        "system_prompt": "Ты скрам-мастер команды.",
        "is_online": True,
    },
]


def seed_agents(db: Session) -> None:
    if db.query(Agent).count() > 0:
        return
    for agent_data in DEFAULT_AGENTS:
        db.add(Agent(**agent_data))
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
    """owner_id всегда из JWT (current_user.id), не из тела запроса."""
    if not owner_id:
        raise ValueError("owner_id обязателен при создании проекта")
    safe_data = {k: v for k, v in data.items() if k != "owner_id"}
    project = Project(owner_id=owner_id, **safe_data)
    db.add(project)
    db.commit()
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


# Tasks
def get_tasks(
    db: Session, owner_id: int, project_id: int | None = None
) -> list[Task]:
    query = db.query(Task).filter(Task.owner_id == owner_id)
    if project_id is not None:
        query = query.filter(Task.project_id == project_id)
    return query.order_by(Task.created_at.desc()).all()


def get_task(db: Session, task_id: int, owner_id: int) -> Task | None:
    return (
        db.query(Task)
        .filter(Task.id == task_id, Task.owner_id == owner_id)
        .first()
    )


def create_task(db: Session, owner_id: int, data: dict) -> Task:
    """owner_id всегда из JWT (current_user.id), не из тела запроса."""
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
        if value is not None:
            setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()


# Agents
def get_agents(db: Session) -> list[Agent]:
    return db.query(Agent).order_by(Agent.name).all()


def get_agent(db: Session, agent_id: str) -> Agent | None:
    return db.query(Agent).filter(Agent.id == agent_id).first()


# Chat
def create_chat_message(
    db: Session,
    user_id: int,
    agent_id: str,
    user_message: str,
    agent_response: str,
) -> ChatMessage:
    message = ChatMessage(
        user_id=user_id,
        agent_id=agent_id,
        user_message=user_message,
        agent_response=agent_response,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_chat_messages(db: Session, user_id: int, agent_id: str) -> list[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id, ChatMessage.agent_id == agent_id)
        .order_by(ChatMessage.timestamp.asc())
        .all()
    )


def get_chat_message(db: Session, message_id: int, user_id: int) -> ChatMessage | None:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.id == message_id, ChatMessage.user_id == user_id)
        .first()
    )


def update_chat_message_text(
    db: Session, message_id: int, user_id: int, user_message: str
) -> ChatMessage | None:
    message = get_chat_message(db, message_id, user_id)
    if not message:
        return None
    message.user_message = user_message
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
