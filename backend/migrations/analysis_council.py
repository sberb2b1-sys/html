"""Миграция: таблицы совета аналитиков и согласований."""

from sqlalchemy import inspect, text

from database import engine


def run_analysis_council_migration() -> None:
    insp = inspect(engine)
    tables = insp.get_table_names()

    with engine.begin() as conn:
        if "analysis_reports" not in tables:
            conn.execute(
                text(
                    """
                    CREATE TABLE analysis_reports (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        project_id INTEGER NOT NULL,
                        task_id INTEGER,
                        user_idea TEXT NOT NULL,
                        winner_analyst VARCHAR(255) DEFAULT '',
                        winner_proposal TEXT DEFAULT '',
                        report TEXT DEFAULT '',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(project_id) REFERENCES projects(id),
                        FOREIGN KEY(task_id) REFERENCES tasks(id)
                    )
                    """
                )
            )

        if "analysis_proposals" not in tables:
            conn.execute(
                text(
                    """
                    CREATE TABLE analysis_proposals (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        report_id INTEGER NOT NULL,
                        analyst_name VARCHAR(255) NOT NULL,
                        analyst_style VARCHAR(50) DEFAULT '',
                        proposal TEXT NOT NULL,
                        votes INTEGER DEFAULT 0 NOT NULL,
                        FOREIGN KEY(report_id) REFERENCES analysis_reports(id)
                    )
                    """
                )
            )

        if "task_approvals" not in tables:
            conn.execute(
                text(
                    """
                    CREATE TABLE task_approvals (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        project_id INTEGER NOT NULL,
                        task_id INTEGER NOT NULL UNIQUE,
                        report_id INTEGER,
                        status VARCHAR(50) DEFAULT 'pending' NOT NULL,
                        rejection_reason TEXT DEFAULT '',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(project_id) REFERENCES projects(id),
                        FOREIGN KEY(task_id) REFERENCES tasks(id),
                        FOREIGN KEY(report_id) REFERENCES analysis_reports(id)
                    )
                    """
                )
            )

        if "analysis_jobs" not in tables:
            conn.execute(
                text(
                    """
                    CREATE TABLE analysis_jobs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        project_id INTEGER NOT NULL,
                        owner_id INTEGER NOT NULL,
                        user_idea TEXT NOT NULL,
                        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
                        progress VARCHAR(255) DEFAULT '',
                        result_json TEXT DEFAULT '',
                        error TEXT DEFAULT '',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        completed_at TIMESTAMP,
                        FOREIGN KEY(project_id) REFERENCES projects(id),
                        FOREIGN KEY(owner_id) REFERENCES users(id)
                    )
                    """
                )
            )

    # Сид совет аналитиков для существующих проектов
    from sqlalchemy.orm import Session

    import crud
    from models import Agent, Project

    with Session(engine) as db:
        for project in db.query(Project).all():
            crud.seed_council_analysts_for_project(db, project.id)
            for template in crud.COUNCIL_EXTRA_AGENTS:
                agent_id = crud.make_agent_id(project.id, template["id"])
                if not db.query(Agent).filter(Agent.id == agent_id).first():
                    db.add(
                        Agent(
                            id=agent_id,
                            project_id=project.id,
                            name=template["name"],
                            role=template["role"],
                            system_prompt=template["system_prompt"],
                            is_online=True,
                        )
                    )
        db.commit()
