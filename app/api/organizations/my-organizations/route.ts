import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import Organization from "@/lib/models/Organization"
import connectDB from "@/lib/db/mongodb"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all organizations where the user is a member
    const organizations = await Organization.find({
      "members.userId": auth.user.userId,
    })
      .select("name logo inviteCode members")
      .sort({ name: 1 })
      .lean()

    // Filter organizations where user status is "active" (not pending)
    // If status is undefined, treat it as "active" (legacy data)
    const activeOrganizations = organizations.filter((org: any) => {
      const userMember = org.members.find((m: any) => m.userId.toString() === auth.user!.userId)
      const memberStatus = userMember?.status || "active"
      return userMember && memberStatus === "active"
    })

    // Format organizations for frontend
    const formattedOrganizations = activeOrganizations.map((org: any) => ({
      id: org._id.toString(),
      name: org.name,
      logo: org.logo || org.name.charAt(0).toUpperCase(),
      inviteCode: org.inviteCode,
    }))

    return NextResponse.json(
      {
        success: true,
        organizations: formattedOrganizations,
        count: formattedOrganizations.length,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching user organizations:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch organizations" }, { status: 500 })
  }
}
