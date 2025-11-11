# Backend Setup Guide

This guide will help you set up the MongoDB backend for the Work Management System.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB installed locally OR MongoDB Atlas account
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB (Recommended for Development)

1. **Install MongoDB Community Edition**
   - Windows: Download from https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: Follow instructions at https://docs.mongodb.com/manual/administration/install-on-linux/

2. **Start MongoDB Service**
   ```bash
   # Windows
   net start MongoDB

   # Mac
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

3. **Verify MongoDB is running**
   ```bash
   mongosh
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password

### 3. Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your settings:
   ```env
   # For Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/work-management

   # OR for MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/work-management

   # Generate a secure JWT secret
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d

   NODE_ENV=development
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Generate a secure JWT secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste it as your `JWT_SECRET`.

### 4. Start the Development Server

```bash
npm run dev
```

The server will start at http://localhost:3000

## Database Schema

### Collections

#### 1. Users
- Stores all user information
- Fields: name, email, password (hashed), role, organizationId, skills, profilePicture
- Roles: Admin, Lead, Member

#### 2. Organizations
- Stores organization information
- Fields: name, handle, adminId, inviteCode, members[]
- Each organization has a unique invite code

#### 3. MemberRequests
- Stores join requests from users
- Fields: userId, organizationId, status, inviteCode, requestedAt, processedAt
- Status: pending, approved, rejected

## API Endpoints

### Authentication

#### Sign Up
```
POST /api/auth/signup
Body: { name, email, password, profilePicture? }
Response: { success, user, token }
```

#### Login
```
POST /api/auth/login
Body: { email, password }
Response: { success, user, token }
```

#### Logout
```
POST /api/auth/logout
Response: { success, message }
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { success, user }
```

### Organizations

#### Create Organization
```
POST /api/organizations/create
Headers: Authorization: Bearer <token>
Body: { name, handle }
Response: { success, organization, token }
```

#### Get Organization by Invite Code
```
GET /api/organizations/[inviteCode]
Response: { success, organization }
```

### Member Requests

#### Create Join Request
```
POST /api/member-requests/create
Headers: Authorization: Bearer <token>
Body: { inviteCode }
Response: { success, request }
```

#### Get Pending Requests (Admin/Lead only)
```
GET /api/member-requests/pending
Headers: Authorization: Bearer <token>
Response: { success, requests[], count }
```

#### Process Request (Admin only)
```
POST /api/member-requests/[requestId]/process
Headers: Authorization: Bearer <token>
Body: { action: "approve" | "reject" }
Response: { success, message, request }
```

#### Check Request Status
```
GET /api/member-requests/status
Headers: Authorization: Bearer <token>
Response: { success, hasRequest, status, request }
```

## Authentication Flow

### 1. Sign Up Flow
1. User signs up with email and password
2. Backend creates user with role "Member"
3. JWT token is generated and returned
4. Token is stored in HTTP-only cookie
5. User redirected to welcome page

### 2. Create Organization Flow
1. Authenticated user creates organization
2. User role is updated to "Admin"
3. User is added to organization members
4. New token with updated role is generated
5. Unique invite code is generated

### 3. Join Organization Flow
1. User enters invite code
2. Backend validates invite code
3. Member request is created with status "pending"
4. User sees waiting approval page
5. Admin receives notification

### 4. Admin Approval Flow
1. Admin sees pending requests
2. Admin approves/rejects request
3. If approved:
   - User is added to organization members
   - User's organizationId is updated
   - User role is set to "Member"
4. If rejected:
   - Request status is updated to "rejected"
   - User sees rejection page

## Security Features

### Password Security
- Passwords are hashed using bcryptjs with salt rounds of 10
- Passwords are never returned in API responses
- Password field uses `select: false` in schema

### JWT Authentication
- HTTP-only cookies prevent XSS attacks
- Tokens expire after configured time (default: 7 days)
- Tokens include user ID, email, role, and organizationId
- Secure flag enabled in production

### Role-Based Access Control
- Admin: Full access to organization management
- Lead: Can view pending requests, manage team
- Member: Basic access to assigned tasks

### Request Validation
- Email validation using regex
- Password minimum length: 6 characters
- Organization handle validation (lowercase, alphanumeric, hyphens)
- Duplicate prevention for emails and handles

## Testing the API

### Using cURL

**Sign Up:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}' \
  -c cookies.txt
```

**Create Organization:**
```bash
curl -X POST http://localhost:3000/api/organizations/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"My Company","handle":"my-company"}'
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables for token
3. Use Bearer token authentication
4. Test each endpoint

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongooseServerSelectionError"**
- Check if MongoDB is running: `mongosh`
- Verify connection string in `.env.local`
- Check firewall settings

**Error: "Authentication failed"**
- Verify MongoDB username/password (for Atlas)
- Check IP whitelist (for Atlas)

### JWT Token Issues

**Error: "Invalid or expired token"**
- Token may have expired (check JWT_EXPIRES_IN)
- Generate new token by logging in again
- Verify JWT_SECRET is set correctly

### Dependency Issues

**Error during npm install**
- Use `--legacy-peer-deps` flag:
  ```bash
  npm install --legacy-peer-deps
  ```

## Production Deployment

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/work-management
JWT_SECRET=<strong-random-64-character-string>
JWT_EXPIRES_IN=7d
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### Security Checklist

- [ ] Use strong JWT secret (at least 64 characters)
- [ ] Enable HTTPS in production
- [ ] Set secure: true for cookies
- [ ] Whitelist allowed IP addresses (MongoDB Atlas)
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular database backups
- [ ] Update dependencies regularly

## Development Tips

### Database Seeding

Create seed data for testing:

```javascript
// Run this in mongosh or create a seed script
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$10$...", // hashed password
  role: "Admin"
})
```

### Debugging

Enable MongoDB query logging:
```javascript
mongoose.set('debug', true)
```

### Database GUI Tools

- MongoDB Compass (Official GUI)
- Studio 3T
- Robo 3T

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check MongoDB logs
4. Verify environment variables

## License

MIT License - See LICENSE file for details
