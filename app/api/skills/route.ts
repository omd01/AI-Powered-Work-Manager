import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/middleware/auth"
import User from "@/lib/models/User"
import connectDB from "@/lib/db/mongodb"

// GET /api/skills - Get current user's skills
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's skills
    const user = await User.findById(auth.user.userId).select("name email skills")
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        skills: user.skills || [],
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching skills:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch skills" }, { status: 500 })
  }
}

// POST /api/skills - Add a new skill
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { skill } = body

    // Validate skill
    if (!skill || typeof skill !== "string" || skill.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Skill name is required" }, { status: 400 })
    }

    const trimmedSkill = skill.trim()

    // Find user
    const user = await User.findById(auth.user.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Initialize skills array if it doesn't exist
    if (!user.skills) {
      user.skills = []
    }

    // Check if skill already exists (case-insensitive)
    const skillExists = user.skills.some(
      (s: string) => s.toLowerCase() === trimmedSkill.toLowerCase()
    )

    if (skillExists) {
      return NextResponse.json({ success: false, error: "Skill already exists" }, { status: 400 })
    }

    // Add new skill
    user.skills.push(trimmedSkill)
    await user.save()

    

    return NextResponse.json(
      {
        success: true,
        message: "Skill added successfully",
        skills: user.skills,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error adding skill:", error)
    return NextResponse.json({ success: false, error: "Failed to add skill" }, { status: 500 })
  }
}

// PATCH /api/skills - Update skills array (replace all)
export async function PATCH(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { skills } = body

    // Validate skills array
    if (!Array.isArray(skills)) {
      return NextResponse.json({ success: false, error: "Skills must be an array" }, { status: 400 })
    }

    // Validate each skill
    const validSkills = skills
      .map((skill: any) => (typeof skill === "string" ? skill.trim() : ""))
      .filter((skill: string) => skill.length > 0)

    // Find user
    const user = await User.findById(auth.user.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Update skills
    user.skills = validSkills
    await user.save()

    

    return NextResponse.json(
      {
        success: true,
        message: "Skills updated successfully",
        skills: user.skills,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error updating skills:", error)
    return NextResponse.json({ success: false, error: "Failed to update skills" }, { status: 500 })
  }
}

// DELETE /api/skills - Remove a skill
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate user
    const auth = await authenticateUser(request)
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const skill = searchParams.get("skill")

    if (!skill) {
      return NextResponse.json({ success: false, error: "Skill name is required" }, { status: 400 })
    }

    // Find user
    const user = await User.findById(auth.user.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (!user.skills || user.skills.length === 0) {
      return NextResponse.json({ success: false, error: "No skills to remove" }, { status: 400 })
    }

    // Remove skill (case-insensitive)
    const originalLength = user.skills.length
    user.skills = user.skills.filter(
      (s: string) => s.toLowerCase() !== skill.toLowerCase()
    )

    if (user.skills.length === originalLength) {
      return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 })
    }

    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: "Skill removed successfully",
        skills: user.skills,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error removing skill:", error)
    return NextResponse.json({ success: false, error: "Failed to remove skill" }, { status: 500 })
  }
}
