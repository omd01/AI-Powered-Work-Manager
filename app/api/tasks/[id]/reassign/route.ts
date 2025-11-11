import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Task from "@/lib/models/Task"
import Project from "@/lib/models/Project"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

// PATCH /api/tasks/[id]/reassign - Reassign task to another project member
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id: taskId } = await params
    const { newAssigneeId } = await request.json()

    if (!newAssigneeId) {
      return NextResponse.json({ success: false, error: "New assignee ID is required" }, { status: 400 })
    }

    // Find the task
    const task = await Task.findById(taskId)
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Find the project
    const project = await Project.findById(task.projectId)
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Check if user is the lead of this project or Admin
    const currentUser = await User.findById(auth.user.userId)
    const isProjectLead = project.leadId?.toString() === auth.user.userId
    const isAdmin = currentUser?.role === "Admin"

    if (!isProjectLead && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only project leads or admins can reassign tasks" },
        { status: 403 },
      )
    }

    // Check if new assignee exists
    const newAssignee = await User.findById(newAssigneeId)
    if (!newAssignee) {
      return NextResponse.json({ success: false, error: "New assignee not found" }, { status: 404 })
    }

    // Check if new assignee is in the same organization
    if (newAssignee.organizationId?.toString() !== auth.user.organizationId) {
      return NextResponse.json({ success: false, error: "New assignee not in your organization" }, { status: 403 })
    }

    // Check if new assignee is a member of the project or is the lead
    const isProjectMember =
      project.memberIds.some((id) => id.toString() === newAssigneeId) ||
      project.leadId?.toString() === newAssigneeId

    if (!isProjectMember) {
      return NextResponse.json(
        { success: false, error: "New assignee is not a member of this project" },
        { status: 400 },
      )
    }

    // Get old assignee name for response
    const oldAssignee = task.assignedToId ? await User.findById(task.assignedToId) : null

    // Update task assignee (the field is assignedToId, not assignedTo)
    task.assignedToId = newAssigneeId
    await task.save()

    return NextResponse.json(
      {
        success: true,
        message: `Task reassigned from ${oldAssignee?.name || "Unassigned"} to ${newAssignee.name}`,
        task: {
          id: task._id.toString(),
          title: task.title,
          assignee: {
            id: newAssignee._id.toString(),
            name: newAssignee.name,
            email: newAssignee.email,
          },
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error reassigning task:", error)
    return NextResponse.json({ success: false, error: "Failed to reassign task" }, { status: 500 })
  }
}
