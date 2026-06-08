# Деплой бэкенда на VPS reg.ru (Ubuntu)

Фронт: GitHub Pages → `https://itteam.tech`  
API: ваш VPS → `https://api.itteam.tech`

---

## Шаг 1. DNS в reg.ru

1. Зайдите в **reg.ru** → домен **itteam.tech** → **DNS-серверы / Ресурсные записи**
2. Добавьте **A-запись**:

| Тип | Имя (поддомен) | Значение |
|-----|----------------|----------|
| A | `api` | **IP вашего VPS** (из панели reg.ru → Cyan Hassium) |

> IP основного домена `itteam.tech` остаётся на GitHub Pages — менять его не нужно.

Подождите 5–30 минут, пока DNS обновится.

---

## Шаг 2. Подключиться к VPS по SSH

В панели reg.ru найдите **IP**, **логин** (обычно `root`) и **пароль**.

На Mac, в терминале:

```bash
ssh root@ВАШ_IP_VPS
```

При первом входе подтвердите fingerprint (`yes`).

---

## Шаг 3. Установить API (одна команда)

На VPS выполните:

```bash
curl -fsSL https://raw.githubusercontent.com/sberb2b1-sys/html/main/deploy/setup-vps.sh | sudo bash
```

Скрипт установит Python, nginx, клонирует репозиторий и запустит сервис `itteam-api`.

Проверка на VPS:

```bash
curl http://127.0.0.1:8000/api
# {"message":"API is working"}
```

---

## Шаг 4. SSL-сертификат (HTTPS)

Когда A-запись `api` уже указывает на VPS:

```bash
sudo certbot --nginx -d api.itteam.tech
```

- Введите email
- Согласитесь с условиями
- Выберите redirect на HTTPS (рекомендуется)

Проверка в браузере: https://api.itteam.tech/api  
→ `{"message":"API is working"}`

---

## Шаг 5. Связать фронт с API

1. GitHub → https://github.com/sberb2b1-sys/html/settings/variables/actions
2. **New repository variable:**
   - Name: `VITE_API_URL`
   - Value: `https://api.itteam.tech/api`
3. **Actions** → **Build and push gh-pages** → **Run workflow**
4. Подождите 2 мин, обновите https://itteam.tech/

---

## Шаг 6. Проверка регистрации

Откройте https://itteam.tech/register и создайте аккаунт.

---

## Полезные команды на VPS

```bash
# Статус API
sudo systemctl status itteam-api

# Перезапуск API
sudo systemctl restart itteam-api

# Логи API
sudo journalctl -u itteam-api -f

# Обновить код после push в GitHub
cd /opt/itteam-api/repo && sudo git pull
cd backend && sudo -u www-data venv/bin/pip install -r requirements.txt
sudo systemctl restart itteam-api
```

---

## Если что-то не работает

| Проблема | Решение |
|----------|---------|
| `curl api.itteam.tech` не отвечает | Проверьте A-запись `api` → IP VPS |
| certbot ошибка | DNS ещё не обновился — подождите |
| CORS / не подключается | Убедитесь, что `VITE_API_URL` задан и фронт пересобран |
| Порт закрыт | В панели reg.ru откройте порты **80** и **443** |

---

## Render (не нужен, если есть VPS)

Render — это альтернатива для тех, у кого **нет** своего сервера.  
У вас есть VPS на reg.ru — используйте его.
