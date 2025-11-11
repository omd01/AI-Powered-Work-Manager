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

    // Get current user's organizationId from database (not JWT)
    const currentUser = await User.findById(auth.user.userId).select("organizationId")
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ success: false, error: "User not in an organization" }, { status: 400 })
    }

    // Fetch all users in the same organization
    const users = await User.find({
      organizationId: currentUser.organizationId,
    })
      .select("name email role skills")
      .lean()

    // For each user, fetch their projects
    const usersWithProjects = await Promise.all(
      users.map(async (user: any) => {
        // Find projects where user is a member or lead
        const projects = await Project.find({
          organizationId: currentUser.organizationId,
          $or: [{ leadId: user._id }, { memberIds: user._id }],
        })
          .select("name")
          .lean()

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
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
