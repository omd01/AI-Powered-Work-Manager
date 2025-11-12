# CI/CD Setup Guide for AWS EC2

Complete guide to set up automated deployment pipeline for AI powered Work Manager on AWS EC2.

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   GitHub    │─────▶│    GitHub    │─────▶│   AWS EC2   │
│ Repository  │      │    Actions   │      │   Server    │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Build Test  │
                     │    Deploy    │
                     └──────────────┘
```

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS EC2 Setup](#aws-ec2-setup)
3. [Server Configuration](#server-configuration)
4. [GitHub Secrets Setup](#github-secrets-setup)
5. [Domain Configuration](#domain-configuration)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Deployment Workflow](#deployment-workflow)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### What You Need

- ✅ AWS Account
- ✅ GitHub Repository
- ✅ Domain name (optional but recommended)
- ✅ MongoDB Atlas account or MongoDB instance
- ✅ Google Gemini API key

### Local Tools

- SSH client
- Git
- Text editor

## AWS EC2 Setup

### Step 1: Launch EC2 Instance

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com/
   - Navigate to EC2 Dashboard

2. **Launch Instance**
   ```
   Name: work-manager-production
   AMI: Ubuntu Server 22.04 LTS (HVM)
   Instance Type: t2.medium (minimum) or t3.medium (recommended)
   Key Pair: Create new or use existing
   ```

3. **Configure Security Group**
   Create security group with these rules:
   ```
   Inbound Rules:
   - SSH (22)         → Your IP
   - HTTP (80)        → 0.0.0.0/0, ::/0
   - HTTPS (443)      → 0.0.0.0/0, ::/0

   Outbound Rules:
   - All traffic      → 0.0.0.0/0
   ```

4. **Storage Configuration**
   ```
   Root volume: 30 GB (minimum)
   Volume type: gp3 (recommended)
   ```

5. **Launch Instance**
   - Review and launch
   - Download key pair (.pem file)
   - Note the Public IPv4 address

### Step 2: Connect to EC2 Instance

```bash
# Set permissions on key file
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

## Server Configuration

### Automated Setup (Recommended)

1. **Copy setup script to EC2**
   ```bash
   # On your local machine
   scp -i your-key.pem scripts/setup-ec2.sh ubuntu@YOUR_EC2_IP:~/
   ```

2. **Run setup script**
   ```bash
   # On EC2 instance
   chmod +x setup-ec2.sh

   # Fix line endings (Windows to Linux)
   sed -i 's/\r$//' setup-ec2.sh

   # Set environment variables
   export DOMAIN="your-domain.com"
   export GITHUB_REPO="your-username/work-manager"

   # Run setup
   ./setup-ec2.sh
   ```

The script will:
- ✅ Update system packages
- ✅ Install Node.js 20.x (required for Next.js 16)
- ✅ Install pnpm, PM2
- ✅ Install and configure Nginx
- ✅ Clone your repository
- ✅ Configure firewall
- ✅ Set up log rotation
- ✅ Create deployment structure

### Manual Setup (Alternative)

If you prefer manual setup, follow these steps:

<details>
<summary>Click to expand manual setup instructions</summary>

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Create directories
sudo mkdir -p /var/www/work-manager
sudo mkdir -p /var/log/work-manager
sudo chown -R $USER:$USER /var/www/work-manager
sudo chown -R $USER:$USER /var/log/work-manager

# Clone repository
cd /var/www/work-manager
git clone https://github.com/your-username/work-manager.git .

# Install dependencies
pnpm install --frozen-lockfile

# Copy ecosystem config
cp ecosystem.config.js /var/www/work-manager/

# Configure Nginx (see Nginx section below)

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

</details>

## GitHub Secrets Setup

### Step 1: Generate SSH Key for GitHub Actions

On your **local machine**:

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "github-actions@work-manager" -f ~/.ssh/github_actions_ed25519

# This creates:
# - Private key: ~/.ssh/github_actions_ed25519
# - Public key: ~/.ssh/github_actions_ed25519.pub
```

### Step 2: Add Public Key to EC2

```bash
# Copy public key content
cat ~/.ssh/github_actions_ed25519.pub

# SSH to EC2 and add the key
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# On EC2, add the public key
echo "paste-your-public-key-here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Add Secrets to GitHub

Go to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

#### Required Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `EC2_HOST` | `54.123.45.67` | Your EC2 public IP or domain |
| `EC2_USER` | `ubuntu` | SSH username (usually ubuntu) |
| `EC2_SSH_KEY` | `<private-key-content>` | Content of `github_actions_ed25519` |
| `EC2_PORT` | `22` | SSH port (default: 22) |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB connection string |
| `JWT_SECRET` | `<64-char-string>` | Generate with crypto.randomBytes(32) |
| `GEMINI_API_KEY` | `AIza...` | Your Gemini API key |
| `NEXT_PUBLIC_API_URL` | `https://your-domain.com` | Your app URL |

