import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import User from "@/lib/models/User"
import Organization from "@/lib/models/Organization"

/**
 * Migration endpoint to convert single organizationId to organizations array
 * This should be run once after adding the organizations array to the User model
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Find all users with an organizationId but empty organizations array
    const users = await User.find({
      organizationId: { $ne: null },
      $or: [{ organizations: { $exists: false } }, { organizations: { $size: 0 } }],
    })

    let updatedCount = 0
    let errorCount = 0
    const errors: any[] = []

    for (const user of users) {
      try {
        // Get the user's role in the organization from the Organization document
        const organization = await Organization.findById(user.organizationId)
        if (!organization) {
          errors.push({
            userId: user._id.toString(),
            email: user.email,
            error: "Organization not found",
          })
          errorCount++
          continue
        }

        const memberInfo = organization.members.find(
          (m: any) => m.userId.toString() === user._id.toString() && m.status === "active",
        )

        if (!memberInfo) {
          errors.push({
            userId: user._id.toString(),
            email: user.email,
            organizationId: user.organizationId.toString(),
            error: "User not found as active member in organization",
          })
          errorCount++
          continue
        }

        // Update user with organizations array
        user.organizations = [
          {
            organizationId: user.organizationId,
            role: memberInfo.role,
            joinedAt: memberInfo.joinedAt || new Date(),
          },
        ]
        user.currentOrganizationId = user.organizationId
        // Keep organizationId for backward compatibility
        await user.save()
        updatedCount++
      } catch (error: any) {
        errors.push({
          userId: user._id.toString(),
          email: user.email,
          error: error.message,
        })
        errorCount++
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Migration completed",
        stats: {
          totalUsersProcessed: users.length,
          usersUpdated: updatedCount,
          errors: errorCount,
        },
        errors: errors.length > 0 ? errors : undefined,
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
