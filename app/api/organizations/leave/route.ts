import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/User"
import Organization from "@/lib/models/Organization"
import { authenticateUser, unauthorizedResponse } from "@/lib/middleware/auth"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)

    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    // Get current user's organization from database (not JWT)
    const user = await User.findById(auth.user.userId).select("currentOrganizationId organizationId organizations name")
    const orgId = user?.currentOrganizationId || user?.organizationId

    if (!user || !orgId) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not part of any organization",
        },
        { status: 400 },
      )
    }

   
    // Get the organization to check if user is admin
    const organization = await Organization.findById(orgId)

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 },
      )
    }

    // Check if user is the admin/creator
    if (organization.adminId.toString() === auth.user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin cannot leave the organization. Transfer ownership first or delete the organization.",
        },
        { status: 400 },
      )
    }

    // Remove user from organization's members array
    organization.members = organization.members.filter(
      (member: any) => member.userId.toString() !== auth.user!.userId
    )
    await organization.save()

    // Remove organization from user's organizations array
    if (!user.organizations) {
      user.organizations = []
    }

    user.organizations = user.organizations.filter(
      (org: any) => org.organizationId.toString() !== orgId.toString()
    )

    // Check if user has other organizations to switch to
    if (user.organizations.length > 0) {
      const newOrg = user.organizations[0]
      user.currentOrganizationId = newOrg.organizationId
      user.organizationId = newOrg.organizationId
      user.role = newOrg.role
     
    } else {
      user.currentOrganizationId = undefined
      user.organizationId = undefined
      user.role = "Member"

    }

    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: "Successfully left the organization",
        hasOtherOrganizations: user.organizations.length > 0,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Leave organization error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}