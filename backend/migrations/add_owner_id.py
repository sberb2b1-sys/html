"""
Миграция: добавление owner_id в projects и tasks без удаления данных.

Запуск вручную:
    cd backend && python -m migrations.add_owner_id
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

DEFAULT_OWNER_ID = 1


def _table_columns(inspector, table: str) -> set[str]:
    if table not in inspector.get_table_names():
        return set()
    return {col["name"] for col in inspector.get_columns(table)}


def _add_column(conn, table: str, column: str, ddl: str) -> bool:
    """Возвращает True, если колонка была добавлена."""
    inspector = inspect(conn)
    columns = _table_columns(inspector, table)
    if column in columns:
        return False
    conn.execute(text(ddl))
    return True


def _backfill_owner_id(
    conn,
    table: str,
    owner_column: str = "owner_id",
    legacy_user_column: str | None = "user_id",
) -> int:
    """
    Проставляет owner_id для строк с NULL.
    Сначала копирует из user_id (если колонка есть), иначе DEFAULT_OWNER_ID.
    """
    inspector = inspect(conn)
    columns = _table_columns(inspector, table)
    if owner_column not in columns:
        return 0

    updated = 0

    if legacy_user_column and legacy_user_column in columns:
        result = conn.execute(
            text(
                f"""
                UPDATE {table}
                SET {owner_column} = {legacy_user_column}
                WHERE {owner_column} IS NULL AND {legacy_user_column} IS NOT NULL
                """
            )
        )
        updated += result.rowcount or 0

    result = conn.execute(
        text(
            f"""
            UPDATE {table}
            SET {owner_column} = :default_owner
            WHERE {owner_column} IS NULL
            """
        ),
        {"default_owner": DEFAULT_OWNER_ID},
    )
    updated += result.rowcount or 0
    return updated


def migrate_projects(conn) -> dict:
    added = _add_column(
        conn,
        "projects",
        "owner_id",
        "ALTER TABLE projects ADD COLUMN owner_id INTEGER REFERENCES users(id)",
    )
    backfilled = _backfill_owner_id(conn, "projects")
    return {"column_added": added, "rows_backfilled": backfilled}


def migrate_tasks(conn) -> dict:
    inspector = inspect(conn)
    columns = _table_columns(inspector, "tasks")

    if "tasks" not in inspector.get_table_names():
        return {"column_added": False, "rows_backfilled": 0, "used_user_id": False}

    added = False
    used_user_id = "user_id" in columns

    if "owner_id" not in columns:
        _add_column(
            conn,
            "tasks",
            "owner_id",
            "ALTER TABLE tasks ADD COLUMN owner_id INTEGER REFERENCES users(id)",
        )
        added = True

    backfilled = _backfill_owner_id(
        conn,
        "tasks",
        owner_column="owner_id",
        legacy_user_column="user_id" if used_user_id else None,
    )
    return {
        "column_added": added,
        "rows_backfilled": backfilled,
        "used_user_id": used_user_id,
    }


def run_migration(engine: Engine) -> dict:
    """Применяет миграцию owner_id. Безопасно вызывать повторно."""
    summary: dict = {}

    with engine.begin() as conn:
        summary["projects"] = migrate_projects(conn)
        summary["tasks"] = migrate_tasks(conn)

    return summary


def main() -> None:
    from database import engine

    result = run_migration(engine)
    print("Миграция add_owner_id выполнена:")
    print(f"  projects: {result['projects']}")
    print(f"  tasks: {result['tasks']}")


if __name__ == "__main__":
    main()
