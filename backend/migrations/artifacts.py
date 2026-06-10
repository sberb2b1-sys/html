"""Миграция: артефакты и поля фаз выполнения задач."""

from sqlalchemy import inspect, text

from database import engine


def run_artifacts_migration() -> None:
    insp = inspect(engine)

    with engine.begin() as conn:
        if "artifacts" not in insp.get_table_names():
            conn.execute(
                text(
                    """
                    CREATE TABLE artifacts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        task_id INTEGER NOT NULL,
                        project_id INTEGER NOT NULL,
                        agent_id VARCHAR(50) NOT NULL,
                        artifact_type VARCHAR(50) NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        content TEXT NOT NULL,
                        file_url VARCHAR(500),
                        status VARCHAR(50) DEFAULT 'draft' NOT NULL,
                        feedback TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        approved_at TIMESTAMP,
                        FOREIGN KEY(task_id) REFERENCES tasks(id),
                        FOREIGN KEY(project_id) REFERENCES projects(id),
                        FOREIGN KEY(agent_id) REFERENCES agents(id)
                    )
                    """
                )
            )

        task_cols = (
            {c["name"] for c in insp.get_columns("tasks")}
            if "tasks" in insp.get_table_names()
            else set()
        )
        if "current_phase" not in task_cols:
            conn.execute(
                text(
                    "ALTER TABLE tasks ADD COLUMN current_phase VARCHAR(50) DEFAULT 'analysis'"
                )
            )
        if "current_agent_id" not in task_cols:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN current_agent_id VARCHAR(50)"))
        if "current_artifact_id" not in task_cols:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN current_artifact_id INTEGER"))
