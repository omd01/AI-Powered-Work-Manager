import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"

export async function GET(request: NextRequest, { params }: { params: Promise<{ inviteCode: string }> }) {
  try {
    await connectDB()

    const { inviteCode } = await params

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
    }).populate("adminId", "name email")

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found with this invite code",
        },
        { status: 404 },
      )
    }

    const admin = organization.adminId as any

    return NextResponse.json(
      {
        success: true,
        organization: {
          id: organization._id,
          name: organization.name,
          handle: organization.handle,
          memberCount: organization.members.length,
          adminName: admin?.name || "Unknown",
          adminEmail: admin?.email,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Get organization error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
