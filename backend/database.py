from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./itteam.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_legacy_migrations() -> None:
    """Доп. колонки вне owner_id (например, user_id в chat_messages)."""
    inspector = inspect(engine)
    if "chat_messages" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("chat_messages")}
    if "user_id" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE chat_messages "
                    "ADD COLUMN user_id INTEGER REFERENCES users(id)"
                )
            )
            conn.execute(
                text(
                    "UPDATE chat_messages SET user_id = :uid WHERE user_id IS NULL"
                ),
                {"uid": 1},
            )
