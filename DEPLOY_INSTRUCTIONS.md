# 🚀 Инструкция по развертыванию POS на VPS

## Требования
- VPS с Ubuntu 20.04/22.04 или Debian
- Root или sudo доступ
- Домен pos.kruhn.eu направлен на IP вашего VPS (A-запись)
- Минимум 2GB RAM, 20GB HDD

## Метод 1: Развертывание с Docker (Рекомендуется)

### Шаг 1: Подключитесь к VPS
```bash
ssh root@pos.kruhn.eu
```

### Шаг 2: Установите Docker и Docker Compose
```bash
# Обновите систему
apt update && apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установите Docker Compose
apt install docker-compose -y

# Проверьте установку
docker --version
docker-compose --version
```

### Шаг 3: Клонируйте проект
```bash
# Установите git если нужно
apt install git -y

# Создайте директорию
mkdir -p /var/www
cd /var/www

# Клонируйте репозиторий (замените URL на ваш)
git clone https://github.com/KALINUX/your-pos-repo.git pos
cd pos
```

### Шаг 4: Настройте переменные окружения
```bash
# Отредактируйте docker-compose.yml если нужно
nano docker-compose.yml
```

Убедитесь что порт 8080 открыт в `docker-compose.yml` (уже настроено).

### Шаг 5: Запустите приложение
```bash
# Соберите и запустите контейнеры
docker-compose up -d --build

# Проверьте статус
docker-compose ps

# Посмотрите логи
docker-compose logs -f
```

### Шаг 6: Настройте Nginx (опционально, для SSL)
```bash
# Установите Nginx
apt install nginx -y

# Создайте конфигурацию
cat > /etc/nginx/sites-available/pos << 'EOF'
server {
    listen 80;
    server_name pos.kruhn.eu;

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
EOF

# Активируйте конфигурацию
ln -sf /etc/nginx/sites-available/pos /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### Шаг 7: Установите SSL сертификат (Let's Encrypt)
```bash
# Установите Certbot
apt install certbot python3-certbot-nginx -y

# Получите SSL сертификат
certbot --nginx -d pos.kruhn.eu --non-interactive --agree-tos --email admin@kruhn.eu
```

### ✅ Готово!
Ваш POS доступен по адресу: **https://pos.kruhn.eu**

---

## Метод 2: Развертывание без Docker (PM2)

Используйте скрипт `deploy-vps-simple.sh` (см. ниже).

---

## Полезные команды

### Управление контейнерами
```bash
# Остановить все
docker-compose down

# Перезапустить
docker-compose restart

# Пересобрать и запустить
docker-compose up -d --build

# Посмотреть логи
docker-compose logs -f backend
docker-compose logs -f frontend

# Зайти в контейнер
docker exec -it pos_backend sh
```

### Обновление приложения
```bash
cd /var/www/pos
git pull
docker-compose up -d --build
```

### Резервное копирование MongoDB
```bash
# Создать backup
docker exec pos_mongodb mongodump --authenticationDatabase admin -u admin -p changeme --out /data/backup

# Скопировать backup на хост
docker cp pos_mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Мониторинг
```bash
# Использование ресурсов
docker stats

# Логи Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Решение проблем

### Порт 8080 занят
```bash
# Проверьте что использует порт
netstat -tulpn | grep 8080
# или
lsof -i :8080

# Остановите процесс
kill -9 <PID>
```

### Docker контейнеры не запускаются
```bash
# Проверьте логи
docker-compose logs

# Очистите старые контейнеры
docker system prune -a
```

### База данных не подключается
```bash
# Проверьте что MongoDB запущена
docker exec pos_mongodb mongosh -u admin -p changeme --authenticationDatabase admin
```

## Безопасность

1. **Измените пароли MongoDB** в `docker-compose.yml`
2. **Настройте firewall**:
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```
3. **Регулярно обновляйте систему**:
```bash
apt update && apt upgrade -y
```

## Поддержка

При возникновении проблем проверьте:
1. Логи контейнеров: `docker-compose logs`
2. Статус контейнеров: `docker-compose ps`
3. DNS записи домена
4. Firewall настройки: `ufw status`
