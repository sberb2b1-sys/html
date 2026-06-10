#!/bin/bash
# Обновление API на VPS после push в main.
# Запуск: sudo bash deploy/update-api.sh

set -euo pipefail

APP_DIR="/opt/itteam-api"
REPO="$APP_DIR/repo"

echo "==> Обновление кода..."
cd "$REPO"
git fetch origin
git reset --hard origin/main

echo "==> Зависимости Python (venv)..."
cd "$REPO/backend"
./venv/bin/pip install -q -r requirements.txt

echo "==> Очистка __pycache__ (могут ломать старт после деплоя от root)..."
find "$REPO/backend" -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

echo "==> Права для www-data..."
chown -R www-data:www-data "$REPO/backend"

echo "==> Проверка импорта от www-data..."
if ! sudo -u www-data bash -c "cd '$REPO/backend' && ./venv/bin/python -c 'from main import app'"; then
  echo "ОШИБКА: приложение не импортируется (см. traceback выше)"
  exit 1
fi

echo "==> Перезапуск itteam-api..."
systemctl restart itteam-api
sleep 2

echo "==> Проверка..."
if curl -sf http://127.0.0.1:8000/api >/dev/null; then
  echo "OK: $(curl -s http://127.0.0.1:8000/api)"
  curl -sf https://api.itteam.tech/api && echo ""
  systemctl is-active itteam-api
else
  echo "ОШИБКА: API не отвечает на порту 8000"
  systemctl status itteam-api --no-pager || true
  echo "--- journalctl (последние 80 строк) ---"
  journalctl -u itteam-api -n 80 --no-pager || true
  exit 1
fi
