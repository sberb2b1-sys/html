# Деплой бэкенда на Render (бесплатно)

## 1. Создать сервис на Render

1. Зайдите на https://render.com и войдите через GitHub
2. **New → Blueprint** (или **New → Web Service**)
3. Подключите репозиторий `sberb2b1-sys/html`
4. Render подхватит `render.yaml` автоматически (Blueprint)
5. Нажмите **Apply** и дождитесь деплоя (~3–5 мин)

После деплоя API будет доступен по адресу вида:
`https://itteam-api.onrender.com/api`

Проверка: откройте в браузере — должно быть `{"message":"API is working"}`

## 2. Связать с фронтом (itteam.tech)

### Вариант A — свой поддомен api.itteam.tech

1. В Render: **Settings → Custom Domains → Add** → `api.itteam.tech`
2. Render покажет CNAME (например `itteam-api.onrender.com`)
3. В **reg.ru** → DNS для `itteam.tech`:
   - Тип: **CNAME**
   - Имя: **api**
   - Значение: `itteam-api.onrender.com` (как в Render)
4. Подождите 10–30 мин, пока DNS обновится

### Вариант B — сразу через Render URL (быстрее)

1. Скопируйте URL сервиса, например `https://itteam-api.onrender.com`
2. В GitHub: **Settings → Secrets and variables → Actions → Variables**
   - `VITE_API_URL` = `https://itteam-api.onrender.com/api`
3. **Actions → Build and push gh-pages → Run workflow**

## 3. Пересобрать фронт

После установки `VITE_API_URL` запустите workflow **Build and push gh-pages**  
(или сделайте любой push в `main`).

---

## VPS (reg.ru) — альтернатива

```bash
curl -fsSL https://raw.githubusercontent.com/sberb2b1-sys/html/main/deploy/setup-vps.sh | sudo bash
sudo certbot --nginx -d api.itteam.tech
```

В GitHub Variables: `VITE_API_URL=https://api.itteam.tech/api`
