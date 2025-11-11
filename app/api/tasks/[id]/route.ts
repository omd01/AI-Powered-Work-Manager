import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Task from "@/lib/models/Task"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Find the task
    const task = await Task.findById(id)
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Get current user's organizationId from database (not JWT)
    const user = await User.findById(auth.user.userId).select("organizationId role")
    if (!user || !user.organizationId) {
      return NextResponse.json({ success: false, error: "User not in an organization" }, { status: 400 })
    }

    // Verify task belongs to same organization
    if (task.organizationId.toString() !== user.organizationId.toString()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to delete this task" },
        { status: 403 },
      )
    }

    // Check if user has permission to delete this task
    // Admins and Leads can delete any task
    // Members can only delete personal tasks (tasks without a project)
    if (user.role === "Member") {
      // Members can only delete their own personal tasks
      if (task.projectId) {
        return NextResponse.json(
          { success: false, error: "Members can only delete personal tasks (not project tasks)" },
          { status: 403 },
        )
      }
      if (task.assignedToId.toString() !== auth.user.userId) {
        return NextResponse.json(
          { success: false, error: "You can only delete your own tasks" },
          { status: 403 },
        )
      }
    }

    // Delete the task
    await Task.findByIdAndDelete(id)

    return NextResponse.json(
      {
        success: true,
        message: "Task deleted successfully",
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ success: false, error: "Failed to delete task" }, { status: 500 })
  }
}
