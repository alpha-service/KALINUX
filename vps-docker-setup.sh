#!/bin/bash
# vps-docker-setup.sh

echo "🐳 Setting up VPS for Docker Deployment..."

# 1. Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# 2. Install Docker Compose if missing (and not a plugin)
if ! docker compose version &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    apt-get update
    apt-get install -y docker-compose-plugin
fi

# 3. Stop running containers (cleanup)
echo "🛑 Stopping existing containers..."
docker compose down || true

# 4. Prune unused images to save space
docker system prune -f

# 5. Build and Start
echo "🚀 Building and Starting Containers..."
# Ensure environment variables are set or passed here if needed
docker compose up -d --build

# 6. Verify
echo "✅ Containers are up!"
docker compose ps
