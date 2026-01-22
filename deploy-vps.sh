#!/bin/bash
# VPS Deployment Script for POS System
# Domain: pos.kruhn.eu
# Run this script on the VPS after uploading files

set -e

echo "🚀 Starting POS Deployment..."

# 1. Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# 3. Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# 4. Create app directory
echo "📁 Creating app directory..."
sudo mkdir -p /var/www/pos
sudo chown $USER:$USER /var/www/pos

# 5. Copy files (assumes we're running from uploaded folder)
echo "📋 Copying files..."
cp -r ./* /var/www/pos/
cd /var/www/pos

# 6. Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# 7. Build frontend
echo "🔨 Building frontend..."
npm run build

# 8. Setup Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/pos > /dev/null << 'NGINX'
server {
    listen 80;
    server_name pos.kruhn.eu;

    # Frontend
    location / {
        root /var/www/pos/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:8000;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/pos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 9. Start backend with PM2
echo "🚀 Starting backend..."
pm2 start backend-server.js --name pos-backend
pm2 save
pm2 startup | tail -1 | bash

# 10. Install SSL with Certbot
echo "🔒 Installing SSL..."
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pos.kruhn.eu --non-interactive --agree-tos --email admin@kruhn.eu

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access your POS at: https://pos.kruhn.eu"
