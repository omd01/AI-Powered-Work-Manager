import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Task from "@/lib/models/Task"
import Project from "@/lib/models/Project"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, description, projectId, assignedToId, priority, dueDate, skills } = body

    // Validate required fields (projectId is optional for personal tasks)
    if (!title || !assignedToId) {
      return NextResponse.json(
        { success: false, error: "Title and assignee are required" },
        { status: 400 },
      )
    }

    // Verify project exists and user has access to it (only if projectId is provided and not "myself")
    if (projectId && projectId !== "myself") {
      try {
        const project = await Project.findById(projectId)
        if (!project || project.organizationId.toString() !== currentUser.organizationId.toString()) {
          return NextResponse.json({ success: false, error: "Invalid project" }, { status: 400 })
        }
      } catch (error) {
        console.error("Error validating project:", error)
        return NextResponse.json({ success: false, error: "Invalid project ID format" }, { status: 400 })
      }
    }

    // Verify assignee exists and is in the same organization
    try {
      const assignee = await User.findById(assignedToId)
      if (!assignee) {
        return NextResponse.json({ success: false, error: "Assignee not found" }, { status: 400 })
      }
      if (assignee.organizationId?.toString() !== currentUser.organizationId.toString()) {
        return NextResponse.json({ success: false, error: "Assignee not in same organization" }, { status: 400 })
      }
    } catch (error) {
      console.error("Error validating assignee:", error)
      return NextResponse.json({ success: false, error: "Invalid assignee ID format" }, { status: 400 })
    }

    // Create new task (use database organizationId, not JWT)
    const newTask = new Task({
      title,
      description: description || "",
      projectId: projectId && projectId !== "myself" ? projectId : null, // Set to null for personal tasks
      organizationId: currentUser.organizationId,
      assignedToId,
      assignedById: auth.user.userId,
      status: "Todo",
      priority: priority || "Medium",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      skills: skills || [],
      subtasks: [],
      isAIAssigned: false,
    })

    await newTask.save()

    // Populate assignee information for response
    await newTask.populate("assignedToId", "name email")
    if (newTask.projectId) {
      await newTask.populate("projectId", "name")
    }

    return NextResponse.json(
      {
        success: true,
        task: {
          id: newTask._id.toString(),
          title: newTask.title,
          description: newTask.description,
          assignee: (newTask.assignedToId as any)?.name || "Unknown",
          assigneeEmail: (newTask.assignedToId as any)?.email || "",
          assigneeId: (newTask.assignedToId as any)._id?.toString() || "",
          priority: newTask.priority,
          status: newTask.status,
          dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString().split("T")[0] : "",
          skills: newTask.skills,
          project: newTask.projectId ? (newTask.projectId as any)?.name || "Unknown" : "Personal",
          projectId: newTask.projectId ? (newTask.projectId as any)?._id?.toString() || "" : "",
          subtasks: newTask.subtasks,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error creating task:", error)
    return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 })
  }
}