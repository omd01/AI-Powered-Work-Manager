import { NextRequest, NextResponse } from "next/server"
import { authenticateUser, forbiddenResponse } from "@/lib/middleware/auth"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"
import Task from "@/lib/models/Task"
import Project from "@/lib/models/Project"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Only Admin can remove members
    if (auth.user.role !== "Admin") {
      return forbiddenResponse("Only admins can remove members")
    }

    const { id: memberId } = await params

    // Get current user's organizationId from database
    const currentUser = await User.findById(auth.user.userId).select("organizationId")
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ success: false, error: "User not in an organization" }, { status: 400 })
    }

    // Get the member to remove
    const memberToRemove = await User.findById(memberId)
    if (!memberToRemove) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 })
    }

    // Check if member is in the same organization
    if (memberToRemove.organizationId?.toString() !== currentUser.organizationId.toString()) {
      return forbiddenResponse("Member is not in your organization")
    }

    // Prevent removing the admin (creator) of the organization
    const organization = await Organization.findById(currentUser.organizationId)
    if (!organization) {
      return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 })
    }

    if (organization.adminId.toString() === memberId) {
      return NextResponse.json(
        { success: false, error: "Cannot remove the organization creator/admin" },
        { status: 400 },
      )
    }

    // Prevent removing yourself
    if (memberId === auth.user.userId) {
      return NextResponse.json({ success: false, error: "You cannot remove yourself" }, { status: 400 })
    }

    // Check if member has any assigned tasks
    const assignedTasks = await Task.countDocuments({
      assignedToId: memberId,
      organizationId: currentUser.organizationId,
    })

    if (assignedTasks > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot remove member. They have ${assignedTasks} assigned task(s). Please reassign their tasks first.`,
          details: {
            assignedTasks,
          },
        },
        { status: 400 },
      )
    }

    // Check if member is leading any projects
    const leadingProjects = await Project.countDocuments({
      leadId: memberId,
      organizationId: currentUser.organizationId,
    })

    if (leadingProjects > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot remove member. They are leading ${leadingProjects} project(s). Please reassign the project lead first.`,
          details: {
            leadingProjects,
          },
        },
        { status: 400 },
      )
    }

    // Check if member is part of any project teams (but not leading)
    const projectMemberships = await Project.countDocuments({
      organizationId: currentUser.organizationId,
      memberIds: memberId,
    })

    if (projectMemberships > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot remove member. They are a team member in ${projectMemberships} project(s). Please remove them from project teams first.`,
          details: {
            projectMemberships,
          },
        },
        { status: 400 },
      )
    }

    // All checks passed, remove member from organization
    organization.members = organization.members.filter(
      (member: any) => member.userId.toString() !== memberId,
    )
    await organization.save()
    console.log(`[REMOVE_MEMBER] Removed user ${memberId} from organization ${organization.name}`)

    // Update user's organizations array - remove this organization
    const userToUpdate = await User.findById(memberId)
    if (!userToUpdate) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Initialize organizations array if it doesn't exist (for users created before migration)
    if (!userToUpdate.organizations) {
      userToUpdate.organizations = []
    }

    // Remove the organization from user's organizations array
    userToUpdate.organizations = userToUpdate.organizations.filter(
      (org: any) => org.organizationId.toString() !== currentUser.organizationId.toString(),
    )

    let switchedToOrganization = null

    // Check if user has other organizations
    if (userToUpdate.organizations.length > 0) {
      // User has other organizations, switch to the first one
      const newOrg = userToUpdate.organizations[0]
      userToUpdate.currentOrganizationId = newOrg.organizationId
      userToUpdate.organizationId = newOrg.organizationId // Keep for backward compatibility
      userToUpdate.role = newOrg.role

      // Get organization details for response
      const newOrgDetails = await Organization.findById(newOrg.organizationId).select("name")
      if (newOrgDetails) {
        switchedToOrganization = {
          id: newOrg.organizationId.toString(),
          name: newOrgDetails.name,
          role: newOrg.role,
        }
        console.log(
          `[REMOVE_MEMBER] Switched user to organization: ${newOrgDetails.name} with role: ${newOrg.role}`,
        )
      }
    } else {
      // No other organizations, clear organization references
      userToUpdate.currentOrganizationId = null
      userToUpdate.organizationId = null // Keep for backward compatibility
      userToUpdate.role = "Member"
      console.log(`[REMOVE_MEMBER] User has no other organizations, cleared organization references`)
    }

    await userToUpdate.save()

    return NextResponse.json(
      {
        success: true,
        message: `${memberToRemove.name} has been removed from the organization`,
        switchedTo: switchedToOrganization,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error removing member:", error)
    return NextResponse.json({ success: false, error: "Failed to remove member" }, { status: 500 })
  }
}
