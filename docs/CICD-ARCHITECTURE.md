# CI/CD Architecture Diagram

## Complete CI/CD Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER WORKFLOW                             │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ git push origin main
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         GITHUB REPOSITORY                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Source Code + GitHub Actions Workflow                       │  │
│  │  - .github/workflows/deploy.yml                              │  │
│  │  - ecosystem.config.js                                       │  │
│  │  - scripts/setup-ec2.sh                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Webhook Trigger
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        GITHUB ACTIONS                                 │
│                                                                       │
│  ┌──────────────────┐                                               │
│  │   Job 1: TEST    │                                               │
│  │  ┌────────────┐  │                                               │
│  │  │ Checkout   │  │                                               │
│  │  │ Code       │  │                                               │
│  │  └─────┬──────┘  │                                               │
│  │        │         │                                               │
│  │        ▼         │                                               │
│  │  ┌────────────┐  │                                               │
│  │  │ Setup      │  │                                               │
│  │  │ Node.js    │  │                                               │
│  │  └─────┬──────┘  │                                               │
│  │        │         │                                               │
│  │        ▼         │                                               │
│  │  ┌────────────┐  │                                               │
│  │  │ Install    │  │                                               │
│  │  │ pnpm       │  │                                               │
│  │  └─────┬──────┘  │                                               │
│  │        │         │                                               │
│  │        ▼         │                                               │
│  │  ┌────────────┐  │                                               │
│  │  │ Install    │  │                                               │
│  │  │ Deps       │  │                                               │
│  │  └─────┬──────┘  │                                               │
│  │        │         │                                               │
│  │        ▼         │                                               │
│  │  ┌────────────┐  │         ┌────────────┐                       │
│  │  │ TypeScript │  │────────▶│ ✅ PASS    │                       │
│  │  │ Build Test │  │         │ ❌ FAIL    │                       │
│  │  └────────────┘  │         └─────┬──────┘                       │
│  └──────────────────┘               │                               │
│                                      │                               │
│                    ┌─────────────────┴──────────────┐               │
│                    │                                 │               │
│                    ▼                                 ▼               │
│         ┌──────────────────┐              ┌─────────────────┐      │
│         │   Job 2: DEPLOY  │              │  Stop Pipeline   │      │
│         │  (if tests pass) │              │  (if tests fail) │      │
│         └────────┬─────────┘              └──────────────────┘      │
│                  │                                                   │
│                  │ SSH Connection                                    │
│                  │ (using secrets)                                   │
└──────────────────┼───────────────────────────────────────────────────┘
                   │
                   │ EC2_HOST, EC2_USER, EC2_SSH_KEY
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          AWS EC2 SERVER                               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Deployment Steps (Executed via SSH)                         │  │
│  │                                                               │  │
│  │  1. Navigate to /var/www/work-manager                        │  │
│  │     │                                                         │  │
│  │     ▼                                                         │  │
│  │  2. Pull Latest Code                                         │  │
│  │     │ git fetch origin                                       │  │
│  │     │ git reset --hard origin/main                           │  │
│  │     │                                                         │  │
│  │     ▼                                                         │  │
│  │  3. Install Dependencies                                     │  │
│  │     │ pnpm install --frozen-lockfile --prod                  │  │
│  │     │                                                         │  │
│  │     ▼                                                         │  │
│  │  4. Update Environment Variables                             │  │
│  │     │ Write .env.local with GitHub Secrets                   │  │
│  │     │ - MONGODB_URI                                          │  │
│  │     │ - JWT_SECRET                                           │  │
│  │     │ - GEMINI_API_KEY                                       │  │
│  │     │ - NODE_ENV=production                                  │  │
│  │     │                                                         │  │
│  │     ▼                                                         │  │
│  │  5. Build Application                                        │  │
│  │     │ pnpm build                                             │  │
│  │     │                                                         │  │
│  │     ▼                                                         │  │
│  │  6. Reload PM2 (Zero-Downtime)                               │  │
│  │     │ pm2 reload ecosystem.config.js --update-env            │  │
│  │     │                                                         │  │
│  │     ▼                                                         │  │
│  │  7. Health Check                                             │  │
│  │     │ curl http://localhost:3000/api/health                  │  │
│  │     │                                                         │  │
│  │     ├─▶ ✅ Success → Deployment Complete                     │  │
│  │     └─▶ ❌ Failure → Trigger Rollback                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Runtime Environment                                          │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │  PM2 Process Manager                                 │    │  │
│  │  │  - work-manager (cluster mode)                       │    │  │
│  │  │    ├─ Instance 1 (port 3000)                         │    │  │
│  │  │    ├─ Instance 2 (port 3000)                         │    │  │
│  │  │    ├─ Instance 3 (port 3000)                         │    │  │
│  │  │    └─ Instance 4 (port 3000)                         │    │  │
│  │  │                                                       │    │  │
│  │  │  Features:                                            │    │  │
│  │  │  - Load balancing                                     │    │  │
│  │  │  - Auto-restart on crash                             │    │  │
│  │  │  - Memory limit (1GB)                                │    │  │
│  │  │  - Log rotation                                       │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  │                               ▲                               │  │
│  │                               │                               │  │
│  │                               │ Reverse Proxy                 │  │
│  │  ┌────────────────────────────┴──────────────────────────┐  │  │
│  │  │  Nginx Web Server                                      │  │  │
│  │  │  - Port 80 (HTTP) → Redirect to HTTPS                 │  │  │
│  │  │  - Port 443 (HTTPS) → Proxy to PM2                    │  │  │
│  │  │                                                        │  │  │
│  │  │  Features:                                             │  │  │
│  │  │  ✅ SSL/TLS Termination                               │  │  │
│  │  │  ✅ Rate Limiting                                      │  │  │
│  │  │  ✅ Static Asset Caching                              │  │  │
│  │  │  ✅ Gzip Compression                                   │  │  │
│  │  │  ✅ Security Headers                                   │  │  │
│  │  │  ✅ Request/Error Logging                             │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTPS (Port 443)
                                 │
