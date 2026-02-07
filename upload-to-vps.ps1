# Скрипт для загрузки проекта с локального компьютера на VPS
# Использование: .\upload-to-vps.ps1

$VPS_IP = "72.61.111.39"
$VPS_USER = "root"
$LOCAL_PATH = "C:\Users\KALINUX\Documents\GitHub\KALINUX"
$REMOTE_PATH = "/opt/pos"

Write-Host "🚀 Загрузка проекта на VPS..." -ForegroundColor Green
Write-Host ""

# Проверка пути
if (-not (Test-Path $LOCAL_PATH)) {
    Write-Host "❌ Папка проекта не найдена: $LOCAL_PATH" -ForegroundColor Red
    exit 1
}

# Создание временного архива
Write-Host "📦 Создание архива..." -ForegroundColor Yellow
$archivePath = Join-Path $env:TEMP "pos-deploy.zip"

# Удалить старый архив если есть
if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
}

# Получить все файлы кроме исключений
$excludePatterns = @(
    "node_modules",
    ".git",
    "build",
    ".env",
    "*.log",
    "test-*.js"
)

# Создать архив
Push-Location $LOCAL_PATH
# Use a more reliable way to create archive with directory structure
if (Test-Path $archivePath) { Remove-Item $archivePath -Force }

# Create a temporary directory for staging to ensure clean structure
$stagePath = Join-Path $env:TEMP "pos-stage"
if (Test-Path $stagePath) { Remove-Item $stagePath -Recurse -Force }
New-Item -ItemType Directory -Path $stagePath | Out-Null

# Copy files while excluding patterns
Get-ChildItem -Path . -Recurse | Where-Object {
    $item = $_
    $relativeName = $item.FullName.Substring($LOCAL_PATH.Length + 1)
    $exclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($relativeName -like "$pattern*" -or $relativeName -like "*\$pattern*") {
            $exclude = $true
            break
        }
    }
    -not $exclude
} | ForEach-Object {
    $targetPath = Join-Path $stagePath $_.FullName.Substring($LOCAL_PATH.Length + 1)
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
    } else {
        Copy-Item -Path $_.FullName -Destination $targetPath -Force
    }
}

Push-Location $stagePath
Compress-Archive -Path * -DestinationPath $archivePath -Force
Pop-Location
Pop-Location

# Cleanup stage
Remove-Item $stagePath -Recurse -Force

Write-Host "✅ Архив создан: $archivePath" -ForegroundColor Green
Write-Host ""

# Загрузка на VPS
Write-Host "📤 Загрузка на VPS..." -ForegroundColor Yellow

# Проверка наличия scp
$scpExists = Get-Command scp -ErrorAction SilentlyContinue
if (-not $scpExists) {
    Write-Host "❌ scp не найден. Установите OpenSSH:" -ForegroundColor Red
    Write-Host "   Settings -> Apps -> Optional Features -> Add OpenSSH Client" -ForegroundColor Yellow
    exit 1
}

# Загрузить архив
scp $archivePath "${VPS_USER}@${VPS_IP}:/tmp/pos-deploy.zip"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка загрузки файла" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Файл загружен на VPS" -ForegroundColor Green
Write-Host ""

# Развертывание на VPS
Write-Host "🔧 Развертывание на VPS..." -ForegroundColor Yellow

$deployScript = @"
echo '📦 Распаковка архива...'
cd /tmp
unzip -o pos-deploy.zip -d /opt/pos-temp

echo '🛑 Остановка старой версии...'
cd /opt/pos 2>/dev/null && docker-compose down || true

echo '🔄 Обновление файлов...'
rm -rf /opt/pos-backup
mv /opt/pos /opt/pos-backup 2>/dev/null || true
mv /opt/pos-temp /opt/pos

echo '🚀 Запуск новой версии...'
cd /opt/pos
docker-compose up -d --build

echo ''
echo '✅ Развертывание завершено!'
echo ''
echo '📊 Статус контейнеров:'
docker-compose ps

echo ''
echo '🌐 Доступ:'
echo '   http://$VPS_IP:8080'
echo '   http://pos.kruhn.eu:8080'
echo ''
echo '📝 Логи: cd /opt/pos && docker-compose logs -f'
"@

# Fix line endings for Linux bash
$deployScript = $deployScript -replace "`r`n", "`n"

ssh "${VPS_USER}@${VPS_IP}" $deployScript

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ УСПЕШНО РАЗВЕРНУТО!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Ваш POS доступен:" -ForegroundColor Cyan
    Write-Host "   http://$VPS_IP`:8080" -ForegroundColor White
    Write-Host "   http://pos.kruhn.eu:8080" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Ошибка развертывания" -ForegroundColor Red
    Write-Host "Проверьте логи на VPS:" -ForegroundColor Yellow
    Write-Host "   ssh $VPS_USER@$VPS_IP" -ForegroundColor White
    Write-Host "   cd /opt/pos && docker-compose logs" -ForegroundColor White
}

# Очистка
Remove-Item $archivePath -Force -ErrorAction SilentlyContinue
