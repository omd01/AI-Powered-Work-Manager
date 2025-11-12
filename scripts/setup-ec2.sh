#!/bin/bash

# AI powered Work Manager - EC2 Setup Script
# This script sets up a fresh Ubuntu EC2 instance for deployment

set -e

echo "🚀 Starting EC2 Setup for AI powered Work Manager"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="work-manager"
DEPLOY_PATH="/var/www/${APP_NAME}"
LOG_PATH="/var/log/${APP_NAME}"
DOMAIN="${DOMAIN:-your-domain.com}"
GITHUB_REPO="${GITHUB_REPO:-your-username/work-manager}"

echo -e "${GREEN}📋 Configuration:${NC}"
echo "  App Name: ${APP_NAME}"
echo "  Deploy Path: ${DEPLOY_PATH}"
echo "  Domain: ${DOMAIN}"
echo "  GitHub Repo: ${GITHUB_REPO}"
echo ""

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install essential tools
echo -e "${YELLOW}🛠️  Installing essential tools...${NC}"
sudo apt-get install -y \
  curl \
  git \
  build-essential \
  software-properties-common \
  ufw \
  fail2ban

# Install Node.js 20.x (required for Next.js 16)
echo -e "${YELLOW}📥 Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
echo -e "${YELLOW}📥 Installing pnpm...${NC}"
sudo npm install -g pnpm

# Install PM2
echo -e "${YELLOW}📥 Installing PM2...${NC}"
sudo npm install -g pm2

# Setup PM2 startup script
echo -e "${YELLOW}⚙️  Setting up PM2 startup...${NC}"
sudo pm2 startup systemd -u $USER --hp $HOME

# Install and configure Nginx
echo -e "${YELLOW}🌐 Installing Nginx...${NC}"
sudo apt-get install -y nginx

# Create deployment directory
echo -e "${YELLOW}📁 Creating deployment directory...${NC}"
sudo mkdir -p ${DEPLOY_PATH}
sudo mkdir -p ${LOG_PATH}
sudo chown -R $USER:$USER ${DEPLOY_PATH}
sudo chown -R $USER:$USER ${LOG_PATH}

# Clone repository
echo -e "${YELLOW}📥 Cloning repository...${NC}"
if [ ! -d "${DEPLOY_PATH}/.git" ]; then
  cd ${DEPLOY_PATH}
  git clone https://github.com/${GITHUB_REPO} .
else
  echo -e "${GREEN}Repository already exists, pulling latest changes...${NC}"
  cd ${DEPLOY_PATH}
  git pull origin main
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install --frozen-lockfile

# Create .env.local file (will be populated by GitHub Actions)
echo -e "${YELLOW}🔐 Creating environment file...${NC}"
cat > ${DEPLOY_PATH}/.env.local << 'EOF'
# Environment variables will be set by GitHub Actions
MONGODB_URI=
JWT_SECRET=
GEMINI_API_KEY=
NODE_ENV=production
NEXT_PUBLIC_API_URL=
EOF

# Build application
echo -e "${YELLOW}🏗️  Building application...${NC}"
pnpm build

# Configure Nginx
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
sudo bash -c "cat > /etc/nginx/sites-available/${APP_NAME} << 'EOF'
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=general_limit:10m rate=30r/s;

# Upstream
upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;

    # Logging
    access_log /var/log/nginx/${APP_NAME}-access.log;
    error_log /var/log/nginx/${APP_NAME}-error.log;

    # Client body size limit
    client_max_body_size 10M;

    # Rate limiting for API routes
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;

        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # General rate limiting
    location / {
        limit_req zone=general_limit burst=50 nodelay;

        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Next.js static files
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control \"public, max-age=3600, immutable\";
    }

    # Health check endpoint (no rate limiting)
    location /api/health {
        proxy_pass http://nextjs_backend;
        access_log off;
    }
}
EOF"

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw --force enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw reload

