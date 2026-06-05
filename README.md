# IT Team

React + Vite фронтенд и FastAPI бэкенд.

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

## Деплой на itteam.tech (GitHub Pages)

Сейчас на сайте белый экран, потому что GitHub Pages отдаёт **исходники** (`/src/main.jsx`), а не собранный `dist/`.

### Что сделать один раз

1. В GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. (Опционально) **Settings → Secrets and variables → Actions → Variables**  
   Добавьте `VITE_API_URL` = `https://ваш-бэкенд/api`  
   Если бэкенд ещё не развёрнут — страница входа откроется, но логин не сработает.
3. Запушьте код в `main` — workflow `.github/workflows/deploy.yml` соберёт `dist/` и опубликует его.

### DNS (reg.ru)

Для кастомного домена на GitHub Pages:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | sberb2b1-sys.github.io |

Файл `public/CNAME` уже содержит `itteam.tech`.

### Бэкенд в production

GitHub Pages раздаёт только статику. API нужно хостить отдельно (VPS, Railway, Render и т.д.) и указать URL в `VITE_API_URL`.
