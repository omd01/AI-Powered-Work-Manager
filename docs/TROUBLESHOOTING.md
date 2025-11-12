# CI/CD Troubleshooting Guide

Common issues and solutions when setting up the CI/CD pipeline.

## Setup Script Issues

### Error: "cannot execute: required file not found"

**Problem:**
```bash
ubuntu@ip:~$ ./setup-ec2.sh
-bash: ./setup-ec2.sh: cannot execute: required file not found
```

**Cause:** The script has Windows line endings (CRLF) instead of Unix line endings (LF).

**Solution:**
```bash
# Fix line endings
sed -i 's/\r$//' setup-ec2.sh

# Then run the script
./setup-ec2.sh
```

**Prevention:**
Always run the `sed` command after uploading the script from Windows to Linux.

---

### Error: "Permission denied"

**Problem:**
```bash
ubuntu@ip:~$ ./setup-ec2.sh
-bash: ./setup-ec2.sh: Permission denied
```

**Cause:** Script doesn't have execute permissions.

**Solution:**
```bash
chmod +x setup-ec2.sh
./setup-ec2.sh
```

---

### Error: "DOMAIN variable not set"

**Problem:** Script fails because environment variables aren't set.

**Solution:**
```bash
export DOMAIN="your-actual-domain.com"
export GITHUB_REPO="your-username/work-manager"
./setup-ec2.sh
```

---

## GitHub Actions Issues

### Deployment Fails: "Host key verification failed"

**Problem:** SSH connection fails during deployment.

**Cause:** EC2 host key not in known_hosts.

**Solution:**
The GitHub Actions workflow is configured to skip host key checking. If this fails:

1. Check `EC2_HOST` secret is correct IP address
2. Check `EC2_SSH_KEY` is the complete private key
3. Ensure the corresponding public key is in `~/.ssh/authorized_keys` on EC2

---

### Deployment Fails: "Permission denied (publickey)"

**Problem:** Can't authenticate to EC2.

**Causes & Solutions:**

**1. Public key not added to EC2**
```bash
# On EC2, check authorized_keys
cat ~/.ssh/authorized_keys

# If your key is missing, add it:
echo "your-public-key-content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**2. Wrong private key in GitHub Secret**
```bash
# Verify you have the private key locally
cat ~/.ssh/github_actions_ed25519

# Copy the ENTIRE content including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... all lines ...
# -----END OPENSSH PRIVATE KEY-----

# Update EC2_SSH_KEY secret in GitHub
```

**3. Key permissions on EC2**
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

### Build Fails: TypeScript Errors

**Problem:** GitHub Actions test job fails with TypeScript errors.

**Solution:**
```bash
# Test locally first
pnpm build

# Fix any TypeScript errors
# Then commit and push
git add .
git commit -m "fix: resolve TypeScript errors"
git push origin main
```

---

### Deployment Fails: "Health check failed"

**Problem:** App deployed but health check endpoint returns error.

**Causes & Solutions:**

**1. App not starting**
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Check PM2 status
pm2 status

# Check logs
pm2 logs work-manager --lines 50

# Common issues:
# - Missing environment variables
# - MongoDB connection failure
# - Port already in use
```

**2. Environment variables not set**
```bash
# Check .env.local exists
cat /var/www/work-manager/.env.local

# If missing or incorrect, update GitHub Secrets and redeploy
```

**3. MongoDB connection issues**
```bash
# Test MongoDB connection
mongosh "YOUR_MONGODB_URI"

# If connection fails:
# - Check MongoDB Atlas IP whitelist (add EC2 IP)
# - Verify credentials in connection string
# - Check MongoDB Atlas cluster is running
```

---

## Server Issues

### Nginx Returns 502 Bad Gateway

**Problem:** Accessing your domain shows 502 error.

**Causes & Solutions:**

**1. Application not running**
```bash
pm2 status
# If stopped:
pm2 restart work-manager
```

**2. Wrong port in Nginx config**
```bash
# Check Nginx config
sudo cat /etc/nginx/sites-available/work-manager | grep proxy_pass
# Should be: proxy_pass http://127.0.0.1:3000;

# Check app is listening on port 3000
sudo netstat -tlnp | grep 3000
```

**3. Nginx not running**
```bash
sudo systemctl status nginx
# If not running:
sudo systemctl start nginx
```

---

### SSL Certificate Issues

**Problem:** HTTPS not working or certificate errors.

**Solutions:**

**1. Certificate not installed**
```bash
# Check if certbot installed certificate
sudo certbot certificates

# If no certificates, install:
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**2. Certificate expired**
```bash
# Renew certificate
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

**3. Nginx not configured for SSL**
```bash
# Check Nginx config
sudo nginx -t

# If errors, the setup script may not have run completely
# Re-run: ./setup-ec2.sh
```

---

### Domain Not Resolving

**Problem:** Domain doesn't point to your server.

**Solutions:**

**1. DNS not configured**
```bash
# Check DNS records
nslookup your-domain.com
dig your-domain.com

# Should return your EC2 IP
# If not, add A records in your domain registrar:
# Type: A, Name: @, Value: YOUR_EC2_IP
# Type: A, Name: www, Value: YOUR_EC2_IP
```

**2. DNS not propagated**
```bash
# Check multiple DNS servers
nslookup your-domain.com 8.8.8.8
nslookup your-domain.com 1.1.1.1

# DNS propagation can take 5-48 hours
# Use IP address temporarily: https://YOUR_EC2_IP
```

---

## Application Issues

### App Crashes Immediately After Start

**Problem:** PM2 shows app as "errored" or constantly restarting.