#### Optional Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `SLACK_WEBHOOK` | `https://hooks.slack.com/...` | For deployment notifications |

### How to Get Each Secret

**EC2_SSH_KEY** (Private Key):
```bash
# On your local machine
cat ~/.ssh/github_actions_ed25519
```
Copy the entire content including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

**JWT_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**MONGODB_URI**:
- MongoDB Atlas: Get from Atlas dashboard → Connect → Connect your application
- Format: `mongodb+srv://username:password@cluster.mongodb.net/work-management`

**GEMINI_API_KEY**:
- Get from https://makersuite.google.com/app/apikey

## Domain Configuration

### Step 1: Point Domain to EC2

In your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

**Add A Records:**
```
Type: A
Name: @
Value: YOUR_EC2_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_EC2_IP
TTL: 3600
```

**Or use CNAME for www:**
```
Type: A
Name: @
Value: YOUR_EC2_IP

Type: CNAME
Name: www
Value: your-domain.com
```

### Step 2: Wait for DNS Propagation

```bash
# Check DNS propagation
nslookup your-domain.com
dig your-domain.com
```

Usually takes 5-30 minutes, max 48 hours.

### Step 3: Update Nginx Configuration

On EC2:
```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/work-manager

# Replace 'your-domain.com' with your actual domain

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## SSL Certificate Setup

### Using Let's Encrypt (Free)

1. **Install Certbot**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   ```

2. **Get Certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Follow Prompts**
   ```
   Enter email: your-email@example.com
   Agree to terms: Y
   Share email: N
   Redirect HTTP to HTTPS: 2 (recommended)
   ```

4. **Verify SSL**
   ```bash
   # Test auto-renewal
   sudo certbot renew --dry-run
   ```

Certbot automatically:
- ✅ Obtains SSL certificate
- ✅ Updates Nginx configuration
- ✅ Sets up auto-renewal (runs twice daily)

### Manual SSL Certificate

If you have your own SSL certificate:

```bash
# Copy certificate files to EC2
sudo mkdir -p /etc/ssl/private
sudo cp your-cert.crt /etc/ssl/certs/
sudo cp your-key.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/your-key.key

# Update Nginx config
sudo nano /etc/nginx/sites-available/work-manager
```

Add to server block:
```nginx
listen 443 ssl http2;
listen [::]:443 ssl http2;
ssl_certificate /etc/ssl/certs/your-cert.crt;
ssl_certificate_key /etc/ssl/private/your-key.key;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
```

## Deployment Workflow

### How It Works

1. **Developer pushes to main branch**
   ```bash
   git push origin main
   ```

2. **GitHub Actions triggers**
   - Checks out code
   - Runs TypeScript build test
   - If tests pass, deploys to EC2

3. **On EC2 server**
   - Pulls latest code
   - Installs dependencies
   - Builds application
   - Restarts PM2 process
   - Runs health check

4. **If deployment fails**
   - Automatically rolls back to previous version
   - Sends notification (if configured)

### Manual Deployment

If you need to deploy manually:

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Navigate to app directory
cd /var/www/work-manager

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm build

# Restart
pm2 restart work-manager
```

### Deployment Branches

- `main` → Production deployment
- `production` → Production deployment (alternative)
- Other branches → No automatic deployment

## Monitoring & Logs

### PM2 Monitoring

```bash
# View application status
pm2 status

# View logs
pm2 logs work-manager

# View only errors
pm2 logs work-manager --err

# Monitor CPU/Memory
pm2 monit

# View detailed info
pm2 show work-manager
```

### Application Logs

```bash
# Application logs
tail -f /var/log/work-manager/out.log
tail -f /var/log/work-manager/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/work-manager-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/work-manager-error.log
```

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Check from outside
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-12T...",
  "uptime": 12345.67,
  "environment": "production"
}
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check running processes
ps aux | grep node

# Check Nginx status
sudo systemctl status nginx

# Check firewall status
sudo ufw status
```

## Troubleshooting

### Deployment Fails

**Problem**: GitHub Actions deployment fails

**Solutions**:
```bash
# 1. Check GitHub Actions logs
# Go to: Repository → Actions → Click on failed run

# 2. Verify secrets are set correctly
# Go to: Repository → Settings → Secrets

# 3. Test SSH connection manually
ssh -i private-key ubuntu@EC2_IP

# 4. Check EC2 disk space
df -h

# 5. Check PM2 logs
pm2 logs work-manager --lines 100
```

### Application Won't Start

**Problem**: PM2 shows app as errored

