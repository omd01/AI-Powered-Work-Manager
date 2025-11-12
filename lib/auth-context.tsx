"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  role: "Admin" | "Lead" | "Member"
  organizationId?: string
  profilePicture?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
    // Removed automatic role checking to prevent UI reloads
    // Role changes will be detected on page refresh or navigation
  }, [])

  const checkAuth = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }

      // Always fetch fresh data from API if we have a token
      const storedToken = localStorage.getItem("token")

      if (storedToken) {
        // Fetch fresh user data from API
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            const userData = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              organizationId: data.user.organizationId,
              profilePicture: data.user.profilePicture,
            }
            setUser(userData)
            localStorage.setItem("user", JSON.stringify(userData))
          } else {
            setUser(null)
            localStorage.removeItem("user")
            localStorage.removeItem("token")
          }
        } else {
          setUser(null)
          // Clear localStorage if API check fails
          localStorage.removeItem("user")
          localStorage.removeItem("token")
        }
      } else {
        // No token - clear everything
        setUser(null)
        localStorage.removeItem("user")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      if (data.success && data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          organizationId: data.user.organizationId,
          profilePicture: data.user.profilePicture,
        }
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("token", data.token)
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      if (data.success && data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          organizationId: data.user.organizationId,
          profilePicture: data.user.profilePicture,
        }
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("token", data.token)
      }
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      localStorage.removeItem("userRole")
      localStorage.removeItem("pendingOrg")
      localStorage.removeItem("memberStatus")
      localStorage.removeItem("hasSeenWelcome")
      router.push("/login")
    }
  }

  const refreshUser = async () => {
    try {
      // Always fetch fresh user data from API
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          const userData = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            organizationId: data.user.organizationId,
            profilePicture: data.user.profilePicture,
          }
          setUser(userData)
          localStorage.setItem("user", JSON.stringify(userData))

          // Clear any pending org info if user now has an organization
          if (data.user.organizationId) {
            localStorage.removeItem("pendingOrg")
            localStorage.removeItem("memberStatus")
          }
        }
      }
    } catch (error) {
      console.error("Refresh user failed:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
