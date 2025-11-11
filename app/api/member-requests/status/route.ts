import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import MemberRequest from "@/lib/models/MemberRequest"
import { authenticateUser, unauthorizedResponse } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request)

    if (!auth.isAuthenticated || !auth.user) {
      return unauthorizedResponse(auth.error || "Unauthorized")
    }

    await connectDB()

    // Get the most recent member request for this user
    const memberRequest = await MemberRequest.findOne({
      userId: auth.user.userId,
    })
      .sort({ createdAt: -1 })
      .populate("organizationId", "name handle")

    if (!memberRequest) {
      return NextResponse.json(
        {
          success: true,
          hasRequest: false,
          status: null,
        },
        { status: 200 },
      )
    }

    const org = memberRequest.organizationId as any

    return NextResponse.json(
      {
        success: true,
        hasRequest: true,
        status: memberRequest.status,
        request: {
          id: memberRequest._id,
          status: memberRequest.status,
          organization: {
            id: org._id,
            name: org.name,
            handle: org.handle,
          },
          requestedAt: memberRequest.requestedAt,
          processedAt: memberRequest.processedAt,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Get request status error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
