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

### Что сделать один раз (важно!)

1. Откройте https://github.com/sberb2b1-sys/html/settings/pages
2. **Build and deployment → Source:** выберите **Deploy from a branch**
3. **Branch:** `gh-pages` → папка `/ (root)` → **Save**
4. Подождите 1–2 минуты после push в `main` — workflow соберёт `dist/` и запушит в `gh-pages`
5. (Опционально) **Settings → Secrets and variables → Actions → Variables**  
   `VITE_API_URL` = `https://api.itteam.tech/api` (после развёртывания бэкенда)

> Если Source остаётся `main` — сайт будет отдавать исходники (`/src/main.jsx`) и экран останется белым.

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
