#!/bin/bash
# ============================================
# 🚀 ПОЛНАЯ УСТАНОВКА POS НА VPS
# Домен: pos.kruhn.eu:8080
# ============================================

echo "╔════════════════════════════════════════╗"
echo "║  🚀 Установка POS на pos.kruhn.eu     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Проверка root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Запустите с sudo: sudo bash install-vps.sh"
    exit 1
fi

echo -e "${BLUE}[1/8]${NC} Обновление системы..."
apt update && apt upgrade -y

echo -e "${BLUE}[2/8]${NC} Установка необходимых пакетов..."
apt install -y git curl wget

echo -e "${BLUE}[3/8]${NC} Установка Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker установлен"
else
    echo "✅ Docker уже установлен"
fi

echo -e "${BLUE}[4/8]${NC} Установка Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt install -y docker-compose
    echo "✅ Docker Compose установлен"
else
    echo "✅ Docker Compose уже установлен"
fi

echo -e "${BLUE}[5/8]${NC} Клонирование проекта..."
cd /opt
if [ -d "pos" ]; then
    echo "Папка pos существует. Удаляем..."
    rm -rf pos
fi
git clone https://github.com/alpha-service/KALINUX.git pos
cd pos

echo -e "${BLUE}[6/8]${NC} Проверка и освобождение порта 8080..."
if netstat -tuln 2>/dev/null | grep -q ":8080 "; then
    echo "Порт 8080 занят. Освобождаем..."
    fuser -k 8080/tcp 2>/dev/null || true
    sleep 2
fi

echo -e "${BLUE}[7/8]${NC} Запуск Docker контейнеров..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo -e "${BLUE}[8/8]${NC} Проверка статуса..."
sleep 10
docker-compose ps

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║            ✅ УСТАНОВКА ЗАВЕРШЕНА!                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Ваш POS доступен по адресу:${NC}"
echo "   http://$(hostname -I | awk '{print $1}'):8080"
echo "   http://pos.kruhn.eu:8080"
echo ""
echo -e "${YELLOW}📊 Полезные команды:${NC}"
echo "   Логи:            cd /opt/pos && docker-compose logs -f"
echo "   Перезапуск:      cd /opt/pos && docker-compose restart"
echo "   Остановка:       cd /opt/pos && docker-compose down"
echo "   Обновление:      cd /opt/pos && git pull && docker-compose up -d --build"
echo ""
echo -e "${YELLOW}🔒 Для установки SSL (HTTPS):${NC}"
echo "   1. apt install certbot python3-certbot-nginx -y"
echo "   2. Установите Nginx (см. DEPLOY_INSTRUCTIONS.md)"
echo "   3. certbot --nginx -d pos.kruhn.eu"
echo ""
echo -e "${YELLOW}📝 Контейнеры:${NC}"
docker-compose ps
echo ""
