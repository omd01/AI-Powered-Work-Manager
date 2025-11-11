"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserPlus, Building2, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface OrgInfo {
  id: string
  name: string
  handle: string
  memberCount: number
  adminName: string
  adminEmail?: string
}

export default function JoinOrganizationPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [isJoining, setIsJoining] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null)
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [checkingRequest, setCheckingRequest] = useState(true)

  // Check for pending join request
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!isAuthenticated || !user || authLoading) {
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
  }, [isAuthenticated, user, authLoading, router])

  // Check auth and redirect if already has organization
  useEffect(() => {
    if (!authLoading && !checkingRequest) {
      // Not authenticated - redirect to login
      if (!isAuthenticated || !user) {
        router.push("/login")
        return
      }

      // Already has organization - redirect to appropriate page
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
            router.push("/welcome")
        }
      }
    }
  }, [authLoading, isAuthenticated, user, router, checkingRequest])

  useEffect(() => {
    const fetchOrganization = async () => {
      // Don't fetch if not authenticated or already has org
      if (authLoading || !isAuthenticated || !user || user.organizationId) {
        return
      }

      try {
        // Get invite code from localStorage
        const code = localStorage.getItem("inviteCode") || ""
        setInviteCode(code)

        if (!code) {
          setError("No invite code provided")
          setIsLoading(false)
          return
        }

        // Fetch organization info from API
        const response = await fetch(`/api/organizations/${code}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch organization")
        }

        if (data.success && data.organization) {
          setOrgInfo({
            id: data.organization.id,
            name: data.organization.name,
            handle: data.organization.handle,
            memberCount: data.organization.memberCount,
            adminName: data.organization.adminName,
            adminEmail: data.organization.adminEmail,
          })
        }
      } catch (err: any) {
        console.error("Error fetching organization:", err)
        setError(err.message || "Failed to load organization details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganization()
  }, [authLoading, isAuthenticated, user])

  // Show loading state while checking auth
  if (authLoading) {
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

  const handleJoinRequest = async () => {
    if (!inviteCode) {
      setError("No invite code provided")
      return
    }

    setIsJoining(true)
    setError("")

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("You must be logged in to join an organization")
      }

      // Send join request to API
      const response = await fetch("/api/member-requests/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ inviteCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send join request")
      }

      if (data.success) {
        // Store pending org info in localStorage
        if (orgInfo) {
          localStorage.setItem("pendingOrg", JSON.stringify(orgInfo))
        }
        localStorage.setItem("memberStatus", "pending")
        localStorage.setItem("hasSeenWelcome", "true")

        // Redirect to waiting page
        router.push("/waiting-approval")
      }
    } catch (err: any) {
      console.error("Error sending join request:", err)
      setError(err.message || "Failed to send join request")
    } finally {
      setIsJoining(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading organization details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !orgInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            <CardTitle>Invalid Invite Code</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/welcome")}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Welcome
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!orgInfo) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-2xl">
        <Button variant="ghost" onClick={() => router.push("/welcome")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-accent" />
            </div>
            <CardTitle className="text-3xl">Join Organization</CardTitle>
            <CardDescription className="text-base">
              Confirm the details below before requesting to join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Organization Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-1">{orgInfo.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {orgInfo.memberCount} team members
                    </p>
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        Admin: <span className="font-medium text-foreground">{orgInfo.adminName}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Invite Code: <span className="font-mono text-foreground">{inviteCode}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warning Card */}
            <Card className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-foreground">Does this look right?</p>
                    <p className="text-muted-foreground">
                      You are about to request to join <strong>{orgInfo.name}</strong>. Make sure this is the
                      correct organization before proceeding.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What Happens Next */}
            <div className="space-y-3 text-sm">
              <p className="font-medium text-foreground">What happens next?</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Your request will be sent to the organization's admin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>You'll wait for approval (usually takes a few minutes)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Once approved, you'll have full access as a Member</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>You'll be able to see tasks, projects, and collaborate with your team</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleJoinRequest}
              disabled={isJoining}
              className="w-full h-12 text-base bg-accent hover:bg-accent/90"
            >
              {isJoining ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Sending Request...</span>
                </div>
              ) : (
                "Request to Join"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
