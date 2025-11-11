import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import MemberRequest from "@/lib/models/MemberRequest"
import Organization from "@/lib/models/Organization"
import { authenticateUser, unauthorizedResponse } from "@/lib/middleware/auth"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request)

    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    await connectDB()

    const body = await request.json()
    const { inviteCode } = body

    // Validation
    if (!inviteCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Invite code is required",
        },
        { status: 400 },
      )
    }

    // Find organization by invite code
    const organization = await Organization.findOne({
      inviteCode: inviteCode.toUpperCase(),
    })

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid invite code",
        },
        { status: 404 },
      )
    }

    // Check if user is already a member
    const isMember = organization.members.some((member) => member.userId.toString() === auth.user!.userId)

    if (isMember) {
      return NextResponse.json(
        {
          success: false,
          error: "You are already a member of this organization",
        },
        { status: 400 },
      )
    }

    // Check if there's already a pending request
    const existingRequest = await MemberRequest.findOne({
      userId: auth.user.userId,
      organizationId: organization._id,
      status: "pending",
    })

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending request for this organization",
        },
        { status: 400 },
      )
    }

    // Create member request
    const memberRequest = await MemberRequest.create({
      userId: auth.user.userId,
      organizationId: organization._id,
      inviteCode: inviteCode.toUpperCase(),
      status: "pending",
      requestedAt: new Date(),
    })

    return NextResponse.json(
      {
        success: true,
        message: "Join request submitted successfully",
        request: {
          id: memberRequest._id,
          status: memberRequest.status,
          organizationId: organization._id,
          organizationName: organization.name,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Create member request error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
