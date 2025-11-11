# Organization Pages - Backend Integration

## Overview

Updated the create and join organization pages to integrate with the real backend API instead of using mock/fake data.

## What Was Updated

### 1. Join Organization Page (`app/join-organization/page.tsx`)

#### ❌ Before (Mock Data):
```typescript
// Fake data
setTimeout(() => {
  setOrgInfo({
    id: "org-123",
    name: "Acme Corp",
    memberCount: 24,
    adminName: "Sarah Chen",
  })
}, 500)

// Fake join request
setTimeout(() => {
  localStorage.setItem("pendingOrg", JSON.stringify(orgInfo))
  localStorage.setItem("memberStatus", "pending")
  router.push("/waiting-approval")
}, 1500)
```

#### ✅ After (Real Backend):
```typescript
// Fetch real organization data
const response = await fetch(`/api/organizations/${inviteCode}`)
const data = await response.json()

// Real join request
const response = await fetch("/api/member-requests/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  credentials: "include",
  body: JSON.stringify({ inviteCode }),
})
```

**New Features:**
- ✅ Fetches real organization info from API
- ✅ Validates invite code against database
- ✅ Creates member request in database
- ✅ Shows error messages for invalid codes
- ✅ Loading states
- ✅ Error handling with user feedback
- ✅ Disabled form during submission

**API Endpoints Used:**
- `GET /api/organizations/[inviteCode]` - Get organization details
- `POST /api/member-requests/create` - Create join request

---

### 2. Create Organization Page (`app/create-organization/page.tsx`)

#### ❌ Before (Mock Data):
```typescript
// Fake organization creation
setTimeout(() => {
  const newOrg = {
    id: "org-" + Date.now(),
    name: orgName,
    handle: orgHandle,
  }
  localStorage.setItem("currentOrg", JSON.stringify(newOrg))
  localStorage.setItem("userRole", "Admin")
  router.push("/admin")
}, 1500)
```

#### ✅ After (Real Backend):
```typescript
// Real organization creation
const response = await fetch("/api/organizations/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  credentials: "include",
  body: JSON.stringify({
    name: orgName,
    handle: orgHandle,
  }),
})

const data = await response.json()

// Update user token with new role (Admin)
if (data.token) {
  localStorage.setItem("token", data.token)
}

// Refresh user context
await refreshUser()
```

**New Features:**
- ✅ Creates organization in MongoDB
- ✅ Generates unique invite code
- ✅ Updates user role to Admin
- ✅ Issues new JWT token with Admin role
- ✅ Auto-generates handle from name
- ✅ Validates handle format (lowercase, alphanumeric, hyphens)
- ✅ Shows error for duplicate handles
- ✅ Error handling with user feedback
- ✅ Disabled form during submission
- ✅ Refreshes auth context with new user data

**API Endpoints Used:**
- `POST /api/organizations/create` - Create new organization

---

## Features Added

### Join Organization Flow

**1. Invite Code Validation**
```
User enters invite code in welcome page
  ↓
Code stored in localStorage
  ↓
Join page fetches org details from API
  ↓
If invalid → Shows error page
If valid → Shows organization details
```

**2. Organization Details Display**
- Organization name
- Member count
- Admin name
- Invite code (for confirmation)

**3. Join Request**
```
User clicks "Request to Join"
  ↓
POST /api/member-requests/create
  ↓
Request stored in database with status "pending"
  ↓
Redirect to waiting-approval page
  ↓
Admin sees request in Members page
```

**4. Error Handling**
- Invalid invite code → Error page
- API errors → Error message in form
- Network errors → User-friendly message
- Duplicate requests → Shows error

---

### Create Organization Flow

**1. Auto-Generated Handle**
```
User types: "Acme Corporation"
  ↓
Auto-generates: "acme-corporation"
  ↓
User can edit if desired
  ↓
Validation: lowercase, alphanumeric, hyphens only
```

**2. Organization Creation**
```
User enters name and handle
  ↓
POST /api/organizations/create
  ↓
Creates organization in MongoDB
  ↓
Generates unique 8-character invite code
  ↓
Adds user as first member with Admin role
  ↓
Issues new JWT token with Admin role
  ↓
Refresh auth context
  ↓
Redirect to admin dashboard
```

**3. Role Update**
```
Before: User role = "Member"
  ↓
Create Organization
  ↓
After: User role = "Admin"
  ↓
New JWT token issued
  ↓
Can access admin-only features
```

**4. Error Handling**
- Duplicate handle → Shows error
- Invalid handle format → Shows error
- API errors → User-friendly message
- Network errors → Clear feedback

---

## Technical Implementation

### Authentication Integration

Both pages now use `useAuth()` hook:
```typescript
const { user, refreshUser } = useAuth()
```

**Benefits:**
- Access to current user data
- Can refresh user after role change
- Consistent auth state management

### Token Management

**Join Organization:**
```typescript
const token = localStorage.getItem("token")

fetch("/api/member-requests/create", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
  credentials: "include",
})
```

**Create Organization:**
```typescript
// New token with Admin role
if (data.token) {
  localStorage.setItem("token", data.token)
}
await refreshUser() // Update auth context
```

### Error Handling

