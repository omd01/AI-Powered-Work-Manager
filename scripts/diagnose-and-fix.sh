#!/bin/bash

# Complete Diagnostic and Fix Script for Work Manager Deployment
# This script checks everything and fixes common issues

set -e

echo "🔍 Starting comprehensive system check..."
echo "================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DOMAIN="management.primelinkexim.com"
APP_NAME="work-manager"
DEPLOY_PATH="/var/www/work-manager"

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. Check Node.js version
echo -e "${YELLOW}1. Checking Node.js version...${NC}"
NODE_VERSION=$(node -v)
echo "   Node.js version: $NODE_VERSION"
if [[ "$NODE_VERSION" == v20* ]]; then
    print_status 0 "Node.js 20.x is installed"
else
    print_status 1 "Node.js 20.x required, found $NODE_VERSION"
fi
echo ""

# 2. Check pnpm
echo -e "${YELLOW}2. Checking pnpm...${NC}"
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    echo "   pnpm version: $PNPM_VERSION"
    print_status 0 "pnpm is installed"
else
    print_status 1 "pnpm is not installed"
fi
echo ""

# 3. Check PM2
echo -e "${YELLOW}3. Checking PM2...${NC}"
if command -v pm2 &> /dev/null; then
    print_status 0 "PM2 is installed"
    echo ""
    pm2 status
else
    print_status 1 "PM2 is not installed"
fi
echo ""

# 4. Check application directory
echo -e "${YELLOW}4. Checking application directory...${NC}"
if [ -d "$DEPLOY_PATH" ]; then
    print_status 0 "Application directory exists: $DEPLOY_PATH"
    echo "   Contents:"
    ls -la $DEPLOY_PATH | head -15
else
    print_status 1 "Application directory not found: $DEPLOY_PATH"
fi
echo ""

# 5. Check if repository is cloned
echo -e "${YELLOW}5. Checking Git repository...${NC}"
if [ -d "$DEPLOY_PATH/.git" ]; then
    print_status 0 "Git repository exists"
    cd $DEPLOY_PATH
    echo "   Current branch: $(git branch --show-current)"
    echo "   Latest commit: $(git log -1 --oneline)"
else
    print_status 1 "Git repository not found"
fi
echo ""

# 6. Check environment variables
echo -e "${YELLOW}6. Checking environment file...${NC}"
if [ -f "$DEPLOY_PATH/.env.local" ]; then
    print_status 0 ".env.local exists"
    echo "   Environment variables (values hidden):"
    cat $DEPLOY_PATH/.env.local | sed 's/=.*/=***/' | head -10
else
    print_status 1 ".env.local not found"
fi
echo ""

# 7. Check if build exists
echo -e "${YELLOW}7. Checking Next.js build...${NC}"
if [ -d "$DEPLOY_PATH/.next" ]; then
    print_status 0 "Next.js build directory exists"
    BUILD_SIZE=$(du -sh $DEPLOY_PATH/.next | cut -f1)
    echo "   Build size: $BUILD_SIZE"
else
    print_status 1 "Next.js build not found"
fi
echo ""

# 8. Check if app is listening on port 3000
echo -e "${YELLOW}8. Checking if app is listening on port 3000...${NC}"
if sudo lsof -i :3000 &> /dev/null; then
    print_status 0 "Application is listening on port 3000"
    echo "   Process:"
    sudo lsof -i :3000
else
    print_status 1 "No process listening on port 3000"
fi
echo ""

# 9. Check application health
echo -e "${YELLOW}9. Testing application health endpoint...${NC}"
if curl -f http://localhost:3000/api/health &> /dev/null; then
    print_status 0 "Application health check passed"
    echo "   Response:"
    curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/health
else
    print_status 1 "Application health check failed"
fi
echo ""

# 10. Check Nginx status
echo -e "${YELLOW}10. Checking Nginx...${NC}"
if sudo systemctl is-active --quiet nginx; then
    print_status 0 "Nginx is running"
else
    print_status 1 "Nginx is not running"
fi
echo ""

# 11. Check Nginx configuration
echo -e "${YELLOW}11. Checking Nginx configuration...${NC}"
if [ -f "/etc/nginx/sites-available/$APP_NAME" ]; then
    print_status 0 "Nginx site configuration exists"
else
    print_status 1 "Nginx site configuration not found"
fi

if [ -L "/etc/nginx/sites-enabled/$APP_NAME" ]; then
    print_status 0 "Nginx site is enabled"
