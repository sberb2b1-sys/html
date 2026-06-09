"""Миграции Спринта 2: спринты, LLM-лимиты, chat role/content, general_messages."""

from sqlalchemy import inspect, text

from database import Base, engine
from models import Agent, ChatMessage, GeneralMessage, Sprint, Task, User


def _column_names(inspector, table: str) -> set[str]:
    if table not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(table)}


def _migrate_chat_messages_legacy(conn, cols: set[str]) -> None:
    if "role" in cols:
        return
    if "user_message" not in cols:
        return

    rows = conn.execute(
        text(
            "SELECT id, user_id, agent_id, user_message, agent_response, timestamp "
            "FROM chat_messages"
        )
    ).mappings().all()

    conn.execute(text("DROP TABLE chat_messages"))
    ChatMessage.__table__.create(bind=conn)

    for row in rows:
        ts = row["timestamp"]
        uid = row["user_id"] or 1
        conn.execute(
            text(
                "INSERT INTO chat_messages (user_id, agent_id, role, content, created_at) "
                "VALUES (:uid, :aid, 'user', :content, :ts)"
            ),
            {
                "uid": uid,
                "aid": row["agent_id"],
                "content": row["user_message"],
                "ts": ts,
            },
        )
        conn.execute(
            text(
                "INSERT INTO chat_messages (user_id, agent_id, role, content, created_at) "
                "VALUES (:uid, :aid, 'assistant', :content, :ts)"
            ),
            {
                "uid": uid,
                "aid": row["agent_id"],
                "content": row["agent_response"],
                "ts": ts,
            },
        )


def run_sprint2_migrations() -> None:
    inspector = inspect(engine)

    Base.metadata.create_all(
        bind=engine,
        tables=[Sprint.__table__, GeneralMessage.__table__],
    )

    user_cols = _column_names(inspector, "users")
    if user_cols and "llm_calls_today" not in user_cols:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN llm_calls_today INTEGER DEFAULT 0")
            )
            conn.execute(text("ALTER TABLE users ADD COLUMN last_call_reset DATE"))

    task_cols = _column_names(inspector, "tasks")
    if task_cols and "sprint_id" not in task_cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN sprint_id INTEGER"))

    agent_cols = _column_names(inspector, "agents")
    if agent_cols and "avatar_url" not in agent_cols:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE agents ADD COLUMN avatar_url VARCHAR(500) DEFAULT ''")
            )

    chat_cols = _column_names(inspector, "chat_messages")
    if chat_cols and "role" not in chat_cols and "user_message" in chat_cols:
        with engine.begin() as conn:
            _migrate_chat_messages_legacy(conn, chat_cols)
    elif "chat_messages" not in inspector.get_table_names():
        ChatMessage.__table__.create(bind=engine)