Consistent error display across both pages:
```tsx
{error && (
  <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
  </div>
)}
```

### Loading States

**Join Organization:**
- Loading organization details
- Sending join request
- Disabled buttons during operation

**Create Organization:**
- Creating organization
- Disabled form during operation
- Loading spinner in button

---

## Complete Flow Example

### **Scenario: New User Signs Up and Creates Organization**

```
1. User signs up
   POST /api/auth/signup
   → Creates user with role "Member"

2. User redirected to /welcome
   → Sees "Create Organization" option

3. User clicks "Create Organization"
   → Redirected to /create-organization

4. User enters:
   Name: "Tech Startup Inc"
   Handle: "tech-startup" (auto-generated, can edit)

5. Clicks "Create Organization"
   POST /api/organizations/create
   ↓
   Backend:
   - Creates organization in MongoDB
   - Generates invite code: "ABC12XYZ"
   - Updates user role to "Admin"
   - Adds user to organization.members
   - Issues new JWT token
   ↓
   Frontend:
   - Stores new token
   - Stores org info
   - Refreshes auth context
   - Redirects to /admin

6. User now on admin dashboard
   - Can see organization name
   - Can access admin features
   - Can invite team members with code "ABC12XYZ"
```

### **Scenario: User Joins Existing Organization**

```
1. User gets invite code: "ABC12XYZ"

2. User signs up
   POST /api/auth/signup
   → Creates user with role "Member"

3. User redirected to /welcome
   → Enters invite code: "ABC12XYZ"

4. Click "Continue"
   → Redirected to /join-organization

5. Page loads:
   GET /api/organizations/ABC12XYZ
   ↓
   Shows organization details:
   - Name: "Tech Startup Inc"
   - Admin: "John Doe"
   - Members: 5

6. User clicks "Request to Join"
   POST /api/member-requests/create
   ↓
   Backend:
   - Creates request with status "pending"
   - Links to user and organization
   ↓
   Frontend:
   - Stores pending status
   - Redirects to /waiting-approval

7. User sees waiting page
   → Polls every 5 seconds

8. Admin approves request
   POST /api/member-requests/[id]/process
   → Status changes to "approved"
   → User added to organization
   → User role remains "Member"

9. User auto-redirected to /member
   → Can access member features
```

---

## Error Scenarios Handled

### Invalid Invite Code
```
User enters: "INVALID123"
  ↓
GET /api/organizations/INVALID123
  ↓
404 Not Found
  ↓
Shows error page:
"Invalid Invite Code - Organization not found"
```

### Duplicate Organization Handle
```
User tries to create: "tech-startup"
  ↓
POST /api/organizations/create
  ↓
400 Bad Request
  ↓
Shows error:
"Organization handle already taken"
```

### Already Member
```
User tries to join organization they're already in
  ↓
POST /api/member-requests/create
  ↓
400 Bad Request
  ↓
Shows error:
"You are already a member of this organization"
```

### Duplicate Request
```
User already has pending request
  ↓
POST /api/member-requests/create
  ↓
400 Bad Request
  ↓
Shows error:
"You already have a pending request for this organization"
```

---

## Database Changes

### Organization Created:
```javascript
{
  _id: ObjectId("..."),
  name: "Tech Startup Inc",
  handle: "tech-startup",
  adminId: ObjectId("user-id"),
  inviteCode: "ABC12XYZ",
  members: [
    {
      userId: ObjectId("user-id"),
      role: "Admin",
      joinedAt: Date.now()
    }
  ],
  createdAt: Date.now(),
  updatedAt: Date.now()
}
```

### User Updated:
```javascript
{
  _id: ObjectId("user-id"),
  name: "John Doe",
  email: "john@example.com",
  role: "Admin",  // Changed from "Member"
  organizationId: ObjectId("org-id"),  // Added
  ...
}
```

### Member Request Created:
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("user-id"),
  organizationId: ObjectId("org-id"),
  inviteCode: "ABC12XYZ",
  status: "pending",
  requestedAt: Date.now(),
  processedAt: null,
  processedBy: null
}
```

---

## Testing

### Test Create Organization (Requires MongoDB)

1. Sign up with email/password
2. Go to /welcome
3. Click "Create Organization"
4. Enter name: "Test Org"
5. Click "Create Organization"
6. Should redirect to /admin
7. Check MongoDB → Organization created
8. Check user role → Changed to "Admin"

### Test Join Organization (Requires MongoDB)

1. Get invite code from existing organization
2. Sign up with email/password
3. Go to /welcome
4. Enter invite code
5. Click "Continue"
6. Should show organization details
7. Click "Request to Join"
8. Should redirect to /waiting-approval
9. Check MongoDB → Request created with status "pending"

---

## Summary

✅ **Join Organization Page:**
- Real API integration
- Validates invite codes
- Creates database records
- Error handling
- Loading states

✅ **Create Organization Page:**
- Real API integration
- Creates organizations in MongoDB
- Updates user role to Admin
- Issues new JWT token
- Auto-generates handles
- Error handling
- Loading states

✅ **Both Pages:**
- Professional error messages
- Loading indicators
- Disabled states during operations
- Integration with auth context
- Consistent with backend API

The organization creation and joining flow is now fully integrated with the backend and ready for production use! 🎉
