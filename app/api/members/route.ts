import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import User from "@/lib/models/User"
import Project from "@/lib/models/Project"
import connectDB from "@/lib/db/mongodb"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's currentOrganizationId from database (not JWT)
    const currentUser = await User.findById(auth.user.userId).select("currentOrganizationId organizationId")

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const orgId = currentUser.currentOrganizationId || currentUser.organizationId

    if (!orgId) {
      return NextResponse.json({ success: false, error: "User not in an organization" }, { status: 400 })
    }

    

    // Fetch all users who have this organization in their organizations array
    const users = await User.find({
      "organizations.organizationId": orgId,
    })
      .select("name email role skills organizations")
      .lean()


    // Filter and map users to get their role in THIS specific organization
    const membersInOrg = users
      .map((user: any) => {
        // Find the user's membership in THIS organization
        const orgMembership = user.organizations?.find(
          (org: any) => org.organizationId.toString() === orgId.toString(),
        )

        if (!orgMembership) return null

        return {
          ...user,
          role: orgMembership.role, // Use role from this specific organization
        }
      })
      .filter((user) => user !== null) as any[]

    

    // For each user, fetch their projects in THIS organization
    const usersWithProjects = await Promise.all(
      membersInOrg.map(async (user: any) => {
        // Find projects where user is a member or lead in THIS organization
        const projects = await Project.find({
          organizationId: orgId,
          $or: [{ leadId: user._id }, { memberIds: user._id }],
        })
          .select("name")
          .lean()

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role, // This is already the role in THIS organization
          skills: user.skills || [],
          projects: projects.map((p: any) => p.name),
        }
      }),
    )

    return NextResponse.json(
      {
        success: true,
        members: usersWithProjects,
        count: usersWithProjects.length,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch members" }, { status: 500 })
  }
}
