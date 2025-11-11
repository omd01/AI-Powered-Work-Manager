import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

// GET /api/schedule - Get current user's schedule
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user with schedule (don't use .select() to ensure we can save properly)
    const user = await User.findById(auth.user.userId)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    

    // Default schedule for users who don't have one yet (existing users before schedule field was added)
    const defaultSchedule = {
      workingHours: {
        monday: { start: "09:00", end: "17:00", enabled: true },
        tuesday: { start: "09:00", end: "17:00", enabled: true },
        wednesday: { start: "09:00", end: "17:00", enabled: true },
        thursday: { start: "09:00", end: "17:00", enabled: true },
        friday: { start: "09:00", end: "17:00", enabled: true },
        saturday: { start: "09:00", end: "17:00", enabled: false },
        sunday: { start: "09:00", end: "17:00", enabled: false },
      },
      timeBlocks: [],
    }

    // If user doesn't have a schedule yet, initialize it with default values
    if (!user.schedule || typeof user.schedule !== 'object') {
      
      user.schedule = defaultSchedule
      user.markModified("schedule")
      try {
        await user.save()
        
      } catch (saveError) {
        console.error("📅 Error saving initialized schedule:", saveError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        schedule: user.schedule,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching schedule:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch schedule" }, { status: 500 })
  }
}

// PUT /api/schedule - Update current user's schedule
export async function PUT(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { workingHours, timeBlocks } = await request.json()

 

    // Validate schedule data
    if (!workingHours) {
      return NextResponse.json({ success: false, error: "Working hours are required" }, { status: 400 })
    }

    // Find and update user
    const user = await User.findById(auth.user.userId)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }


    user.schedule = {
      workingHours,
      timeBlocks: timeBlocks || [],
    }

    // Mark schedule as modified for Mongoose to detect changes (required for Mixed type)
    user.markModified("schedule")

    await user.save()


    return NextResponse.json(
      {
        success: true,
        message: "Schedule updated successfully",
        schedule: user.schedule,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error updating schedule:", error)
    return NextResponse.json({ success: false, error: "Failed to update schedule" }, { status: 500 })
  }
}
