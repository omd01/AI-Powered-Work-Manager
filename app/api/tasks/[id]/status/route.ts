import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Task from "@/lib/models/Task"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's organizationId from database (not JWT)
    const currentUser = await User.findById(auth.user.userId).select("currentOrganizationId organizationId")
    const orgId = currentUser?.currentOrganizationId || currentUser?.organizationId

    if (!orgId) {
      return NextResponse.json({ success: false, error: "User not in an organization" }, { status: 400 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    

    // Validate status
    const validStatuses = ["Todo", "Planning", "In Progress", "Done", "Blocked"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    // Find the task
    const task = await Task.findById(id)
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Check if user has permission to update this task
    // User can update if they are assigned to it or if they are in the same organization
    if (
      task.assignedToId.toString() !== auth.user.userId &&
      task.organizationId.toString() !== orgId.toString()
    ) {
      return NextResponse.json({ success: false, error: "Unauthorized to update this task" }, { status: 403 })
    }

    // Update task status
    task.status = status
    await task.save()

    return NextResponse.json(
      {
        success: true,
        task: {
          id: task._id.toString(),
          status: task.status,
          completedAt: task.completedAt,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error updating task status:", error)
    return NextResponse.json({ success: false, error: "Failed to update task status" }, { status: 500 })
  }
}