┌─────────────────────────────────────────────────────────────────────┐
│                            INTERNET                                   │
│                                                                       │
│  ┌──────────────────┐         ┌──────────────────┐                  │
│  │   End Users      │◀───────▶│   your-domain    │                  │
│  │   (Browsers)     │         │   .com           │                  │
│  └──────────────────┘         └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                  │
│                                                                       │
│  ┌──────────────────┐         ┌──────────────────┐                  │
│  │  MongoDB Atlas   │◀───────▶│  Application     │                  │
│  │  (Database)      │         │  connects via    │                  │
│  │                  │         │  MONGODB_URI     │                  │
│  └──────────────────┘         └──────────────────┘                  │
│                                                                       │
│  ┌──────────────────┐         ┌──────────────────┐                  │
│  │  Google Gemini   │◀───────▶│  AI Task         │                  │
│  │  AI              │         │  Assignment      │                  │
│  │                  │         │  Feature         │                  │
│  └──────────────────┘         └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Deployment Timeline

```
Time     Action
─────────────────────────────────────────────────────────────
0:00     Developer pushes to main branch
0:01     GitHub Actions webhook triggers
0:05     Tests complete (TypeScript build)
0:10     SSH connection established
0:15     Code pulled from GitHub
0:30     Dependencies installed
1:00     Application built
1:30     PM2 reload initiated
2:00     Health check executed
2:30     Deployment verified
3:00     ✅ DEPLOYMENT COMPLETE
```

## Rollback Flow (If Deployment Fails)

```
Deployment Failure Detected
         │
         ▼
┌──────────────────┐
│  Job 3: ROLLBACK │
│  (automatically) │
└────────┬─────────┘
         │
         ▼
   SSH to EC2
         │
         ▼
   git reset --hard HEAD~1
         │
         ▼
   pnpm install
         │
         ▼
   pnpm build
         │
         ▼
   pm2 reload work-manager
         │
         ▼
   ✅ Previous version restored
```

## Security Flow

```
┌──────────────────────────────────────────────────────────┐
│  GITHUB SECRETS (Encrypted at Rest)                      │
│  - EC2_SSH_KEY (Private key, never exposed)              │
│  - JWT_SECRET (32+ char random string)                   │
│  - MONGODB_URI (Connection string with credentials)      │
│  - GEMINI_API_KEY (API key)                              │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ Injected at deploy time
                   ▼
┌──────────────────────────────────────────────────────────┐
│  EC2 SERVER                                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │  /var/www/work-manager/.env.local                  │  │
│  │  (File permissions: 600, owner: ubuntu)            │  │
│  │  - Only readable by app process                    │  │
│  │  - Not in git repository                           │  │
│  │  - Overwritten on each deployment                  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Monitoring & Logging Flow

```
┌─────────────────────────────────────────────────────────┐
│  APPLICATION                                             │
│  ├─ Next.js Server                                      │
│  ├─ API Routes                                          │
│  └─ Business Logic                                      │
└──────────────┬──────────────────────────────────────────┘
               │
               │ Logs (stdout/stderr)
               ▼
