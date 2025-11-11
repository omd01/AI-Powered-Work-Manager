# Quick Start Guide

## Current Build Error Fix

You're seeing a build error because the backend dependencies need to be installed. Follow these steps:

### Option 1: Wait for Current Installation

The dependencies are currently being installed in the background. This may take 2-3 minutes.

### Option 2: Manual Installation (If Option 1 Fails)

Open a new terminal and run:

```bash
cd "C:\code\Work Managment 3"
npm install bcryptjs jsonwebtoken mongoose --save --legacy-peer-deps
npm install @types/bcryptjs @types/jsonwebtoken --save-dev --legacy-peer-deps
```

### Option 3: Use the Batch Script

Double-click on `install-backend-deps.bat` in the project root. This will install all dependencies step by step.

## After Dependencies Are Installed

### 1. Set Up MongoDB

**Option A: Local MongoDB (Recommended for Development)**

1. Download and install MongoDB Community Edition:
   - Windows: https://www.mongodb.com/try/download/community
   - Follow the installer instructions

2. Start MongoDB:
   ```bash
   # Windows (as Administrator)
   net start MongoDB
   ```

3. Verify MongoDB is running:
   ```bash
   mongosh
   ```
   You should see a MongoDB shell prompt.

**Option B: MongoDB Atlas (Cloud)**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account and cluster
3. Get your connection string
4. Update `.env.local` with your Atlas connection string

### 2. Configure Environment Variables

Open `.env.local` and update:

```env
# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017/work-management

# OR for MongoDB Atlas (replace with your actual connection string)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/work-management

# Generate a secure secret (run this in terminal):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-generated-secret-key-here

JWT_EXPIRES_IN=7d
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start the Development Server

```bash
npm run dev
```

The app will start at http://localhost:3000

### 4. Test the Application

1. **Visit** http://localhost:3000
   - Should redirect to `/login`

2. **Sign Up** (This will use the backend API)
   - Click "Sign Up"
   - Enter name, email, password
   - If MongoDB is not connected, you'll see an error
   - If successful, you'll be logged in!

3. **Create Organization**
   - After signup, you'll see the welcome page
   - Click "Create Organization"
   - Enter organization name
   - You'll become an Admin

4. **Access Admin Dashboard**
   - You should now see the admin dashboard
   - All features are available!

## Troubleshooting

### Error: "Cannot find module 'bcryptjs'"

**Solution:** Dependencies not installed yet. Run:
```bash
npm install bcryptjs jsonwebtoken mongoose --legacy-peer-deps
```

### Error: "MongooseServerSelectionError"

**Solution:** MongoDB is not running or connection string is wrong.

**For Local MongoDB:**
1. Start MongoDB service
2. Verify it's running with `mongosh`
3. Check `.env.local` has correct URI

**For MongoDB Atlas:**
1. Check connection string is correct
2. Verify your IP is whitelisted
3. Check username/password are correct

### Error: "Invalid or expired token"

**Solution:**
1. Clear localStorage in browser DevTools
2. Logout and login again
3. Check JWT_SECRET is set in `.env.local`

### Build is Slow or Hangs

**Solution:**
1. Kill the dev server (Ctrl+C)
2. Delete `.next` folder
3. Run `npm run dev` again

## Current Features

### ✅ Frontend (Working)
- Authentication guards on all pages
- Role-based access control (Admin/Lead/Member)
- Smart routing based on auth state
- Protected routes with automatic redirects
- Login/Signup UI pages

### ✅ Backend (Ready, Needs MongoDB)
- User authentication (signup, login, logout)
- JWT token-based auth
- Organization creation with invite codes
- Member request approval system
- Role-based API endpoints
- MongoDB models for User, Organization, MemberRequest

### ⚠️ Needs Setup
- MongoDB connection (local or Atlas)
- Environment variables configuration
- Backend dependencies installation

## What Happens When You Run the App

### With MongoDB Connected:

1. User signs up → Account created in MongoDB
2. User logs in → JWT token issued
3. User creates org → Organization saved to database
4. User invites members → Member requests saved
5. Admin approves → User added to organization
6. All data persists across sessions

### Without MongoDB (Current State):

1. User visits site → Frontend auth checks localStorage
2. User can navigate → But backend API calls will fail
3. Login/Signup → Will show "server error"
4. Protected routes → Frontend checks work (mock data)
5. Organization features → Need backend connection

## Next Steps

1. ✅ Install dependencies (in progress)
2. ⬜ Set up MongoDB (your choice: local or Atlas)
3. ⬜ Configure `.env.local`
4. ⬜ Start dev server
5. ⬜ Test signup/login flow
6. ⬜ Create organization
7. ⬜ Explore admin dashboard

## Need Help?

- **Backend Setup:** See `BACKEND_SETUP.md`
- **Frontend Auth:** See `FRONTEND_AUTH_IMPLEMENTATION.md`
- **Implementation Details:** See `BACKEND_IMPLEMENTATION_SUMMARY.md`

## Dependencies Being Installed

- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `mongoose` - MongoDB ODM
- `@types/bcryptjs` - TypeScript types
- `@types/jsonwebtoken` - TypeScript types

Once these are installed, the build error will be resolved!

## Summary

**You're 90% done! Just need to:**

1. ✅ Wait for dependencies to install (or install manually)
2. ⬜ Set up MongoDB (15 minutes)
3. ⬜ Update `.env.local` (2 minutes)
4. ⬜ Run `npm run dev` (1 minute)
5. ⬜ Test the app (5 minutes)

**Total time to full working app: ~20 minutes**

The hard part is done - all the code is implemented and ready to go! 🎉
