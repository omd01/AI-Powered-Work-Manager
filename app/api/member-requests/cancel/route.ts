import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import MemberRequest from "@/lib/models/MemberRequest"
import { authenticateUser, unauthorizedResponse } from "@/lib/middleware/auth"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request)

    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    await connectDB()

    // Find and delete the user's pending request
    const memberRequest = await MemberRequest.findOneAndDelete({
      userId: auth.user.userId,
      status: "pending",
    })

    if (!memberRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "No pending request found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Join request cancelled successfully",
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Cancel member request error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
