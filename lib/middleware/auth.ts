import { NextRequest, NextResponse } from "next/server"
import { verifyToken, JWTPayload } from "@/lib/utils/jwt"

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

/**
 * Middleware to verify JWT token from cookies or Authorization header
 */
export async function authenticateUser(request: NextRequest): Promise<{
  isAuthenticated: boolean
  user?: JWTPayload
  error?: string
}> {
  try {
    // Try to get token from cookie first
    let token = request.cookies.get("token")?.value

    // If not in cookie, check Authorization header
    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return {
        isAuthenticated: false,
        error: "No authentication token provided",
      }
    }

    // Verify token
    const decoded = verifyToken(token)

    if (!decoded) {
      return {
        isAuthenticated: false,
        error: "Invalid or expired token",
      }
    }

    return {
      isAuthenticated: true,
      user: decoded,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return {
      isAuthenticated: false,
      error: "Authentication failed",
    }
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(allowedRoles: ("Admin" | "Lead" | "Member")[]): (user?: JWTPayload) => boolean {
  return (user?: JWTPayload) => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message: string = "Forbidden"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 403 })
}
