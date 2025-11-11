import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import User from "@/lib/models/User"
import Organization from "@/lib/models/Organization"
import connectDB from "@/lib/db/mongodb"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json({ success: false, error: "Organization ID is required" }, { status: 400 })
    }

    // Find the user
    const user = await User.findById(auth.user.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if the organization exists
    const organization = await Organization.findById(organizationId)
    if (!organization) {
      return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 })
    }

    // Initialize organizations array if it doesn't exist (for users created before migration)
    if (!user.organizations) {
      user.organizations = []
    }

    // Check if user is a member of this organization (from organizations array)
    const userOrg = user.organizations.find(
      (org: any) => org.organizationId.toString() === organizationId && org.role,
    )

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: "You are not a member of this organization" },
        { status: 403 },
      )
    }

    // Check organization member status
    const orgMember = organization.members.find(
      (member: any) => member.userId.toString() === auth.user.userId && member.status === "active",
    )

    if (!orgMember) {
      return NextResponse.json(
        { success: false, error: "You are not an active member of this organization" },
        { status: 403 },
      )
    }

    // Update user's current organization and role
    user.currentOrganizationId = organizationId
    user.organizationId = organizationId // Keep for backward compatibility
    user.role = userOrg.role
    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: "Successfully switched organization",
        organization: {
          id: organization._id.toString(),
          name: organization.name,
          logo: organization.logo || organization.name.charAt(0).toUpperCase(),
          inviteCode: organization.inviteCode,
        },
        role: userOrg.role,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error switching organization:", error)
    return NextResponse.json({ success: false, error: "Failed to switch organization" }, { status: 500 })
  }
}
