# deploy-docker.ps1
$ErrorActionPreference = "Stop"

$VPS_USER = "root"
$VPS_IP = "72.61.111.39"
$REMOTE_DIR = "/var/www/pos-docker"
$ARCHIVE_NAME = "pos-deploy.zip"

Write-Host "🚀 Starting Deployment to $VPS_IP..." -ForegroundColor Cyan

# 1. Clean previous build artifacts
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME }

# 2. Compress files (excluding heavy folders)
Write-Host "📦 Compressing files..." -ForegroundColor Yellow
$exclude = @("node_modules", ".git", "build", "dist", "tmp", "*.zip")
Get-ChildItem -Path . -Exclude $exclude | Compress-Archive -DestinationPath $ARCHIVE_NAME -Force

# 3. Create remote directory
Write-Host "📁 Preparing remote directory..." -ForegroundColor Yellow
ssh $VPS_USER@$VPS_IP "mkdir -p $REMOTE_DIR"

# 4. Upload archive
Write-Host "YW Uploading archive..." -ForegroundColor Yellow
scp $ARCHIVE_NAME $VPS_USER@$VPS_IP:$REMOTE_DIR/

# 5. Upload Setup Script
Write-Host "📜 Uploading setup script..." -ForegroundColor Yellow
scp vps-docker-setup.sh $VPS_USER@$VPS_IP:$REMOTE_DIR/

# 6. Execute Remote Deployment
Write-Host "🔧 Executing remote deployment..." -ForegroundColor Yellow
$commands = @(
    "cd $REMOTE_DIR",
    "apt-get update && apt-get install -y unzip",
    "unzip -o $ARCHIVE_NAME",
    "rm $ARCHIVE_NAME",
    "chmod +x vps-docker-setup.sh",
    "bash vps-docker-setup.sh"
)
ssh $VPS_USER@$VPS_IP ($commands -join " && ")

# 7. Cleanup local
Remove-Item $ARCHIVE_NAME
Write-Host "✅ Deployment Complete! Visit http://pos.kruhn.eu:8080" -ForegroundColor Green
