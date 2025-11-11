import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Project from "@/lib/models/Project"
import Task from "@/lib/models/Task"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Fetch project with optional createdById population for backward compatibility
    const project = await Project.findById(id)
      .populate({ path: "createdById", select: "name email role", strictPopulate: false })
      .populate("leadId", "name email")
      .populate("memberIds", "name email role")
      .lean()

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Check if user has access to this project (same organization)
    if (project.organizationId.toString() !== auth.user.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized to access this project" }, { status: 403 })
    }

    // Fetch all tasks for this project
    const tasks = await Task.find({ projectId: id })
      .populate("assignedToId", "name email")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean()

    // Format project data
    const formattedProject = {
      id: project._id.toString(),
      name: project.name,
      description: project.description || "",
      createdBy: (project.createdById as any)?.name || "Unknown",
      createdByEmail: (project.createdById as any)?.email || "",
      createdById: (project.createdById as any)?._id?.toString() || "",
      createdByRole: (project.createdById as any)?.role || "Admin",
      lead: (project.leadId as any)?.name || "Unknown",
      leadEmail: (project.leadId as any)?.email || "",
      leadId: (project.leadId as any)?._id?.toString() || "",
      members: Array.isArray(project.memberIds) ? project.memberIds.map((member: any) => ({
        id: member._id?.toString() || "",
        name: member.name || "Unknown",
        email: member.email || "",
        role: member.role || "Member",
      })) : [],
      status: project.status,
      priority: project.priority,
      progress: project.progress || 0,
      dueDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
      startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
    }

    // Format tasks
    const formattedTasks = tasks.map((task: any) => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      assignee: task.assignedToId?.name || "Unassigned",
      assigneeEmail: task.assignedToId?.email || "",
      assigneeId: task.assignedToId?._id?.toString() || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      skills: task.skills || [],
      subtasks: task.subtasks || [],
    }))

    return NextResponse.json(
      {
        success: true,
        project: formattedProject,
        tasks: formattedTasks,
        taskCount: formattedTasks.length,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching project details:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch project details" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { leadId } = body

    // Only Admin can update project lead
    const user = await User.findById(auth.user.userId)
    if (!user || user.role !== "Admin") {
      return NextResponse.json(
        { success: false, error: "Only Admins can update project lead" },
        { status: 403 },
      )
    }

    // Validate leadId
    if (!leadId) {
      return NextResponse.json({ success: false, error: "Lead ID is required" }, { status: 400 })
    }

    // Fetch project
    const project = await Project.findById(id)
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Check if user has access to this project (same organization)
    if (project.organizationId.toString() !== auth.user.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized to update this project" }, { status: 403 })
    }

    // Verify new lead exists and is in the same organization
    const newLead = await User.findById(leadId)
    if (!newLead || newLead.organizationId?.toString() !== auth.user.organizationId) {
      return NextResponse.json({ success: false, error: "Invalid lead selection" }, { status: 400 })
    }

    // Store the old lead ID before updating
    const oldLeadId = project.leadId.toString()

    // Automatically reassign all tasks from old lead to new lead in this project
    let reassignedTasksCount = 0
    if (oldLeadId !== leadId) {
      const updateResult = await Task.updateMany(
        { projectId: id, assignedToId: oldLeadId },
        { $set: { assignedToId: leadId } }
      )
      reassignedTasksCount = updateResult.modifiedCount
    }

    // Update project lead
    project.leadId = leadId

    // Ensure new lead is in memberIds if not already
    if (!project.memberIds.some((memberId) => memberId.toString() === leadId)) {
      project.memberIds.push(leadId)
    }

    // Promote new lead to "Lead" role if they're currently a "Member"
    if (newLead.role === "Member") {
      newLead.role = "Lead"
      await newLead.save()
    }

    await project.save()

    // Check if the old lead should be demoted to "Member"
    // Only demote if they're not leading any other projects
    if (oldLeadId !== leadId) {
      const projectsLedByOldLead = await Project.countDocuments({ leadId: oldLeadId })

      if (projectsLedByOldLead === 0) {
        // Old lead is not leading any projects anymore, demote to Member
        const oldLead = await User.findById(oldLeadId)
        if (oldLead && oldLead.role === "Lead") {
          oldLead.role = "Member"
          await oldLead.save()
        }
      }
    }

    // Populate lead information for response
    await project.populate("leadId", "name email")

    // Build success message
    let message = "Project lead updated successfully"
    if (reassignedTasksCount > 0) {
      message += `. ${reassignedTasksCount} task(s) have been automatically reassigned to the new lead.`
    }

    return NextResponse.json(
      {
        success: true,
        message: message,
        reassignedTasksCount: reassignedTasksCount,
        project: {
          id: project._id.toString(),
          lead: (project.leadId as any)?.name || "Unknown",
          leadEmail: (project.leadId as any)?.email || "",
          leadId: (project.leadId as any)?._id?.toString() || "",
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error updating project lead:", error)
    return NextResponse.json({ success: false, error: "Failed to update project lead" }, { status: 500 })
  }
}