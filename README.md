# 🏪 POS System - Point of Sale Alpha

Modern Point of Sale system built with React, Node.js, Express, and MongoDB.

## 🚀 Quick Deployment to VPS

**Deploy to pos.kruhn.eu:8080 in 3 steps:**

```bash
# 1. Connect to your VPS
ssh root@YOUR_VPS_IP

# 2. Run auto-install script
curl -sSL https://raw.githubusercontent.com/alpha-service/KALINUX/main/install-vps.sh | bash

# 3. Access your POS
# http://pos.kruhn.eu:8080
```

**That's it! 🎉**

---

## 📚 Documentation

- **[ИНСТРУКЦИЯ.md](ИНСТРУКЦИЯ.md)** - Русская инструкция по развертыванию
- **[START_HERE.md](START_HERE.md)** - Complete deployment guide (English)
- **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Quick start guide
- **[DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md)** - Full documentation

---

## ✨ Features

- 🛒 **Point of Sale** - Modern POS interface
- 📦 **Inventory Management** - Product and stock control
- 👥 **Customer Management** - Customer database
- 📊 **Reports & Analytics** - Sales reports and statistics
- 🧾 **Receipt Generation** - Thermal and PDF receipts
- 💳 **Payment Processing** - Multiple payment methods
- 🎨 **Customizable Design** - Multiple themes and layouts
- 🌐 **Multi-language** - Support for multiple languages

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Radix UI** - Component library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Docker** - Containerization

---

## 💻 Local Development

### Prerequisites
- Node.js 20+
- MongoDB (or use Docker)

### Quick Start

```bash
# Clone repository
git clone https://github.com/alpha-service/KALINUX.git
cd KALINUX

# Install dependencies
npm install --legacy-peer-deps

# Start backend (in one terminal)
node backend-server.js

# Start frontend (in another terminal)
npm start
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000

---

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Frontend: http://localhost:8080
- Backend: http://localhost:8000 (internal)
- MongoDB: localhost:27017 (internal)

---

## 📦 Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilities
├── backend-server.js      # Backend Express server
├── docker-compose.yml     # Docker compose config
├── Dockerfile             # Frontend Docker image
└── Dockerfile.backend     # Backend Docker image
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:
```env
PORT=8000
MONGO_URL=mongodb://localhost:27017/pos_alpha
DB_NAME=pos_alpha
CORS_ORIGINS=http://localhost:3000
```

### Docker Configuration

Edit `docker-compose.yml` to customize:
- Ports
- MongoDB credentials
- CORS origins
- Volume mounts

---

## 📖 Available Scripts

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Backend
- `node backend-server.js` - Start backend server
- `pm2 start backend-server.js` - Start with PM2

### Docker
- `docker-compose up -d` - Start containers
- `docker-compose down` - Stop containers
- `docker-compose logs -f` - View logs

---

## 🔒 Security Notes

- Change default MongoDB credentials in production
- Use environment variables for secrets
- Enable firewall on VPS
- Use HTTPS in production (see deployment docs)

---

## 📝 License

This project is private and proprietary.

---

## 🤝 Support

For deployment help, see documentation files:
- [ИНСТРУКЦИЯ.md](ИНСТРУКЦИЯ.md) - Russian
- [START_HERE.md](START_HERE.md) - English

---

Made with ❤️ for modern retail businesses

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