# Configure fail2ban
echo -e "${YELLOW}🛡️  Configuring fail2ban...${NC}"
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Start application with PM2
echo -e "${YELLOW}🚀 Starting application...${NC}"
cd ${DEPLOY_PATH}
pm2 start ecosystem.config.js
pm2 save

# Install SSL certificate (if domain is configured)
if [ "$DOMAIN" != "your-domain.com" ]; then
    echo -e "${YELLOW}🔒 Installing SSL certificate...${NC}"
    sudo apt-get install -y certbot python3-certbot-nginx

    echo -e "${YELLOW}📝 Setting up SSL...${NC}"
    echo "Run the following command to get SSL certificate:"
    echo "sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
    echo ""
    echo "For automatic renewal, certbot will add a cron job automatically."
fi

# Create health check API endpoint script
echo -e "${YELLOW}🏥 Creating health check script...${NC}"
cat > ${DEPLOY_PATH}/app/api/health/route.ts << 'EOF'
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
}
EOF

# Setup log rotation
echo -e "${YELLOW}📋 Setting up log rotation...${NC}"
sudo bash -c "cat > /etc/logrotate.d/${APP_NAME} << 'EOF'
${LOG_PATH}/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0644 $USER $USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF"

# Create deployment user SSH directory
echo -e "${YELLOW}🔑 Setting up SSH for deployments...${NC}"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Display setup summary
echo ""
echo -e "${GREEN}✅ EC2 Setup Complete!${NC}"
echo "================================================="
echo ""
echo -e "${GREEN}📊 Summary:${NC}"
echo "  ✓ Node.js 18.x installed"
echo "  ✓ pnpm installed"
echo "  ✓ PM2 installed and configured"
echo "  ✓ Nginx installed and configured"
echo "  ✓ Firewall configured"
echo "  ✓ Application deployed to ${DEPLOY_PATH}"
echo "  ✓ Application running on PM2"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Add your GitHub Actions public key to ~/.ssh/authorized_keys"
echo "   ${YELLOW}echo 'your-public-key' >> ~/.ssh/authorized_keys${NC}"
echo ""
echo "2. Set up GitHub Secrets:"
echo "   ${YELLOW}EC2_HOST${NC} = Your EC2 public IP or domain"
echo "   ${YELLOW}EC2_USER${NC} = ${USER}"
echo "   ${YELLOW}EC2_SSH_KEY${NC} = Your private SSH key"
echo "   ${YELLOW}EC2_PORT${NC} = 22"
echo "   ${YELLOW}MONGODB_URI${NC} = Your MongoDB connection string"
echo "   ${YELLOW}JWT_SECRET${NC} = Your JWT secret (min 32 chars)"
echo "   ${YELLOW}GEMINI_API_KEY${NC} = Your Gemini API key"
echo "   ${YELLOW}NEXT_PUBLIC_API_URL${NC} = https://${DOMAIN}"
echo ""
echo "3. Configure your domain DNS:"
echo "   Add A record: ${YELLOW}${DOMAIN} → Your EC2 IP${NC}"
echo "   Add A record: ${YELLOW}www.${DOMAIN} → Your EC2 IP${NC}"
echo ""
echo "4. Install SSL certificate:"
echo "   ${YELLOW}sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}${NC}"
echo ""
echo "5. Push to main branch to trigger deployment"
echo ""
echo -e "${GREEN}🎉 Your server is ready for CI/CD deployment!${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs: ${YELLOW}pm2 logs work-manager${NC}"
echo "  Restart app: ${YELLOW}pm2 restart work-manager${NC}"
echo "  Check status: ${YELLOW}pm2 status${NC}"
echo "  Monitor: ${YELLOW}pm2 monit${NC}"
echo "  Nginx logs: ${YELLOW}sudo tail -f /var/log/nginx/${APP_NAME}-*.log${NC}"
echo ""
