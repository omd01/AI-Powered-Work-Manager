"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Building2, UserPlus, ArrowRight } from "lucide-react"

export default function WelcomePage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [inviteCode, setInviteCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [checkingRequest, setCheckingRequest] = useState(true)

  // Check for pending join request
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!isAuthenticated || !user || isLoading) {
        return
      }

      try {
        const response = await fetch("/api/member-requests/status", {
          credentials: "include",
        })

        const data = await response.json()

        if (data.success && data.hasRequest && data.status === "pending") {
          // User has a pending request, redirect to waiting-approval
          router.push("/waiting-approval")
          return
        }
      } catch (error) {
        console.error("Error checking request status:", error)
      } finally {
        setCheckingRequest(false)
      }
    }

    checkPendingRequest()
  }, [isAuthenticated, user, isLoading, router])

  // Redirect if user already has an organization
  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated || !user) {
        router.push("/login")
        return
      }

      // Already has organization - redirect to appropriate page based on role
      if (user.organizationId) {
        switch (user.role) {
          case "Admin":
            router.push("/admin")
            break
          case "Lead":
            router.push("/lead")
            break
          case "Member":
            router.push("/member")
            break
          default:
            router.push("/login")
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  // Show loading state while checking auth or pending request
  if (isLoading || checkingRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or already has organization
  if (!isAuthenticated || !user || user.organizationId) {
    return null
  }

  const handleCreateOrganization = () => {
    router.push("/create-organization")
  }

  const handleJoinOrganization = () => {
    if (!inviteCode.trim()) {
      alert("Please enter an invite code")
      return
    }

    setIsValidating(true)

    // Simulate API call to validate invite code
    setTimeout(() => {
      // Mock validation - in real app, verify with backend
      const isValid = inviteCode.length >= 6

      if (isValid) {
        // Store invite code temporarily
        localStorage.setItem("inviteCode", inviteCode)
        router.push("/join-organization")
      } else {
        alert("Invalid invite code. Please check and try again.")
        setIsValidating(false)
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome, {user.name}!</h1>
          <p className="text-lg text-muted-foreground">What's your plan?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1: Create Organization */}
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Create Organization</CardTitle>
              <CardDescription className="text-base">
                I'm here to build and manage a team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Create your organization in seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Become the Admin with full control</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Invite team members with a link</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Use AI to delegate tasks to Leads</span>
                </li>
              </ul>
              <Button
                onClick={handleCreateOrganization}
                className="w-full h-12 text-base bg-primary hover:bg-primary/90"
              >
                Create a New Organization
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Join Organization */}
          <Card className="border-2 hover:border-accent/50 transition-colors group">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <UserPlus className="w-8 h-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">Join Organization</CardTitle>
              <CardDescription className="text-base">
                I was invited and have a code/link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                  <span>Join an existing team</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                  <span>Get assigned tasks by your Lead</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                  <span>Track your work and progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                  <span>Collaborate with your team</span>
                </li>
              </ul>
              <div className="space-y-3">
                <Input
                  placeholder="Enter invite code..."
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="h-12 text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inviteCode.trim()) {
                      handleJoinOrganization()
                    }
                  }}
                />
                <Button
                  onClick={handleJoinOrganization}
                  disabled={!inviteCode.trim() || isValidating}
                  className="w-full h-12 text-base bg-accent hover:bg-accent/90"
                  variant="secondary"
                >
                  {isValidating ? "Validating..." : "Join Organization"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
