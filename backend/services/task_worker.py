"""Воркер выполнения задач: генерация артефактов по цепочке агентов."""

from __future__ import annotations

from datetime import datetime, timezone

import crud
from database import SessionLocal
from models import Agent, Artifact, Project, Task
from services.artifact_generator import ArtifactGenerator

# slug агента проекта для каждого типа артефакта
AGENT_SLUGS = {
    "BRD": "ba",
    "SRS": "sa",
    "architecture": "arch",
    "code": "be",
    "test_plan": "qa",
}

NEXT_ARTIFACT = {
    "BRD": "SRS",
    "SRS": "architecture",
    "architecture": "code",
    "code": "test_plan",
}

PHASE_BY_TYPE = {
    "BRD": "analysis",
    "SRS": "specification",
    "architecture": "architecture",
    "code": "development",
    "test_plan": "testing",
}


class TaskWorker:
    def _agent_by_slug(self, db, project_id: int, slug: str) -> Agent | None:
        agent_id = crud.make_agent_id(project_id, slug)
        return crud.get_agent(db, agent_id)

    def _project_context(self, db, project_id: int) -> str:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return ""
        return f"{project.name}: {project.description or ''}"

    def send_agent_message(
        self, db, project_id: int, owner_id: int, agent_id: str, message: str
    ) -> None:
        crud.add_chat_message(
            db, owner_id, project_id, agent_id, "assistant", message
        )

    def _save_artifact(
        self,
        db,
        task: Task,
        agent_id: str,
        artifact_type: str,
        data: dict,
    ) -> Artifact:
        artifact = crud.create_artifact(
            db,
            task_id=task.id,
            project_id=task.project_id,
            agent_id=agent_id,
            artifact_type=artifact_type,
            title=data.get("title", artifact_type),
            content=data.get("content", ""),
            file_url=data.get("file_url") or data.get("diagram_url"),
            status="pending_approval",
        )
        task.status = "waiting_approval"
        task.current_phase = PHASE_BY_TYPE.get(artifact_type, task.current_phase)
        task.current_agent_id = agent_id
        task.current_artifact_id = artifact.id
        db.commit()
        db.refresh(task)
        return artifact

    async def execute_task(self, task_id: int) -> None:
        """Старт работы после утверждения задачи PO."""
        db = SessionLocal()
        try:
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task or task.status not in {"approved", "todo"}:
                return

            task.status = "in_progress"
            task.current_phase = "analysis"
            db.commit()

            await self._produce_artifact(db, task, "BRD")
        finally:
            db.close()

    async def continue_after_artifact_approval(self, artifact_id: int) -> None:
        db = SessionLocal()
        try:
            artifact = db.query(Artifact).filter(Artifact.id == artifact_id).first()
            if not artifact or artifact.status != "approved":
                return

            task = db.query(Task).filter(Task.id == artifact.task_id).first()
            if not task:
                return

            next_type = NEXT_ARTIFACT.get(artifact.artifact_type)
            if not next_type:
                task.status = "done"
                task.current_phase = "completed"
                db.commit()
                agent = crud.get_agent(db, artifact.agent_id)
                if agent:
                    self.send_agent_message(
                        db,
                        task.project_id,
                        task.owner_id,
                        agent.id,
                        f"Задача «{task.title}» завершена. Все артефакты согласованы.",
                    )
                return

            task.status = "in_progress"
            db.commit()
            await self._produce_artifact(db, task, next_type, prior_content=artifact.content)
        finally:
            db.close()

    async def _produce_artifact(
        self,
        db,
        task: Task,
        artifact_type: str,
        prior_content: str | None = None,
    ) -> None:
        slug = AGENT_SLUGS.get(artifact_type)
        agent = self._agent_by_slug(db, task.project_id, slug) if slug else None
        if not agent:
            return

        self.send_agent_message(
            db,
            task.project_id,
            task.owner_id,
            agent.id,
            f"Приступаю к работе над задачей «{task.title}» ({artifact_type}).",
        )

        project_context = self._project_context(db, task.project_id)
        owner_id = task.owner_id

        if artifact_type == "BRD":
            data = await ArtifactGenerator.generate_brd(
                db, owner_id, task.description or task.title, project_context
            )
        elif artifact_type == "SRS":
            brd = prior_content or self._latest_content(db, task.id, "BRD")
            data = await ArtifactGenerator.generate_srs(db, owner_id, brd)
        elif artifact_type == "architecture":
            srs = prior_content or self._latest_content(db, task.id, "SRS")
            data = await ArtifactGenerator.generate_architecture(db, owner_id, srs)
        elif artifact_type == "code":
            arch = prior_content or self._latest_content(db, task.id, "architecture")
            data = await ArtifactGenerator.generate_code(
                db, owner_id, arch, task.description or task.title
            )
        elif artifact_type == "test_plan":
            code = prior_content or self._latest_content(db, task.id, "code")
            data = await ArtifactGenerator.generate_test_plan(
                db, owner_id, code, task.description or task.title
            )
        else:
            return

        artifact = self._save_artifact(db, task, agent.id, artifact_type, data)
        self.send_agent_message(
            db,
            task.project_id,
            task.owner_id,
            agent.id,
            f"Артефакт «{artifact.title}» ({artifact_type}) готов и отправлен на согласование PO.",
        )

    def _latest_content(self, db, task_id: int, artifact_type: str) -> str:
        row = (
            db.query(Artifact)
            .filter(
                Artifact.task_id == task_id,
                Artifact.artifact_type == artifact_type,
            )
            .order_by(Artifact.created_at.desc())
            .first()
        )
        return row.content if row else ""


async def run_task_execution(task_id: int) -> None:
    await TaskWorker().execute_task(task_id)


async def run_artifact_continuation(artifact_id: int) -> None:
    await TaskWorker().continue_after_artifact_approval(artifact_id)
