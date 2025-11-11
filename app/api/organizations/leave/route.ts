import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/User"
import Organization from "@/lib/models/Organization"
import { authenticateUser, unauthorizedResponse } from "@/lib/middleware/auth"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request)

    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    // Check if user has an organization
    if (!auth.user.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not part of any organization",
        },
        { status: 400 },
      )
    }

    await connectDB()

    // Get the organization to check if user is admin
    const organization = await Organization.findById(auth.user.organizationId)

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 },
      )
    }

    // Check if user is the admin
    if (organization.adminId.toString() === auth.user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin cannot leave the organization. Transfer ownership first or delete the organization.",
        },
        { status: 400 },
      )
    }

    // Remove user from organization
    const user = await User.findByIdAndUpdate(
      auth.user.userId,
      {
        $unset: { organizationId: 1 },
        $set: { role: "Member" } // Reset role to default
      },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update user",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Successfully left the organization",
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Leave organization error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}