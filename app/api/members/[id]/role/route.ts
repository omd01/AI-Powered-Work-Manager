import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import User from "@/lib/models/User"
import Project from "@/lib/models/Project"
import connectDB from "@/lib/db/mongodb"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can change roles - fetch from database
    const adminUser = await User.findById(auth.user.userId).select("currentOrganizationId organizationId role organizations")
    const orgId = adminUser?.currentOrganizationId || adminUser?.organizationId

    if (!adminUser || !orgId) {
      return NextResponse.json({ success: false, error: "User not in an organization" }, { status: 400 })
    }

    // Check if admin has Admin role in THIS organization
    const adminOrgMembership = adminUser.organizations?.find(
      (org: any) => org.organizationId.toString() === orgId.toString()
    )

    if (!adminOrgMembership || adminOrgMembership.role !== "Admin") {
      return NextResponse.json({ success: false, error: "Only Admins can change user roles" }, { status: 403 })
    }

    const { id } = await params
    const { newRole } = await request.json()

  

    // Validate new role
    if (!["Admin", "Lead", "Member"].includes(newRole)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 })
    }

    // Find the user to update
    const userToUpdate = await User.findById(id).select("name email role currentOrganizationId organizations")
    if (!userToUpdate) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Verify user is in same organization (check organizations array)
    const userOrgMembership = userToUpdate.organizations?.find(
      (org: any) => org.organizationId.toString() === orgId.toString()
    )

    if (!userOrgMembership) {
      
      return NextResponse.json({ success: false, error: "User not in your organization" }, { status: 403 })
    }

    // Store the previous role for response (role in THIS organization)
    const previousRole = userOrgMembership.role

    // Initialize organizations array if it doesn't exist (for users created before migration)
    if (!userToUpdate.organizations) {
      userToUpdate.organizations = []
    }

    // Update the user's role in their organizations array
    const orgIndex = userToUpdate.organizations.findIndex(
      (org: any) => org.organizationId.toString() === orgId.toString(),
    )

    if (orgIndex !== -1) {
      userToUpdate.organizations[orgIndex].role = newRole
    }

    // Update the global role field (for backward compatibility and if this is current org)
    if (userToUpdate.currentOrganizationId?.toString() === orgId.toString()) {
      userToUpdate.role = newRole
    }

    // If demoting from Lead to Member, check if they're leading any projects
    if (previousRole === "Lead" && newRole === "Member") {
      const projectsLedByUser = await Project.countDocuments({ leadId: id })

      if (projectsLedByUser > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot demote to Member. User is currently leading ${projectsLedByUser} project(s). Please reassign project leads first.`,
          },
          { status: 400 },
        )
      }
    }

    // If changing from Admin to Lead/Member, ensure there's at least one other Admin
    if (previousRole === "Admin" && newRole !== "Admin") {
      // Count users who have Admin role in THIS organization
      const adminUsers = await User.find({
        "organizations.organizationId": orgId,
      }).select("organizations")

      const adminCount = adminUsers.filter((user: any) => {
        const orgMembership = user.organizations?.find(
          (org: any) => org.organizationId.toString() === orgId.toString()
        )
        return orgMembership?.role === "Admin"
      }).length

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot change role. Organization must have at least one Admin.",
          },
          { status: 400 },
        )
      }
    }

    await userToUpdate.save()

    return NextResponse.json(
      {
        success: true,
        message: `User role updated from ${previousRole} to ${newRole}`,
        user: {
          id: userToUpdate._id.toString(),
          name: userToUpdate.name,
          email: userToUpdate.email,
          role: userToUpdate.role,
          previousRole,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ success: false, error: "Failed to update user role" }, { status: 500 })
  }
}