else
    print_status 1 "Nginx site is not enabled"
fi

if [ -f "/etc/nginx/sites-enabled/default" ]; then
    print_status 1 "Default Nginx site is still enabled (should be disabled)"
else
    print_status 0 "Default Nginx site is disabled"
fi
echo ""

# 12. Test Nginx configuration syntax
echo -e "${YELLOW}12. Testing Nginx configuration syntax...${NC}"
if sudo nginx -t &> /dev/null; then
    print_status 0 "Nginx configuration is valid"
else
    print_status 1 "Nginx configuration has errors"
    sudo nginx -t
fi
echo ""

# 13. Check firewall
echo -e "${YELLOW}13. Checking firewall (UFW)...${NC}"
if sudo ufw status | grep -q "Status: active"; then
    print_status 0 "Firewall is active"
    echo "   Open ports:"
    sudo ufw status | grep ALLOW
else
    print_status 1 "Firewall is not active"
fi
echo ""

# 14. Test domain resolution
echo -e "${YELLOW}14. Testing domain resolution...${NC}"
RESOLVED_IP=$(dig +short $DOMAIN | tail -1)
echo "   Domain: $DOMAIN"
echo "   Resolves to: $RESOLVED_IP"
echo ""

# 15. Test external access
echo -e "${YELLOW}15. Testing external access to domain...${NC}"
if curl -f http://$DOMAIN/api/health &> /dev/null; then
    print_status 0 "Domain is accessible from outside"
    echo "   Response:"
    curl -s http://$DOMAIN/api/health | jq '.' 2>/dev/null || curl -s http://$DOMAIN/api/health
else
    print_status 1 "Cannot access domain from outside"
fi
echo ""

# Summary and recommendations
echo "================================================="
echo -e "${GREEN}📊 DIAGNOSTIC SUMMARY${NC}"
echo "================================================="
echo ""

# Determine issues and provide fixes
echo -e "${YELLOW}🔧 RECOMMENDED FIXES:${NC}"
echo ""

# Fix 1: If PM2 app not running
if ! pm2 list | grep -q "$APP_NAME.*online"; then
    echo -e "${RED}Issue 1: PM2 application is not running${NC}"
    echo "Fix:"
    echo "  cd $DEPLOY_PATH"
    echo "  pnpm install --no-frozen-lockfile"
    echo "  pnpm build"
    echo "  pm2 start ecosystem.config.js"
    echo "  pm2 save"
    echo ""
fi

# Fix 2: If Nginx site not configured
if [ ! -f "/etc/nginx/sites-enabled/$APP_NAME" ] || [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo -e "${RED}Issue 2: Nginx not properly configured${NC}"
    echo "Fix:"
    echo "  cd $DEPLOY_PATH"
    echo "  chmod +x scripts/fix-nginx.sh"
    echo "  sed -i 's/\r$//' scripts/fix-nginx.sh"
    echo "  ./scripts/fix-nginx.sh $DOMAIN"
    echo ""
fi

# Fix 3: If build doesn't exist
if [ ! -d "$DEPLOY_PATH/.next" ]; then
    echo -e "${RED}Issue 3: Application not built${NC}"
    echo "Fix:"
    echo "  cd $DEPLOY_PATH"
    echo "  pnpm install --no-frozen-lockfile"
    echo "  pnpm build"
    echo ""
fi

# Fix 4: If env file missing or empty
if [ ! -f "$DEPLOY_PATH/.env.local" ] || [ ! -s "$DEPLOY_PATH/.env.local" ]; then
    echo -e "${RED}Issue 4: Environment variables not set${NC}"
    echo "Fix:"
    echo "  cd $DEPLOY_PATH"
    echo "  nano .env.local"
    echo "  # Add your environment variables:"
    echo "  MONGODB_URI=your-mongodb-uri"
    echo "  JWT_SECRET=your-jwt-secret"
    echo "  GEMINI_API_KEY=your-gemini-api-key"
    echo "  NODE_ENV=production"
    echo "  NEXT_PUBLIC_API_URL=http://$DOMAIN"
    echo ""
fi

echo "================================================="
echo -e "${GREEN}Run this script completed!${NC}"
echo ""
echo "Quick commands:"
echo "  View PM2 logs: pm2 logs $APP_NAME"
echo "  Restart app: pm2 restart $APP_NAME"
echo "  View Nginx logs: sudo tail -f /var/log/nginx/${APP_NAME}-*.log"
echo "  Test health: curl http://localhost:3000/api/health"
echo "================================================="
