# 🚨 ВАЖНО: Перед развертыванием на GitHub

## Проблема
GitHub блокирует push из-за Shopify токена в истории коммитов.

## Решение 1: Разрешить секрет (Быстро)
1. Откройте ссылку: https://github.com/alpha-service/KALINUX/security/secret-scanning/unblock-secret/38bUYbj3PmfMuNHbBdO6MEo77DE
2. Нажмите "Allow secret"
3. Затем выполните: `git push origin main-clean`

## Решение 2: Очистить историю (Правильно)
```bash
# Используйте BFG Repo-Cleaner
# Скачайте: https://rtyley.github.io/bfg-repo-cleaner/

# Или используйте git filter-repo
pip install git-filter-repo

# Удалите файл из истории
git filter-repo --path test-shopify.js --invert-paths

# Push
git push origin main-clean -f
```

## Решение 3: Новый репозиторий (Самый простой)
```bash
# 1. Создайте .gitignore
echo "test-*.js" >> .gitignore
echo "*.key" >> .gitignore
echo "*.pem" >> .gitignore
echo ".env" >> .gitignore
echo "settings.json" >> .gitignore

# 2. Создайте новый репозиторий без истории
rm -rf .git
git init
git add .
git commit -m "Initial commit - POS system ready for deployment"

# 3. Добавьте remote и push
git remote add origin https://github.com/alpha-service/KALINUX.git
git push origin main -f
```

## После успешного Push

Развертывание на VPS:
```bash
# На VPS выполните:
ssh root@pos.kruhn.eu

# Клонируйте репозиторий
cd /opt
git clone https://github.com/alpha-service/KALINUX.git pos
cd pos

# Запустите автоустановку
chmod +x deploy-docker.sh
./deploy-docker.sh
```

Готово! Сайт будет доступен на http://pos.kruhn.eu:8080
