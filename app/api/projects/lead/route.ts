import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Project from "@/lib/models/Project"
import Task from "@/lib/models/Task"
import connectDB from "@/lib/db/mongodb"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fetch projects where the current user is the lead
    const projects = await Project.find({
      organizationId: auth.user.organizationId,
      leadId: auth.user.userId,
    })
      .populate("leadId", "name email")
      .populate("memberIds", "name")
      .sort({ createdAt: -1 })
      .lean()

    // For each project, get task count
    const projectsWithDetails = await Promise.all(
      projects.map(async (project: any) => {
        const taskCount = await Task.countDocuments({ projectId: project._id })

        return {
          id: project._id.toString(),
          name: project.name,
          description: project.description || "",
          lead: project.leadId?.name || "Unknown",
          leadEmail: project.leadId?.email || "",
          leadId: project.leadId?._id?.toString() || "",
          members: project.memberIds?.length || 0,
          status: project.status,
          priority: project.priority,
          progress: project.progress || 0,
          tasks: taskCount,
          dueDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
          startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
        }
      }),
    )

    return NextResponse.json(
      {
        success: true,
        projects: projectsWithDetails,
        count: projectsWithDetails.length,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching lead projects:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch lead projects" }, { status: 500 })
  }
}
