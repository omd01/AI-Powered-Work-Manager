import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import Organization from "@/lib/models/Organization"

/**
 * Migration endpoint to add status field to all existing organization members
 * This should be run once after adding the status field to the Organization model
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Find all organizations
    const organizations = await Organization.find({})

    let updatedCount = 0
    let totalMembers = 0

    for (const org of organizations) {
      let orgUpdated = false

      for (const member of org.members) {
        totalMembers++
        // If status is undefined or doesn't exist, set it to "active"
        if (!member.status) {
          member.status = "active"
          orgUpdated = true
          updatedCount++
        }
      }

      if (orgUpdated) {
        await org.save()
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Migration completed successfully",
        stats: {
          organizationsProcessed: organizations.length,
          totalMembers: totalMembers,
          membersUpdated: updatedCount,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
