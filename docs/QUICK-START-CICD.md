# Quick Start: CI/CD Setup

Get your automated deployment pipeline running in under 30 minutes!

## TL;DR

```bash
# 1. Launch EC2 instance (Ubuntu 22.04, t2.medium)
# 2. Copy and run setup script
scp -i your-key.pem scripts/setup-ec2.sh ubuntu@EC2_IP:~/
ssh -i your-key.pem ubuntu@EC2_IP
export DOMAIN="your-domain.com"
export GITHUB_REPO="your-username/work-manager"
./setup-ec2.sh

# 3. Add GitHub Secrets (see below)
# 4. Push to main → Auto deploy!
```

## Step-by-Step (30 Minutes)

### ⏱️ 5 Minutes: Launch EC2

1. **AWS Console** → EC2 → Launch Instance
   ```
   Name: work-manager-prod
   Image: Ubuntu 22.04 LTS
   Instance type: t2.medium
   Key pair: Download your-key.pem
   ```

2. **Security Group Rules:**
   ```
   SSH (22)    → Your IP
   HTTP (80)   → Anywhere
   HTTPS (443) → Anywhere
   ```

3. **Note your EC2 Public IP**: `54.123.45.67`

### ⏱️ 10 Minutes: Configure Server

```bash
# Connect to EC2
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Copy setup script (from your local machine)
scp -i your-key.pem scripts/setup-ec2.sh ubuntu@YOUR_EC2_IP:~/

# Back on EC2, run setup
chmod +x setup-ec2.sh

# Fix line endings (if needed - Windows to Linux)
sed -i 's/\r$//' setup-ec2.sh

# Set environment and run
export DOMAIN="your-domain.com"  # Your actual domain
export GITHUB_REPO="your-username/work-manager"
./setup-ec2.sh
```

☕ **Grab coffee** - This takes ~8 minutes

### ⏱️ 5 Minutes: Setup GitHub Secrets

1. **Generate SSH key** (on your local machine):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/gh_actions
   ```

2. **Add public key to EC2**:
   ```bash
   cat ~/.ssh/gh_actions.pub
   # Copy the output

   # On EC2:
   echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
   ```

3. **Add to GitHub** (Settings → Secrets → Actions):
   ```
   EC2_HOST = YOUR_EC2_IP
   EC2_USER = ubuntu
   EC2_SSH_KEY = <content of ~/.ssh/gh_actions>
   EC2_PORT = 22
   MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/db
   JWT_SECRET = <generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   GEMINI_API_KEY = <your-gemini-key>
   NEXT_PUBLIC_API_URL = https://your-domain.com
   ```

### ⏱️ 5 Minutes: Configure Domain

1. **DNS Settings** (in your domain registrar):
   ```
   Type: A
   Name: @
   Value: YOUR_EC2_IP

   Type: A
   Name: www
   Value: YOUR_EC2_IP
   ```

2. **Wait for DNS** (5-15 minutes):
   ```bash
   nslookup your-domain.com
   ```

### ⏱️ 5 Minutes: Get SSL & Deploy

1. **On EC2**, get SSL certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   # Enter email, agree to terms, choose redirect option 2
   ```

2. **Deploy** (from your local machine):
   ```bash
   git add .
   git commit -m "chore: setup CI/CD"
   git push origin main
   ```

3. **Watch deployment**:
   - Go to GitHub → Actions
   - See your deployment running!
   - Should complete in ~3 minutes

4. **Test**:
   ```bash
   curl https://your-domain.com/api/health
   ```

   Expected:
   ```json
   {"status":"healthy","timestamp":"..."}
   ```

## ✅ You're Done!

### What Happens Now?

Every time you push to `main`:
1. ✅ GitHub Actions runs tests
2. ✅ Builds your application
3. ✅ Deploys to EC2
4. ✅ Restarts PM2
5. ✅ Runs health check

### Monitor Your App

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# View status
pm2 status

# View logs
pm2 logs work-manager

# Monitor resources
pm2 monit
```

### Test the Pipeline

Make a small change:
```bash
# Edit any file
echo "// Test change" >> app/page.tsx

# Commit and push
git add .
git commit -m "test: CI/CD pipeline"
git push origin main

# Watch in GitHub → Actions
```

Your app will automatically deploy in ~3 minutes!

## Troubleshooting

### Deployment Fails?

1. **Check GitHub Actions logs**:
   - GitHub → Actions → Click failed run
   - Look for red error messages

2. **Common issues**:
   ```bash
   # SSH key not working?
   ssh -i ~/.ssh/gh_actions ubuntu@EC2_IP

   # Secrets not set?
   Check GitHub → Settings → Secrets

   # App not starting?
   ssh to EC2: pm2 logs work-manager
   ```

### Need Help?

See full documentation: [CI-CD-SETUP.md](./CI-CD-SETUP.md)

## Useful Commands

```bash
# On EC2:
pm2 status                    # Check app status
pm2 logs work-manager        # View logs
pm2 restart work-manager     # Restart app
sudo systemctl status nginx  # Check Nginx
sudo nginx -t                # Test Nginx config

# Check health:
curl http://localhost:3000/api/health

# View Nginx logs:
sudo tail -f /var/log/nginx/work-manager-access.log
```

## Next Steps

- [ ] Set up monitoring (optional)
- [ ] Configure Slack notifications (optional)
- [ ] Set up staging environment (optional)
- [ ] Configure database backups
- [ ] Review security settings

## Cost Estimate

**AWS EC2 (t2.medium)**:
- ~$30-35/month
- Includes: 2 vCPUs, 4GB RAM
- +$0.10/GB data transfer

**Total**: ~$35-40/month for production server

**Free/Cheap alternatives**:
- MongoDB Atlas: Free tier (512MB)
- Let's Encrypt SSL: Free
- Domain: ~$12/year

---

## Summary

You now have:
- ✅ Automated CI/CD pipeline
- ✅ Production server on EC2
- ✅ SSL certificate
- ✅ Automatic deployments
- ✅ Zero-downtime updates
- ✅ Health monitoring
- ✅ Automatic rollback on failure

**Total setup time**: ~30 minutes
**Deploy time**: ~3 minutes per push

🎉 **Congratulations!** Your production deployment pipeline is ready!
