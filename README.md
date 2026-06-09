# IT Team

React + Vite фронтенд и FastAPI бэкенд — платформа управления мультиагентной IT-командой.

## Локальная разработка

```bash
# Фронтенд
npm install
npm run dev

# Бэкенд (второй терминал)
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Откройте http://localhost:5173

## Демо

### Демо-видео на сайте

Раздел **Демо** в приложении: https://itteam.tech/demo (после входа в систему).

### Как записать демо-видео (для PO)

Рекомендуемый сценарий (3–7 минут):

1. Регистрация и вход
2. Создание проекта и задачи в бэклоге
3. Чат с AI-агентом (ответ DeepSeek)
4. Вкладка «Спринты» и общий чат
5. Краткий обзор статистики

**Инструменты записи:**

| Инструмент | Платформа | Как использовать |
|------------|-----------|-------------------|
| **Loom** | Web, macOS, Windows | [loom.com](https://www.loom.com) → New Recording → Screen + Mic → Share link |
| **QuickTime** | macOS | File → New Screen Recording → выберите область → Stop → File → Export |
| **OBS Studio** | Win, macOS, Linux | [obsproject.com](https://obsproject.com) → Scene + Display Capture → Start Recording → MP4 |

**Советы:**

- Разрешение 1920×1080 или 1280×720
- Закройте лишние вкладки и уведомления
- Используйте тестовый аккаунт без реальных ПДн
- После записи загрузите на YouTube (unlisted) или Loom и добавьте ссылку в `/demo`

Шаблон презентации для клиентов: [PRESENTATION.md](./PRESENTATION.md)

## Деплой на itteam.tech (GitHub Pages)

Фронт: ветка `gh-pages`, workflow **Build and push gh-pages**.

### GitHub Pages (один раз)

1. https://github.com/sberb2b1-sys/html/settings/pages
2. **Source:** Deploy from a branch → `gh-pages` → `/ (root)`
3. Variable `VITE_API_URL` = `https://api.itteam.tech/api`

### DNS (reg.ru)

| Тип | Имя | Значение |
|-----|-----|----------|
| A | @ | 185.199.108.153 (и .109, .110, .111) |
| CNAME | www | sberb2b1-sys.github.io |
| A | api | IP VPS |

### Бэкенд на VPS

См. [deploy/BACKEND.md](./deploy/BACKEND.md)

```bash
cd /opt/itteam-api/repo
git fetch origin && git reset --hard origin/main
cd backend && ./venv/bin/pip install -r requirements.txt
systemctl restart itteam-api
```

## Структура проекта

```
src/           — React-приложение
backend/       — FastAPI API
deploy/        — скрипты деплоя
PRESENTATION.md — шаблон презентации для клиентов
```
