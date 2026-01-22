#!/bin/bash
# Быстрое развертывание POS на VPS с Docker
# Использование: bash deploy-docker.sh

set -e

echo "🚀 Начинаем развертывание POS системы..."
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Пожалуйста запустите скрипт с правами root (sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}1/7${NC} Обновление системы..."
apt update && apt upgrade -y

echo -e "${GREEN}2/7${NC} Установка Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker установлен"
else
    echo "✅ Docker уже установлен"
fi

echo -e "${GREEN}3/7${NC} Установка Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose -y
    echo "✅ Docker Compose установлен"
else
    echo "✅ Docker Compose уже установлен"
fi

echo -e "${GREEN}4/7${NC} Проверка портов..."
if netstat -tuln | grep -q ":8080 "; then
    echo -e "${YELLOW}⚠️  Порт 8080 занят. Останавливаем...${NC}"
    fuser -k 8080/tcp || true
fi

echo -e "${GREEN}5/7${NC} Запуск Docker контейнеров..."
cd "$(dirname "$0")"
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo -e "${GREEN}6/7${NC} Проверка статуса..."
sleep 5
docker-compose ps

echo ""
echo -e "${GREEN}7/7${NC} Настройка Nginx (опционально)..."
read -p "Хотите настроить Nginx для SSL? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    apt install nginx -y
    
    cat > /etc/nginx/sites-available/pos << 'NGINX_CONFIG'
server {
    listen 80;
    server_name pos.kruhn.eu;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_CONFIG

    ln -sf /etc/nginx/sites-available/pos /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    
    echo "Установить SSL сертификат? (y/n): "
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        apt install certbot python3-certbot-nginx -y
        certbot --nginx -d pos.kruhn.eu --non-interactive --agree-tos --email admin@kruhn.eu
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Развертывание завершено!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Статус сервисов:"
docker-compose ps
echo ""
echo "🌐 Доступ к приложению:"
if [ -f /etc/nginx/sites-enabled/pos ]; then
    echo "   https://pos.kruhn.eu (через Nginx)"
fi
echo "   http://$(hostname -I | awk '{print $1}'):8080 (прямой доступ)"
echo ""
echo "📝 Полезные команды:"
echo "   Логи:            docker-compose logs -f"
echo "   Перезапуск:      docker-compose restart"
echo "   Остановка:       docker-compose down"
echo "   Обновление:      git pull && docker-compose up -d --build"
echo ""