**Solutions:**

**1. Check error logs**
```bash
pm2 logs work-manager --err --lines 100
```

**2. Environment variables missing**
```bash
cat /var/www/work-manager/.env.local

# Required variables:
# - MONGODB_URI
# - JWT_SECRET
# - GEMINI_API_KEY
# - NODE_ENV=production
```

**3. MongoDB connection failure**
```bash
# Test MongoDB connection
mongosh "YOUR_MONGODB_URI"

# Common issues:
# - Wrong credentials
# - IP not whitelisted in MongoDB Atlas
# - Cluster is paused (free tier)
```

**4. Build artifacts missing**
```bash
cd /var/www/work-manager
ls -la .next/

# If .next/ is missing or incomplete:
pnpm build
pm2 restart work-manager
```

---

### Memory Issues

**Problem:** App crashes with "JavaScript heap out of memory".

**Solutions:**

**1. Increase PM2 memory limit**
```bash
# Edit ecosystem.config.js
nano /var/www/work-manager/ecosystem.config.js

# Change:
max_memory_restart: '2G'  # from 1G

# Restart
pm2 restart work-manager
```

**2. Upgrade EC2 instance**
```
t2.medium (4GB) → t2.large (8GB)
```

---

## Monitoring Issues

### Can't Access PM2 Logs

**Problem:** PM2 logs command shows no output.

**Solution:**
```bash
# Check log file locations
pm2 show work-manager | grep "log path"

# Manually view logs
tail -f /var/log/work-manager/out.log
tail -f /var/log/work-manager/error.log
```

---

### Nginx Logs Not Showing Requests

**Problem:** Nginx access logs are empty.

**Solution:**
```bash
# Check Nginx is handling requests
sudo systemctl status nginx

# Check log file paths
sudo cat /etc/nginx/sites-available/work-manager | grep log

# View logs
sudo tail -f /var/log/nginx/work-manager-access.log
```

---

## Deployment Pipeline Issues

### Automatic Rollback Triggered

**Problem:** Deployment appears successful but rollback happens.

**Cause:** Health check failed after deployment.

**Solution:**
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Check why health check failed
curl http://localhost:3000/api/health

# Common causes:
# 1. App not fully started yet (timeout issue)
# 2. Environment variables wrong
# 3. Database connection failure

# Check logs
pm2 logs work-manager
```

---

### Slow Deployments

**Problem:** Deployments take longer than 3 minutes.

**Causes & Solutions:**

**1. Slow dependency installation**
```bash
# Use frozen lockfile (already configured)
# Ensure pnpm is being used (faster than npm)
```

**2. Slow build process**
```bash
# Check build time locally
time pnpm build

# If slow, consider:
# - Upgrading EC2 instance (more CPU)
# - Optimizing Next.js build configuration
```

**3. Network latency**
```bash
# Choose EC2 region close to your location
# Use faster internet connection for initial setup
```

---

## GitHub Secrets Issues

### Secret Not Working

**Problem:** Deployment fails even though secret is set.

**Solutions:**

**1. Secret has extra spaces**
```bash
# When copying secrets, ensure no trailing spaces
# Especially for EC2_SSH_KEY - must be exact private key content
```

**2. Secret value wrapped in quotes**
```bash
# Don't add quotes when setting secrets
# Wrong: "mongodb+srv://..."
# Right: mongodb+srv://...
```

**3. Secret not updated**
```bash
# After updating a secret, trigger new deployment:
git commit --allow-empty -m "chore: update secrets"
git push origin main
```

---

## Port Conflicts

### Port 3000 Already in Use

**Problem:** Can't start app because port is busy.

**Solution:**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in ecosystem.config.js
# (requires updating Nginx config too)
```

---

## Firewall Issues

### Can't Access Server on Port 80/443

**Problem:** Can access server via SSH but not HTTP/HTTPS.

**Solutions:**

**1. Check AWS Security Group**
```
AWS Console → EC2 → Security Groups
Ensure inbound rules allow:
- Port 80 from 0.0.0.0/0
- Port 443 from 0.0.0.0/0
```

**2. Check UFW firewall**
```bash
sudo ufw status

# Should show:
# 80/tcp    ALLOW
# 443/tcp   ALLOW

# If not:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## Quick Diagnostic Commands

### Check Everything
```bash
# Application status
pm2 status
pm2 logs work-manager --lines 20

# Nginx status
sudo systemctl status nginx
sudo nginx -t

# Health check
curl http://localhost:3000/api/health

# Disk space
df -h

# Memory
free -h

# Process list
ps aux | grep node

# Network connections
sudo netstat -tlnp

# Firewall status
sudo ufw status
```

---

## Getting More Help

### Collect Diagnostic Information

Before asking for help, collect this information:

```bash
# 1. PM2 status and logs
pm2 status > diagnostic.txt
pm2 logs work-manager --lines 100 >> diagnostic.txt

# 2. Nginx status and config
sudo systemctl status nginx >> diagnostic.txt
sudo nginx -t >> diagnostic.txt

# 3. System information
uname -a >> diagnostic.txt
df -h >> diagnostic.txt
free -h >> diagnostic.txt

# 4. Environment check (remove sensitive data!)
cat /var/www/work-manager/.env.local | sed 's/=.*/=***/' >> diagnostic.txt

# 5. Recent deployments
cd /var/www/work-manager
git log --oneline -n 10 >> diagnostic.txt
```

### Contact Support

Share the diagnostic information above when:
1. Creating a GitHub issue
2. Asking in community forums
3. Contacting support

---

**Last Updated**: 2025-11-12
