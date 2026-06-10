from sqlalchemy import inspect, text

from database import engine


def run_add_sprints_migration() -> None:
    """Идемпотентная миграция: таблица sprints и колонка tasks.sprint_id."""
    insp = inspect(engine)

    with engine.begin() as conn:
        if "sprints" not in insp.get_table_names():
            conn.execute(
                text(
                    """
                    CREATE TABLE sprints (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT DEFAULT '',
                        start_date DATE NOT NULL,
                        end_date DATE NOT NULL,
                        status TEXT DEFAULT 'planning',
                        project_id INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (project_id) REFERENCES projects (id)
                    )
                    """
                )
            )
        else:
            sprint_cols = {c["name"] for c in insp.get_columns("sprints")}
            if "description" not in sprint_cols:
                conn.execute(text("ALTER TABLE sprints ADD COLUMN description TEXT DEFAULT ''"))
            if "created_at" not in sprint_cols:
                # SQLite: нельзя DEFAULT CURRENT_TIMESTAMP в ALTER TABLE
                conn.execute(text("ALTER TABLE sprints ADD COLUMN created_at TIMESTAMP"))
                conn.execute(
                    text(
                        "UPDATE sprints SET created_at = CURRENT_TIMESTAMP "
                        "WHERE created_at IS NULL"
                    )
                )

        if "tasks" in insp.get_table_names():
            task_cols = {c["name"] for c in insp.get_columns("tasks")}
            if "sprint_id" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN sprint_id INTEGER"))
