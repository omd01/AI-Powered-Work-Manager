import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Organization from "@/lib/models/Organization"
import MemberRequest from "@/lib/models/MemberRequest"
import connectDB from "@/lib/db/mongodb"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { inviteCode } = body

    if (!inviteCode) {
      return NextResponse.json({ success: false, error: "Invite code is required" }, { status: 400 })
    }

    // Find organization by invite code
    const organization = await Organization.findOne({
      inviteCode: inviteCode.toUpperCase(),
    })

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found with this invite code" },
        { status: 404 },
      )
    }

    console.log(`[JOIN] User ${auth.user.userId} attempting to join organization ${organization.name} (${organization._id})`)

    // Check if user is already a member (active or pending)
    const existingMember = organization.members.find(
      (member: any) => member.userId.toString() === auth.user.userId,
    )

    if (existingMember) {
      // If status is undefined, treat it as "active" (legacy data)
      const memberStatus = existingMember.status || "active"
      console.log(`[JOIN] User is already a member with status: ${memberStatus}`)

      const statusMsg = memberStatus === "active"
        ? "You are already a member of this organization"
        : "Your membership request is pending approval"
      return NextResponse.json(
        {
          success: false,
          error: statusMsg,
          details: {
            organizationName: organization.name,
            memberStatus: memberStatus,
            memberRole: existingMember.role
          }
        },
        { status: 400 },
      )
    }

    // Check if user already has a pending request
    const existingRequest = await MemberRequest.findOne({
      userId: auth.user.userId,
      organizationId: organization._id,
      status: "pending",
    })

    if (existingRequest) {
      console.log(`[JOIN] User already has a pending request from ${existingRequest.requestedAt}`)
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending join request for this organization. Please wait for admin approval.",
          details: {
            organizationName: organization.name,
            requestedAt: existingRequest.requestedAt
          }
        },
        { status: 400 },
      )
    }

    // Create a member request (not directly adding to organization)
    const memberRequest = new MemberRequest({
      userId: auth.user.userId,
      organizationId: organization._id,
      inviteCode: inviteCode.toUpperCase(),
      status: "pending",
      requestedAt: new Date(),
    })

    await memberRequest.save()
    console.log(`[JOIN] Created member request ${memberRequest._id} for user ${auth.user.userId} to join ${organization.name}`)

    return NextResponse.json(
      {
        success: true,
        message: "Join request sent successfully. Waiting for admin approval.",
        organization: {
          id: organization._id.toString(),
          name: organization.name,
          logo: organization.logo || organization.name.charAt(0).toUpperCase(),
          inviteCode: organization.inviteCode,
        },
        status: "pending",
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error joining organization:", error)
    return NextResponse.json({ success: false, error: "Failed to join organization" }, { status: 500 })
  }
}
