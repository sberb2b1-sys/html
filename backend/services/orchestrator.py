"""Оркестратор автономного совета аналитиков."""

from __future__ import annotations

import asyncio
import re
from typing import Any

import crud
from models import Agent, Task
from services.llm import call_deepseek

ANALYST_ROLE = "Бизнес-аналитик"

ROLE_MATCHERS: dict[str, list[str]] = {
    "architect": ["architect", "архитектор"],
    "developer": ["developer", "разработчик", "tech lead", "лид"],
    "tester": ["tester", "тестиров", "qa"],
    "scrum": ["scrum", "скрам"],
}

STYLE_DESCRIPTIONS = {
    "conservative": "консерватор, предпочитаешь надёжные, проверенные технологии",
    "innovative": "инноватор, предлагаешь новейшие, передовые технологии",
    "pragmatic": "прагматик, ищешь баланс между качеством и стоимостью",
}

STYLE_BY_SLUG = {
    "ba_cons": "conservative",
    "ba_innov": "innovative",
    "ba_prag": "pragmatic",
}

AGENT_SUFFIX = (
    "\n\nОтвечай кратко и по существу. Не спрашивай разрешения. "
    "Твоя задача — решить проблему."
)


class AgentOrchestrator:
    def __init__(self, project_id: int, user_idea: str, db, owner_id: int):
        self.project_id = project_id
        self.user_idea = user_idea.strip()
        self.db = db
        self.owner_id = owner_id
        self.analysts: list[Agent] = []
        self.proposals: list[dict[str, Any]] = []
        self.winner: dict[str, Any] | None = None

    async def run_full_analysis(self) -> dict[str, Any]:
        self.analysts = crud.ensure_council_analysts(self.db, self.project_id)

        winner, report, proposals = await self.run_analyst_battle()

        architecture = await self.call_agent_by_role(
            "architect",
            f"Идея пользователя:\n{self.user_idea}\n\n"
            f"Выбранное решение аналитиков ({winner['analyst_name']}):\n"
            f"{winner['proposal']}\n\n"
            f"Разработай архитектуру системы: компоненты, API, БД, интеграции.",
        )

        dev_estimate = await self.call_agent_by_role(
            "developer",
            f"Архитектура:\n{architecture}\n\n"
            f"Оцени трудоёмкость в человеко-днях, укажи риски и этапы реализации.",
        )

        test_plan = await self.call_agent_by_role(
            "tester",
            f"Решение:\n{winner['proposal']}\n\n"
            f"Архитектура:\n{architecture}\n\n"
            f"Составь план тестирования: сценарии, граничные случаи, критерии приёмки.",
        )

        task = await self.create_task_from_solution(
            winner, architecture, dev_estimate, test_plan
        )

        analysis_report = crud.create_analysis_report(
            self.db,
            self.project_id,
            self.user_idea,
            winner["analyst_name"],
            winner["proposal"],
            report,
            task_id=task.id,
        )
        crud.save_analysis_proposals(self.db, analysis_report.id, proposals)
        crud.create_task_approval(
            self.db, self.project_id, task.id, analysis_report.id
        )

        return {
            "task_id": task.id,
            "report_id": analysis_report.id,
            "winner": winner["analyst_name"],
            "report": report,
            "message": (
                "Аналитики выбрали лучшее решение. "
                "Задача создана и ожидает согласования."
            ),
        }

    async def run_analyst_battle(self) -> tuple[dict[str, Any], str, list[dict]]:
        proposals: list[dict[str, Any]] = []

        for analyst in self.analysts:
            style = self.get_analyst_style(analyst)
            proposal_text = await self.call_agent(
                analyst,
                f"Идея пользователя: {self.user_idea}\n\n"
                f"Ты — {analyst.name} ({STYLE_DESCRIPTIONS.get(style, 'аналитик')}).\n"
                f"Предложи ТВОЁ решение. Будь конкретен: архитектура, технологии, "
                f"сроки, оценка в днях.\n"
                f"Не задавай вопросов, просто предложи решение.",
            )
            proposals.append(
                {
                    "analyst_id": analyst.id,
                    "analyst_name": analyst.name,
                    "style": style,
                    "proposal": proposal_text,
                    "votes": 0,
                }
            )

        for _round in range(3):
            for i, proposal in enumerate(proposals):
                critiques: list[str] = []
                for j, other in enumerate(proposals):
                    if i == j:
                        continue
                    other_agent = self._agent_by_id(other["analyst_id"])
                    if not other_agent:
                        continue
                    critique = await self.call_agent(
                        other_agent,
                        f"Предложение {proposal['analyst_name']}:\n{proposal['proposal']}\n\n"
                        f"Какие недостатки ты видишь? Будь конструктивен. "
                        f"Укажи 2-3 слабых места.",
                    )
                    critiques.append(f"{other['analyst_name']}: {critique}")

                analyst = self._agent_by_id(proposal["analyst_id"])
                if not analyst:
                    continue
                improved = await self.call_agent(
                    analyst,
                    f"Твоё предыдущее предложение:\n{proposal['proposal']}\n\n"
                    f"Критика коллег:\n{chr(10).join(critiques)}\n\n"
                    f"Улучши своё решение. Учти замечания, сделай сильнее.",
                )
                proposals[i]["proposal"] = improved

        for i, proposal in enumerate(proposals):
            total_votes = 0
            voters = 0
            for j, other in enumerate(proposals):
                if i == j:
                    continue
                other_agent = self._agent_by_id(other["analyst_id"])
                if not other_agent:
                    continue
                vote_response = await self.call_agent(
                    other_agent,
                    f"Оцени предложение {proposal['analyst_name']} от 1 до 10.\n\n"
                    f"Предложение:\n{proposal['proposal']}\n\n"
                    f"Критерии: надёжность, инновационность, реализуемость, стоимость.\n"
                    f"Ответь ТОЛЬКО одной цифрой — средняя оценка.",
                )
                score = self._parse_score(vote_response)
                total_votes += score
                voters += 1
            proposals[i]["votes"] = total_votes if voters else 0

        winner = max(proposals, key=lambda x: x["votes"])
        self.winner = winner
        self.proposals = proposals
        report = self.generate_report(proposals, winner)
        return winner, report, proposals

    async def call_agent_by_role(self, role_key: str, context: str) -> str:
        agent = self._find_agent_by_role(role_key)
        if not agent:
            return f"Агент ({role_key}) не найден в проекте"
        return await self.call_agent(agent, context)

    async def call_agent(self, agent: Agent, message: str) -> str:
        user = crud.get_user(self.db, self.owner_id)
        if not user:
            return "Пользователь не найден"

        def _invoke() -> str:
            crud.check_and_increment_llm_calls(self.db, user)
            system_prompt = (agent.system_prompt or "") + AGENT_SUFFIX
            return call_deepseek(
                [{"role": "user", "content": message}],
                system_prompt,
            )

        return await asyncio.to_thread(_invoke)

    async def create_task_from_solution(
        self,
        winner: dict[str, Any],
        architecture: str,
        dev_estimate: str,
        test_plan: str,
    ) -> Task:
        scrum_agent = self._find_agent_by_role("scrum")
        scrum_prompt = (
            scrum_agent.system_prompt if scrum_agent else "Ты — скрам-мастер IT-команды."
        )

        task_prompt = f"""
На основе проведённого анализа создай задачу для бэклога.

Победивший аналитик: {winner['analyst_name']}
Решение: {winner['proposal']}

Архитектура: {architecture}
Оценка разработчика: {dev_estimate}
План тестирования: {test_plan}

Создай задачу строго в формате:
НАЗВАНИЕ: [краткое название]
ОПИСАНИЕ: [подробное описание]
ПРИОРИТЕТ: [High/Medium/Low]
АГЕНТ: [имя исполнителя из команды]
"""

        def _invoke() -> str:
            user = crud.get_user(self.db, self.owner_id)
            crud.check_and_increment_llm_calls(self.db, user)
            return call_deepseek(
                [{"role": "user", "content": task_prompt}],
                scrum_prompt + AGENT_SUFFIX,
            )

        response = await asyncio.to_thread(_invoke)
        task_data = self.parse_task_response(response)

        assignee_id = self._resolve_assignee_id(task_data.get("agent_name", ""))
        if not assignee_id and scrum_agent:
            assignee_id = scrum_agent.id

        task = crud.create_task(
            self.db,
            self.owner_id,
            {
                "title": task_data.get("title", "Авто-созданная задача"),
                "description": task_data.get("description", winner["proposal"]),
                "priority": task_data.get("priority", "Medium"),
                "status": "pending_approval",
                "project_id": self.project_id,
                "assignee_agent_id": assignee_id,
            },
        )
        return task

    def generate_report(
        self, proposals: list[dict[str, Any]], winner: dict[str, Any]
    ) -> str:
        lines = [
            "# Отчёт об анализе идеи",
            "",
            "## Исходная идея",
            self.user_idea,
            "",
            "## Предложения аналитиков",
            "",
        ]
        for proposal in proposals:
            style_label = STYLE_DESCRIPTIONS.get(proposal.get("style", ""), proposal.get("style", ""))
            lines.extend(
                [
                    f"### {proposal['analyst_name']} ({style_label}) — голосов: {proposal['votes']}",
                    proposal["proposal"],
                    "",
                ]
            )

        lines.extend(
            [
                "## Победитель",
                f"**{winner['analyst_name']}** (голосов: {winner['votes']})",
                "",
                "## Итоговое решение",
                winner["proposal"],
                "",
                "---",
                "*Отчёт сгенерирован автоматически. Задача ожидает согласования PO.*",
            ]
        )
        return "\n".join(lines)

    def parse_task_response(self, response: str) -> dict[str, str]:
        def pick(pattern: str, default: str = "") -> str:
            match = re.search(pattern, response, re.IGNORECASE | re.MULTILINE)
            return match.group(1).strip() if match else default

        priority = pick(r"ПРИОРИТЕТ:\s*(.+)", "Medium")
        if priority not in {"High", "Medium", "Low"}:
            priority = "Medium"

        return {
            "title": pick(r"НАЗВАНИЕ:\s*(.+)", "Авто-созданная задача"),
            "description": pick(r"ОПИСАНИЕ:\s*(.+?)(?=ПРИОРИТЕТ:|АГЕНТ:|$)", response.replace("\n", " ")).strip()
            or response.strip()[:2000],
            "priority": priority,
            "agent_name": pick(r"АГЕНТ:\s*(.+)", ""),
        }

    def get_analyst_style(self, analyst: Agent) -> str:
        slug = analyst.id.split("_")[-1] if analyst.id else ""
        return STYLE_BY_SLUG.get(slug, "pragmatic")

    def _agent_by_id(self, agent_id: str) -> Agent | None:
        return crud.get_agent(self.db, agent_id)

    def _find_agent_by_role(self, role_key: str) -> Agent | None:
        needles = ROLE_MATCHERS.get(role_key, [role_key])
        agents = (
            self.db.query(Agent)
            .filter(Agent.project_id == self.project_id)
            .all()
        )
        for agent in agents:
            role_lower = (agent.role or "").lower()
            name_lower = (agent.name or "").lower()
            if any(n in role_lower or n in name_lower for n in needles):
                return agent
        return None

    def _resolve_assignee_id(self, agent_name: str) -> str | None:
        if not agent_name:
            return None
        agents = (
            self.db.query(Agent)
            .filter(Agent.project_id == self.project_id)
            .all()
        )
        name_lower = agent_name.lower()
        for agent in agents:
            if agent.name.lower() in name_lower or name_lower in agent.name.lower():
                return agent.id
        return None

    @staticmethod
    def _parse_score(text: str) -> int:
        match = re.search(r"\d+", text or "")
        if not match:
            return 7
        score = int(match.group())
        return max(1, min(10, score))
