#!/bin/bash
# Запуск на VPS (Ubuntu/Debian) от root или через sudo
# Использование: bash deploy/setup-vps.sh

set -e

APP_DIR="/opt/itteam-api"
REPO_URL="https://github.com/sberb2b1-sys/html.git"

echo "==> Установка зависимостей..."
apt-get update -qq
apt-get install -y -qq python3 python3-venv python3-pip git nginx certbot python3-certbot-nginx

echo "==> Клонирование репозитория..."
mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/repo/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR/repo"
else
  cd "$APP_DIR/repo" && git pull
fi

echo "==> Настройка Python..."
cd "$APP_DIR/repo/backend"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

if [ ! -f .env ]; then
  SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
  cat > .env <<EOF
SECRET_KEY=$SECRET
EOF
  echo "Создан backend/.env с SECRET_KEY"
fi

echo "==> Systemd-сервис..."
cat > /etc/systemd/system/itteam-api.service <<EOF
[Unit]
Description=IT Team FastAPI
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR/repo/backend
EnvironmentFile=$APP_DIR/repo/backend/.env
ExecStart=$APP_DIR/repo/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

chown -R www-data:www-data "$APP_DIR/repo/backend"

systemctl daemon-reload
systemctl enable itteam-api
systemctl restart itteam-api

echo "==> Nginx..."
cp "$APP_DIR/repo/deploy/nginx-api.conf" /etc/nginx/sites-available/api.itteam.tech
ln -sf /etc/nginx/sites-available/api.itteam.tech /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Открыть порты, если включён ufw
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full'
fi

echo ""
echo "Готово! API слушает http://127.0.0.1:8000"
echo "Дальше:"
echo "  1. В reg.ru добавьте A-запись: api → IP этого VPS"
echo "  2. certbot --nginx -d api.itteam.tech"
echo "  3. В GitHub Variables: VITE_API_URL=https://api.itteam.tech/api"
