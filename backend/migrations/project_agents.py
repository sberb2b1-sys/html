"""Миграция: агенты и чаты привязаны к проекту."""

from sqlalchemy import inspect, text

from database import engine


def _column_names(inspector, table: str) -> set[str]:
    if table not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(table)}


def run_project_agents_migration() -> None:
    from crud import DEFAULT_AGENTS, make_agent_id

    inspector = inspect(engine)

    with engine.begin() as conn:
        agent_cols = _column_names(inspector, "agents")
        if "agents" in inspector.get_table_names() and "project_id" not in agent_cols:
            conn.execute(text("ALTER TABLE agents ADD COLUMN project_id INTEGER"))

        chat_cols = _column_names(inspector, "chat_messages")
        if "chat_messages" in inspector.get_table_names() and "project_id" not in chat_cols:
            conn.execute(text("ALTER TABLE chat_messages ADD COLUMN project_id INTEGER"))

    # Копии агентов для каждого проекта
    from sqlalchemy.orm import Session

    from models import Agent, ChatMessage, Project, Task

    with Session(engine) as db:
        projects = db.query(Project).all()
        for project in projects:
            for template in DEFAULT_AGENTS:
                slug = template["id"]
                agent_id = make_agent_id(project.id, slug)
                existing = db.query(Agent).filter(Agent.id == agent_id).first()
                if existing:
                    if existing.project_id is None:
                        existing.project_id = project.id
                    continue
                db.add(
                    Agent(
                        id=agent_id,
                        project_id=project.id,
                        name=template["name"],
                        role=template["role"],
                        system_prompt=template["system_prompt"],
                        is_online=template.get("is_online", True),
                    )
                )

        # Старые глобальные агенты (id без префикса проекта)
        legacy_agents = (
            db.query(Agent)
            .filter(Agent.project_id.is_(None))
            .all()
        )
        for legacy in legacy_agents:
            if "_" in legacy.id:
                continue
            slug = legacy.id
            for project in projects:
                new_id = make_agent_id(project.id, slug)
                if not db.query(Agent).filter(Agent.id == new_id).first():
                    db.add(
                        Agent(
                            id=new_id,
                            project_id=project.id,
                            name=legacy.name,
                            role=legacy.role,
                            system_prompt=legacy.system_prompt or "",
                            avatar_url=legacy.avatar_url or "",
                            is_online=legacy.is_online,
                        )
                    )
                db.query(Task).filter(
                    Task.project_id == project.id,
                    Task.assignee_agent_id == slug,
                ).update({Task.assignee_agent_id: new_id}, synchronize_session=False)
                db.query(ChatMessage).filter(
                    ChatMessage.agent_id == slug,
                    ChatMessage.project_id.is_(None),
                ).update(
                    {ChatMessage.agent_id: new_id, ChatMessage.project_id: project.id},
                    synchronize_session=False,
                )
            db.delete(legacy)

        # Проставить project_id в чатах по агенту
        for msg in db.query(ChatMessage).filter(ChatMessage.project_id.is_(None)).all():
            agent = db.query(Agent).filter(Agent.id == msg.agent_id).first()
            if agent and agent.project_id:
                msg.project_id = agent.project_id

        db.commit()
