# Multi-Organization Architecture Migration Guide

## Overview

The user model has been updated to support multiple organizations simultaneously. This prevents users from losing their organization context when removed from one organization while being a member of others.

## Key Changes

### User Model Updates

**New Fields:**
- `organizations[]` - Array of organizations the user belongs to, each with:
  - `organizationId` - Reference to the organization
  - `role` - User's role in that specific organization (Admin/Lead/Member)
  - `joinedAt` - When the user joined this organization
- `currentOrganizationId` - The active organization the user is currently working in

**Deprecated Field:**
- `organizationId` - Still maintained for backward compatibility but will use `currentOrganizationId` going forward

### Architecture Benefits

1. **No More Null Organization IDs**: Users will never have `organizationId: null` if they belong to any organization
2. **Seamless Organization Removal**: When removed from one organization, users automatically switch to another organization they belong to
3. **Role Per Organization**: Users can have different roles in different organizations (Admin in one, Member in another)
4. **Better Multi-Tenancy**: Proper support for users working across multiple organizations

## Migration Steps

### 1. Run the Migration Script

The migration script will convert all existing users from single `organizationId` to the new `organizations[]` array format.

**Endpoint:** `POST /api/users/migrate-organizations`

**How to run:**
```bash
curl -X POST http://localhost:3000/api/users/migrate-organizations
```

Or use your API client (Postman, Insomnia, etc.)

**Expected Response:**
```json
{
  "success": true,
  "message": "Migration completed",
  "stats": {
    "totalUsersProcessed": 10,
    "usersUpdated": 10,
    "errors": 0
  }
}
```

### 2. Verify Migration

Check a few user documents in MongoDB to ensure they have:
- `organizations` array populated
- `currentOrganizationId` set
- `organizationId` still present (for backward compatibility)

Example of migrated user:
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Admin",
  "organizationId": "org1_id",
  "currentOrganizationId": "org1_id",
  "organizations": [
    {
      "organizationId": "org1_id",
      "role": "Admin",
      "joinedAt": "2025-01-10T..."
    },
    {
      "organizationId": "org2_id",
      "role": "Member",
      "joinedAt": "2025-01-11T..."
    }
  ]
}
```

## Updated API Endpoints

### 1. Member Removal (`DELETE /api/members/[id]/remove`)

**New Behavior:**
- Removes organization from user's `organizations[]` array
- If user has other organizations, automatically switches to the first one
- Updates `currentOrganizationId` and `organizationId` accordingly
- Returns `switchedTo` object if user was switched to another organization

**Response Example:**
```json
{
  "success": true,
  "message": "John Doe has been removed from the organization",
  "switchedTo": {
    "id": "org2_id",
    "name": "Organization 2",
    "role": "Member"
  }
}
```

### 2. Organization Switch (`POST /api/organizations/switch`)

**New Behavior:**
- Verifies user is in `organizations[]` array for the target organization
- Updates `currentOrganizationId` to the new organization
- Updates `role` based on user's role in that specific organization
- Maintains `organizationId` for backward compatibility

### 3. Member Request Approval (`POST /api/member-requests/[requestId]/process`)

**New Behavior:**
- Adds organization to user's `organizations[]` array
- Sets as `currentOrganizationId`
- Prevents duplicate entries in organizations array

### 4. Organization Creation (`POST /api/organizations/create`)

**New Behavior:**
- Adds new organization to creator's `organizations[]` array
- Sets as `currentOrganizationId`
- Assigns "Admin" role in that organization

### 5. Role Change (`PATCH /api/members/[id]/role`)

**New Behavior:**
- Updates role in specific organization within `organizations[]` array
- Updates global `role` field if the organization is user's current organization
- Role changes are now organization-specific

## Backward Compatibility

The migration maintains backward compatibility by:

1. **Keeping `organizationId` field**: Always synced with `currentOrganizationId`
2. **Keeping `role` field**: Always synced with role in current organization
3. **Gradual migration**: Old code using `organizationId` will still work

## Testing Checklist

- [ ] Run migration script successfully
- [ ] Verify all users have `organizations[]` array populated
- [ ] Test removing a user from one organization (should switch to another)
- [ ] Test removing a user from their only organization (should clear references)
- [ ] Test switching between organizations
- [ ] Test joining a second organization
- [ ] Test role changes in different organizations
- [ ] Verify organization switcher dropdown shows correct organizations
- [ ] Test that removed users can still access their other organizations

## Rollback Plan

If issues occur, you can temporarily rollback by:

1. Ensuring all endpoints still read from `organizationId` (currently they do)
2. The `organizations[]` array is additive and doesn't remove any functionality
3. No data is deleted, only added

## Future Enhancements

With this architecture, we can now implement:

1. **Organization-specific permissions**: Different permissions per organization
2. **Cross-organization collaboration**: Users can work on projects across organizations
3. **Organization switching without page reload**: Instant context switching
4. **Better audit trails**: Track user activity per organization
5. **Organization-specific settings**: User preferences per organization

## Troubleshooting

### Issue: User has empty organizations array after migration

**Solution:**
- Check if user's `organizationId` was null before migration
- Verify user exists in Organization's members array
- Manually add organization to user's array if needed

### Issue: User can't switch organizations

**Solution:**
- Verify user has multiple entries in `organizations[]` array
- Check that organization status is "active" in Organization document
- Clear browser cache and reload

### Issue: Role not updating correctly

**Solution:**
- Ensure `currentOrganizationId` matches the organization being modified
- Verify role exists in both `organizations[]` array and global `role` field
- Check admin's `currentOrganizationId` to ensure they're modifying the right org

## Contact

For issues or questions about this migration, please refer to the development team.