**Solutions**:
```bash
# Check logs
pm2 logs work-manager

# Common issues:
# 1. Environment variables missing
cat /var/www/work-manager/.env.local

# 2. Port already in use
sudo lsof -i :3000
sudo kill -9 <PID>

# 3. MongoDB connection issues
# Verify MONGODB_URI in .env.local

# 4. Dependencies not installed
cd /var/www/work-manager
pnpm install

# Restart application
pm2 restart work-manager
```

### Nginx Errors

**Problem**: Nginx returns 502 Bad Gateway

**Solutions**:
```bash
# 1. Check if app is running
pm2 status

# 2. Check Nginx error logs
sudo tail -f /var/log/nginx/work-manager-error.log

# 3. Test Nginx configuration
sudo nginx -t

# 4. Restart Nginx
sudo systemctl restart nginx

# 5. Check if port 3000 is accessible
curl http://localhost:3000/api/health
```

### SSL Certificate Issues

**Problem**: SSL certificate not working

**Solutions**:
```bash
# 1. Check certificate status
sudo certbot certificates

# 2. Renew certificate manually
sudo certbot renew

# 3. Check Nginx SSL configuration
sudo nginx -t

# 4. Verify domain DNS
nslookup your-domain.com
```

### MongoDB Connection Issues

**Problem**: Can't connect to MongoDB

**Solutions**:
```bash
# 1. Verify MONGODB_URI
cat /var/www/work-manager/.env.local

# 2. Test MongoDB connection from EC2
mongosh "YOUR_MONGODB_URI"

# 3. Check MongoDB Atlas IP whitelist
# Add EC2 IP to whitelist in Atlas

# 4. Verify credentials
# Check username/password in connection string
```

### GitHub Actions SSH Issues

**Problem**: SSH connection fails

**Solutions**:
```bash
# 1. Verify public key is in authorized_keys
cat ~/.ssh/authorized_keys

# 2. Check SSH permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 3. Test SSH connection locally
ssh -i private-key ubuntu@EC2_IP

# 4. Check EC2 security group
# Ensure port 22 is open from GitHub Actions IPs
```

## Performance Optimization

### PM2 Cluster Mode

The ecosystem.config.js uses cluster mode for better performance:
- Runs multiple instances
- Automatic load balancing
- Zero-downtime restarts

### Nginx Caching

Nginx is configured to cache static assets:
- `/_next/static/` files cached for 60 minutes
- Public cache headers for immutable assets

### Rate Limiting

Nginx implements rate limiting:
- API routes: 10 requests/second (burst 20)
- General routes: 30 requests/second (burst 50)

## Security Best Practices

### Implemented Security

- ✅ Firewall configured (UFW)
- ✅ Fail2ban installed
- ✅ SSH key authentication only
- ✅ SSL/TLS encryption
- ✅ Security headers (X-Frame-Options, etc.)
- ✅ Rate limiting
- ✅ Environment variables secured

### Additional Recommendations

1. **Disable password authentication**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

2. **Keep system updated**
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

3. **Monitor access logs**
   ```bash
   sudo tail -f /var/log/auth.log
   ```

4. **Backup regularly**
   - Database backups
   - Application backups
   - Configuration backups

## Backup Strategy

### Automated Backups

Create backup script:
```bash
#!/bin/bash
# /usr/local/bin/backup-work-manager.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/work-manager"
mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/work-manager

# Backup Nginx config
tar -czf $BACKUP_DIR/nginx_$DATE.tar.gz /etc/nginx/sites-available/work-manager

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Add to crontab:
```bash
# Run daily at 2 AM
0 2 * * * /usr/local/bin/backup-work-manager.sh
```

## Rollback Procedure

### Automatic Rollback

If deployment fails, GitHub Actions automatically rolls back to the previous version.

### Manual Rollback

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

cd /var/www/work-manager

# View recent commits
git log --oneline -n 10

# Rollback to specific commit
git reset --hard COMMIT_HASH

# Reinstall dependencies
pnpm install --frozen-lockfile

# Rebuild
pnpm build

# Restart
pm2 restart work-manager
```

## Support

### Getting Help

1. Check logs first
2. Review this documentation
3. Check GitHub Actions logs
4. Create an issue in the repository

### Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## Quick Reference

### Common Commands

```bash
# View app status
pm2 status

# View logs
pm2 logs work-manager

# Restart app
pm2 restart work-manager

# Reload app (zero-downtime)
pm2 reload work-manager

# Stop app
pm2 stop work-manager

# Check Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# View Nginx logs
sudo tail -f /var/log/nginx/work-manager-*.log

# Check health
curl http://localhost:3000/api/health
```

### Important Paths

```
Application: /var/www/work-manager
Logs: /var/log/work-manager/
Nginx config: /etc/nginx/sites-available/work-manager
PM2 config: /var/www/work-manager/ecosystem.config.js
SSL certs: /etc/letsencrypt/live/your-domain.com/
```

---

**Last Updated**: 2025-11-12
**Version**: 1.0.0
