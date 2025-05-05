# Ella AI Deployment Guide

This document provides comprehensive instructions for deploying the Ella AI Real Estate Assistant application in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Backend Deployment](#backend-deployment)
   - [Traditional Server Deployment](#traditional-server-deployment)
   - [Docker Deployment](#docker-deployment)
   - [Cloud Provider Deployment](#cloud-provider-deployment)
4. [Frontend Deployment](#frontend-deployment)
   - [Expo Development Build](#expo-development-build)
   - [Expo Production Build](#expo-production-build)
   - [App Store Submission](#app-store-submission)
   - [Google Play Store Submission](#google-play-store-submission)
5. [Database Setup](#database-setup)
   - [MongoDB Setup](#mongodb-setup)
   - [PostgreSQL Setup](#postgresql-setup)
6. [Environment Configuration](#environment-configuration)
7. [Continuous Integration/Deployment](#continuous-integrationdeployment)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git
- Database (MongoDB v4.4+ or PostgreSQL v12+)
- Expo CLI (`npm install -g expo-cli`)
- Docker (optional, for containerized deployment)
- AWS/GCP/Azure account (for cloud deployment)
- Apple Developer Account (for iOS deployment)
- Google Play Developer Account (for Android deployment)

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/ella-ai.git
cd ella-ai
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..
npm install
```

3. Set up environment variables:
```bash
# Backend
cd backend
cp .env.example .env

# Frontend
cd ..
cp .env.example .env
```

4. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# In a new terminal, start the Expo server
cd ..
npm start
```

## Backend Deployment

### Traditional Server Deployment

1. Prepare the server:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2
```

2. Deploy the backend code:
```bash
# Clone the repository
git clone https://github.com/your-org/ella-ai.git
cd ella-ai/backend

# Install dependencies
npm install --production

# Set up environment variables
cp .env.example .env
nano .env  # Edit with your production values
```

3. Start the server with PM2:
```bash
pm2 start src/index.js --name ella-ai-backend
pm2 save
pm2 startup
```

### Docker Deployment

1. Build the Docker image:
```bash
cd backend
docker build -t ella-ai-backend .
```

2. Run the container:
```bash
docker run -d -p 5000:5000 --env-file .env --name ella-ai-backend ella-ai-backend
```

3. For Docker Compose deployment:
```bash
# Create docker-compose.yml file
nano docker-compose.yml

# Add the following content:
version: '3'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file: ./backend/.env
    depends_on:
      - mongodb
  mongodb:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

4. Start the services:
```bash
docker-compose up -d
```

### Cloud Provider Deployment

#### AWS Elastic Beanstalk

1. Install the EB CLI:
```bash
pip install awsebcli
```

2. Initialize EB application:
```bash
cd backend
eb init
```

3. Create an environment:
```bash
eb create ella-ai-production
```

4. Deploy:
```bash
eb deploy
```

#### Heroku

1. Install Heroku CLI:
```bash
npm install -g heroku
```

2. Login and create app:
```bash
heroku login
heroku create ella-ai-backend
```

3. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
# Set other environment variables
```

4. Deploy:
```bash
git subtree push --prefix backend heroku main
```

#### Digital Ocean App Platform

1. Create a new app in Digital Ocean App Platform
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy the app

## Frontend Deployment

### Expo Development Build

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure EAS:
```bash
eas build:configure
```

4. Create a development build:
```bash
# For iOS
eas build --profile development --platform ios

# For Android
eas build --profile development --platform android
```

### Expo Production Build

1. Update app.json with your app details:
```json
{
  "expo": {
    "name": "Ella AI",
    "slug": "ella-ai",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.ellaai"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.ellaai"
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

2. Create a production build:
```bash
# For iOS
eas build --profile production --platform ios

# For Android
eas build --profile production --platform android
```

### App Store Submission

1. Create an App Store Connect entry for your app
2. Build for iOS:
```bash
eas build --profile production --platform ios
```

3. Submit to App Store:
```bash
eas submit --platform ios
```

### Google Play Store Submission

1. Create a Google Play Console entry for your app
2. Build for Android:
```bash
eas build --profile production --platform android
```

3. Submit to Google Play:
```bash
eas submit --platform android
```

## Database Setup

### MongoDB Setup

1. Install MongoDB:
```bash
# Ubuntu
sudo apt-get install gnupg
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

2. Secure MongoDB:
```bash
# Create admin user
mongo
use admin
db.createUser({
  user: "adminUser",
  pwd: "securePassword",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})
exit
```

3. Enable authentication:
```bash
sudo nano /etc/mongod.conf
# Add the following:
security:
  authorization: enabled
```

4. Restart MongoDB:
```bash
sudo systemctl restart mongod
```

### PostgreSQL Setup

1. Install PostgreSQL:
```bash
# Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib
```

2. Create a database and user:
```bash
sudo -u postgres psql
CREATE DATABASE ella_ai;
CREATE USER ella_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ella_ai TO ella_user;
\q
```

3. Import schema:
```bash
cd backend/sql
sudo -u postgres psql -d ella_ai -f schema.sql
```

4. (Optional) Import sample data:
```bash
sudo -u postgres psql -d ella_ai -f sample_data.sql
```

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com

# Database Configuration
DB_TYPE=postgres  # or mongodb
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=ella_ai
DB_USER=ella_user
DB_PASSWORD=secure_password
DB_SSL=true

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key
JWT_EXPIRE=30d

# File Upload Configuration
MAX_FILE_SIZE=5000000
UPLOAD_PROVIDER=s3
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_BUCKET=your_s3_bucket
S3_REGION=your_s3_region

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM=noreply@ella-ai.com

# AI Service Configuration
AI_SERVICE_URL=https://api.openai.com/v1
AI_SERVICE_API_KEY=your_openai_api_key

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Frontend Environment Variables

Create a `.env` file in the root directory with the following variables:

```
EXPO_PUBLIC_API_URL=https://your-backend-api-url.com
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
```

## Continuous Integration/Deployment

### GitHub Actions

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: |
          cd backend
          npm install
      - name: Run tests
        run: |
          cd backend
          npm test
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/app/backend
            git pull
            npm install --production
            pm2 restart ella-ai-backend

  build-mobile-app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Setup Expo
        uses: expo/expo-github-action@v7
        with:
          expo-version: 5.x
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Install dependencies
        run: npm install
      - name: Build Android app
        run: eas build --platform android --non-interactive
      - name: Build iOS app
        run: eas build --platform ios --non-interactive
```

## Monitoring and Maintenance

### Server Monitoring

1. Install and configure PM2 for process monitoring:
```bash
npm install -g pm2
pm2 start backend/src/index.js --name ella-ai-backend
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

2. Set up PM2 monitoring:
```bash
pm2 install pm2-server-monit
```

3. Set up PM2 web dashboard:
```bash
pm2 install pm2-webshell
```

### Database Backups

#### MongoDB Backups

```bash
# Create a backup script
nano /usr/local/bin/backup-mongodb.sh

# Add the following content:
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups/mongodb"
mkdir -p $BACKUP_DIR
mongodump --db ella_ai --out $BACKUP_DIR/$TIMESTAMP
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

# Make the script executable
chmod +x /usr/local/bin/backup-mongodb.sh

# Add to crontab
crontab -e
# Add the following line to run daily at 2 AM:
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

#### PostgreSQL Backups

```bash
# Create a backup script
nano /usr/local/bin/backup-postgres.sh

# Add the following content:
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups/postgres"
mkdir -p $BACKUP_DIR
pg_dump -U postgres -d ella_ai > $BACKUP_DIR/ella_ai_$TIMESTAMP.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

# Make the script executable
chmod +x /usr/local/bin/backup-postgres.sh

# Add to crontab
crontab -e
# Add the following line to run daily at 2 AM:
0 2 * * * /usr/local/bin/backup-postgres.sh
```

## Troubleshooting

### Common Issues and Solutions

1. **Backend server won't start**
   - Check environment variables
   - Verify database connection
   - Check for port conflicts
   - Review logs: `pm2 logs ella-ai-backend`

2. **Database connection issues**
   - Verify connection string
   - Check network connectivity
   - Ensure database service is running
   - Verify credentials

3. **Mobile app build failures**
   - Check Expo build logs
   - Verify app.json configuration
   - Ensure all native dependencies are compatible
   - Check for JavaScript errors

4. **API errors**
   - Check backend logs
   - Verify API endpoints
   - Check authentication tokens
   - Ensure CORS is properly configured

5. **Performance issues**
   - Monitor server resources
   - Check database query performance
   - Consider adding caching
   - Optimize API responses

### Support Resources

- GitHub Issues: https://github.com/your-org/ella-ai/issues
- Documentation: https://docs.ella-ai.com
- Community Forum: https://community.ella-ai.com
- Email Support: support@ella-ai.com