┌─────────────────────────────────────────────────────────┐
│  PM2 LOG AGGREGATION                                     │
│  ├─ /var/log/work-manager/out.log                      │
│  ├─ /var/log/work-manager/error.log                    │
│  └─ Auto-rotation (daily, keep 14 days)                │
└──────────────┬──────────────────────────────────────────┘
               │
               │ HTTP Requests
               ▼
┌─────────────────────────────────────────────────────────┐
│  NGINX LOGS                                              │
│  ├─ /var/log/nginx/work-manager-access.log             │
│  │  (All HTTP requests, response times, status codes)  │
│  └─ /var/log/nginx/work-manager-error.log              │
│     (Nginx errors, proxy errors)                        │
└─────────────────────────────────────────────────────────┘
```

## Network Architecture

```
                Internet
                   │
                   │ Port 443 (HTTPS)
                   ▼
┌──────────────────────────────────────────┐
│  AWS Security Group                       │
│  ┌────────────────────────────────────┐  │
│  │  Inbound Rules:                    │  │
│  │  ✅ SSH (22)    → Your IP          │  │
│  │  ✅ HTTP (80)   → 0.0.0.0/0        │  │
│  │  ✅ HTTPS (443) → 0.0.0.0/0        │  │
│  └────────────────────────────────────┘  │
└──────────────┬───────────────────────────┘
               │
               │
               ▼
┌──────────────────────────────────────────┐
│  EC2 Instance Firewall (UFW)              │
│  ┌────────────────────────────────────┐  │
│  │  Active Rules:                     │  │
│  │  ✅ 22/tcp   ALLOW  (SSH)          │  │
│  │  ✅ 80/tcp   ALLOW  (HTTP)         │  │
│  │  ✅ 443/tcp  ALLOW  (HTTPS)        │  │
│  │  ❌ 3000/tcp DENY   (Internal)     │  │
│  └────────────────────────────────────┘  │
└──────────────┬───────────────────────────┘
               │
               │ Nginx listens on 80, 443
               ▼
┌──────────────────────────────────────────┐
│  Nginx (Reverse Proxy)                    │
│  - SSL Termination                        │
│  - Rate Limiting                          │
│  - Proxy to localhost:3000                │
└──────────────┬───────────────────────────┘
               │
               │ Internal only (localhost)
               ▼
┌──────────────────────────────────────────┐
│  PM2 + Next.js                            │
│  - Listens on localhost:3000              │
│  - Not exposed to internet                │
│  - Only accessible via Nginx              │
└──────────────────────────────────────────┘
```

## High Availability Setup

```
┌─────────────────────────────────────────────────────┐
│  PM2 Cluster Mode (ecosystem.config.js)             │
│                                                      │
│  Process 1 ──┐                                      │
│  Process 2 ──┼── All handle requests                │
│  Process 3 ──┼── Load balanced automatically        │
│  Process 4 ──┘                                      │
│                                                      │
│  If one crashes:                                     │
│  1. PM2 auto-restarts it (< 1 second)              │
│  2. Other processes continue serving               │
│  3. Zero downtime                                   │
└─────────────────────────────────────────────────────┘
```

## Complete Request Flow

```
1. User Request
   └─▶ https://your-domain.com/api/tasks

2. DNS Resolution
   └─▶ Resolves to EC2 Public IP

3. AWS Security Group
   └─▶ Allows port 443

4. UFW Firewall
   └─▶ Allows port 443

5. Nginx
   ├─▶ SSL Termination (HTTPS → HTTP)
   ├─▶ Rate Limiting Check
   ├─▶ Security Headers
   └─▶ Proxy to localhost:3000

6. PM2 Load Balancer
   └─▶ Routes to available process

7. Next.js Application
   ├─▶ JWT Authentication
   ├─▶ API Route Handler
   ├─▶ Database Query
   └─▶ Response

8. Response Flow (reverse)
   └─▶ Next.js → PM2 → Nginx → User
```

---

This architecture provides:
- ✅ High availability
- ✅ Zero-downtime deployments
- ✅ Automatic failover
- ✅ Load balancing
- ✅ SSL/TLS encryption
- ✅ Rate limiting
- ✅ Comprehensive logging
- ✅ Automatic rollback
- ✅ Health monitoring
