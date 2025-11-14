#!/usr/bin/env node

/**
 * Fix All Admin Roles - Production Ready
 * This script automatically fixes all organizations and ensures all admins have correct roles
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const organizationSchema = new mongoose.Schema({}, { strict: false, collection: 'organizations' });

async function fixAllAdminRoles() {
  console.log('🔧 Fixing All Admin Roles in All Organizations\n');
  console.log('================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', userSchema);
    const Organization = mongoose.model('Organization', organizationSchema);

    // Get all organizations
    const allOrgs = await Organization.find().lean();
    console.log(`📊 Found ${allOrgs.length} organizations\n`);

    let totalFixed = 0;
    let totalAdmins = 0;

    for (const org of allOrgs) {
      console.log(`\n🏢 Processing Organization: ${org.name} (${org._id})`);
      console.log('================================================');

      if (!org.members || org.members.length === 0) {
        console.log('   ⚠️  No members in this organization\n');
        continue;
      }

      // Get all admin members from the organization
      const adminMembers = org.members.filter(m => m.role === 'Admin');
      console.log(`   Found ${adminMembers.length} admin(s) in organization members array\n`);

      if (adminMembers.length === 0) {
        console.log('   ⚠️  No admins in this organization!\n');
        continue;
      }

      totalAdmins += adminMembers.length;

      // Process each admin
      for (const adminMember of adminMembers) {
        const user = await User.findById(adminMember.userId);

        if (!user) {
          console.log(`   ❌ User ${adminMember.userId} not found in database`);
          continue;
        }

        console.log(`\n   👤 Processing Admin: ${user.name} (${user.email})`);
        console.log(`      User ID: ${user._id}`);
        console.log(`      Current user.role: ${user.role}`);
        console.log(`      Current user.organizationId: ${user.organizationId || 'NOT SET'}`);
        console.log(`      Current user.currentOrganizationId: ${user.currentOrganizationId || 'NOT SET'}`);

        let needsUpdate = false;
        const updates = {};

        // Fix 1: Ensure user.role is "Admin"
        if (user.role !== 'Admin') {
          updates.role = 'Admin';
          needsUpdate = true;
          console.log(`      ✏️  Will update user.role to: Admin (was: ${user.role})`);
        }

        // Fix 2: Ensure organizationId is set
        if (!user.organizationId || user.organizationId.toString() !== org._id.toString()) {
          updates.organizationId = org._id;
          needsUpdate = true;
          console.log(`      ✏️  Will update organizationId to: ${org._id}`);
        }

        // Fix 3: Ensure currentOrganizationId is set
        if (!user.currentOrganizationId || user.currentOrganizationId.toString() !== org._id.toString()) {
          updates.currentOrganizationId = org._id;
          needsUpdate = true;
          console.log(`      ✏️  Will update currentOrganizationId to: ${org._id}`);
        }

        // Fix 4: Ensure organizations array exists and contains this org with Admin role
        if (!user.organizations || !Array.isArray(user.organizations)) {
          updates.organizations = [{
            organizationId: org._id,
            role: 'Admin',
            joinedAt: adminMember.joinedAt || new Date()
          }];
          needsUpdate = true;
          console.log(`      ✏️  Will create organizations array with Admin role`);
        } else {
          // Check if this org is in the array with correct role
          const orgIndex = user.organizations.findIndex(
            o => o.organizationId.toString() === org._id.toString()
          );

          if (orgIndex === -1) {
            // Org not in array - add it
            user.organizations.push({
              organizationId: org._id,
              role: 'Admin',
              joinedAt: adminMember.joinedAt || new Date()
            });
            updates.organizations = user.organizations;
            needsUpdate = true;
            console.log(`      ✏️  Will add org to organizations array with Admin role`);
          } else if (user.organizations[orgIndex].role !== 'Admin') {
            // Org exists but wrong role - fix it
            user.organizations[orgIndex].role = 'Admin';
            updates.organizations = user.organizations;
            needsUpdate = true;
            console.log(`      ✏️  Will update role in organizations array to Admin (was: ${user.organizations[orgIndex].role})`);
          }
        }

        // Apply updates
        if (needsUpdate) {
          await User.findByIdAndUpdate(user._id, updates);
          totalFixed++;
          console.log(`      ✅ UPDATED successfully!`);
        } else {
          console.log(`      ✓ Already correct - no changes needed`);
        }
      }

      console.log('\n   ================================================');
    }

    console.log('\n\n================================================');
    console.log('📊 SUMMARY');
    console.log('================================================');
    console.log(`   Organizations processed: ${allOrgs.length}`);
    console.log(`   Total admins found: ${totalAdmins}`);
    console.log(`   Admins fixed: ${totalFixed}`);
    console.log('================================================\n');

    if (totalFixed > 0) {
      console.log('⚠️  IMPORTANT: All affected admins MUST:');
      console.log('   1. LOG OUT from the application');
      console.log('   2. LOG IN again');
      console.log('   3. This refreshes their JWT token with correct Admin role\n');
      console.log('   After logging back in, they will see pending requests!\n');
    } else {
      console.log('✅ All admin roles were already correct!\n');
    }

    console.log('✅ Fix complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB\n');
  }
}

// Run the fix
fixAllAdminRoles().catch(console.error);
