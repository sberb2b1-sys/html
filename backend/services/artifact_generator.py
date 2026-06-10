"""Генерация артефактов агентами через LLM."""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any

import crud
from services.llm import call_deepseek


def parse_json_response(raw: str) -> dict[str, Any]:
    text = (raw or "").strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"title": "Документ", "content": raw}


async def _llm_json(
    db,
    owner_id: int,
    system_prompt: str,
    user_prompt: str,
) -> dict[str, Any]:
    def invoke() -> str:
        user = crud.get_user(db, owner_id)
        if not user:
            raise ValueError("Пользователь не найден")
        crud.check_and_increment_llm_calls(db, user)
        return call_deepseek(
            [{"role": "user", "content": user_prompt}],
            system_prompt,
        )

    raw = await asyncio.to_thread(invoke)
    data = parse_json_response(raw)
    if not data.get("content"):
        data["content"] = raw
    if not data.get("title"):
        data["title"] = "Документ"
    return data


class ArtifactGenerator:
    @staticmethod
    async def generate_brd(
        db, owner_id: int, task_description: str, project_context: str
    ) -> dict[str, Any]:
        prompt = f"""
На основе задачи создай документ «Бизнес-требования» (BRD).

Задача: {task_description}
Контекст проекта: {project_context}

Ответь строго в JSON:
{{
  "title": "Название документа",
  "content": "Полный текст BRD: Цель, Аудитория, Функциональные требования, Нефункциональные требования, Риски"
}}
"""
        return await _llm_json(
            db,
            owner_id,
            "Ты — бизнес-аналитик. Создай BRD. Ответь только JSON.",
            prompt,
        )

    @staticmethod
    async def generate_srs(db, owner_id: int, brd_content: str) -> dict[str, Any]:
        prompt = f"""
На основе BRD создай «Техническое задание» (SRS).

BRD:
{brd_content[:6000]}

Ответь строго в JSON:
{{
  "title": "Техническое задание",
  "content": "Разделы: Обзор, API, Модели данных, Интеграции, Безопасность"
}}
"""
        return await _llm_json(
            db,
            owner_id,
            "Ты — системный аналитик. Создай SRS. Ответь только JSON.",
            prompt,
        )

    @staticmethod
    async def generate_architecture(
        db, owner_id: int, srs_content: str
    ) -> dict[str, Any]:
        prompt = f"""
На основе SRS создай архитектурное решение.

SRS:
{srs_content[:6000]}

Ответь строго в JSON:
{{
  "title": "Архитектурное решение",
  "content": "Компоненты, технологии, БД, интеграции, диаграмма текстом",
  "file_url": ""
}}
"""
        return await _llm_json(
            db,
            owner_id,
            "Ты — архитектор ПО. Создай архитектуру. Ответь только JSON.",
            prompt,
        )

    @staticmethod
    async def generate_code(
        db, owner_id: int, architecture: str, task_description: str
    ) -> dict[str, Any]:
        prompt = f"""
На основе архитектуры и задачи напиши код.

Архитектура:
{architecture[:4000]}

Задача: {task_description}

Ответь строго в JSON:
{{
  "title": "Код решения",
  "content": "Код на Python/FastAPI и React с комментариями",
  "file_url": ""
}}
"""
        return await _llm_json(
            db,
            owner_id,
            "Ты — разработчик. Напиши рабочий код. Ответь только JSON.",
            prompt,
        )

    @staticmethod
    async def generate_test_plan(
        db, owner_id: int, code_content: str, task_description: str
    ) -> dict[str, Any]:
        prompt = f"""
На основе кода создай план тестирования.

Задача: {task_description}

Код:
{code_content[:4000]}

Ответь строго в JSON:
{{
  "title": "План тестирования",
  "content": "Сценарии, unit-тесты, интеграционные тесты, критерии приёмки"
}}
"""
        return await _llm_json(
            db,
            owner_id,
            "Ты — QA-инженер. Создай план тестирования. Ответь только JSON.",
            prompt,
        )
