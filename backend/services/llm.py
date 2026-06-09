import os
from typing import Any

from openai import APIConnectionError, APITimeoutError, OpenAI, RateLimitError

DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1").rstrip("/")
DEFAULT_MODEL = "deepseek-chat"
DEFAULT_TIMEOUT = 60.0


class DeepSeekError(Exception):
    """Базовая ошибка вызова DeepSeek."""


class DeepSeekNotConfigured(DeepSeekError):
    pass


class DeepSeekTimeout(DeepSeekError):
    pass


class DeepSeekRateLimit(DeepSeekError):
    pass


class DeepSeekAPIError(DeepSeekError):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def _get_client() -> OpenAI:
    api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
    if not api_key:
        raise DeepSeekNotConfigured(
            "DEEPSEEK_API_KEY не задан. Добавьте ключ в backend/.env"
        )
    return OpenAI(api_key=api_key, base_url=DEEPSEEK_BASE_URL)


def call_deepseek(messages: list[dict[str, str]], system_prompt: str) -> str:
    """
    Вызов DeepSeek Chat Completions (OpenAI-совместимый API).

    messages: [{"role": "user"|"assistant", "content": "..."}, ...]
    system_prompt: системная инструкция агента
    """
    client = _get_client()
    model = os.getenv("DEEPSEEK_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    timeout = float(os.getenv("DEEPSEEK_TIMEOUT", str(DEFAULT_TIMEOUT)))

    api_messages: list[dict[str, Any]] = [
        {"role": "system", "content": system_prompt or "Ты полезный ассистент IT-команды."},
        *messages,
    ]

    try:
        response = client.chat.completions.create(
            model=model,
            messages=api_messages,
            temperature=0.7,
            timeout=timeout,
        )
    except APITimeoutError as exc:
        raise DeepSeekTimeout(
            "Превышено время ожидания ответа DeepSeek. Попробуйте позже."
        ) from exc
    except RateLimitError as exc:
        raise DeepSeekRateLimit(
            "DeepSeek временно ограничил запросы. Попробуйте через несколько минут."
        ) from exc
    except APIConnectionError as exc:
        raise DeepSeekAPIError(
            "Не удалось подключиться к DeepSeek API. Проверьте сеть.",
            status_code=None,
        ) from exc
    except Exception as exc:
        status = getattr(exc, "status_code", None)
        message = getattr(exc, "message", None) or str(exc)
        raise DeepSeekAPIError(
            f"Ошибка DeepSeek: {message}",
            status_code=status,
        ) from exc

    choice = response.choices[0] if response.choices else None
    if not choice or not choice.message or not choice.message.content:
        raise DeepSeekAPIError("Пустой ответ от DeepSeek")

    return choice.message.content.strip()
