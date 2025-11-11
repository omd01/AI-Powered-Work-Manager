"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, Building2, LogOut } from "lucide-react"

export default function WaitingApprovalPage() {
  const router = useRouter()
  const { user: authUser, isLoading: authLoading, isAuthenticated, logout, refreshUser } = useAuth()
  const [orgInfo, setOrgInfo] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated || !authUser) {
        router.push("/login")
        return
      }

      // Already has organization - redirect to appropriate page
      if (authUser.organizationId) {
        switch (authUser.role) {
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
  }, [authLoading, isAuthenticated, authUser, router])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !authUser || authUser.organizationId) {
      return
    }

    // Get pending org and user info
    const pendingOrg = JSON.parse(localStorage.getItem("pendingOrg") || "{}")
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}")

    setOrgInfo(pendingOrg)
    setUser(currentUser)

    // Check actual status from API
    const checkApprovalStatus = async () => {
      try {
        const token = localStorage.getItem("token")

        // First check if user has been approved (check user data)
        const meResponse = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })

        if (meResponse.ok) {
          const meData = await meResponse.json()
          if (meData.success && meData.user) {
            // If user now has an organization, they've been approved
            if (meData.user.organizationId) {
              // Update local storage
              localStorage.setItem("user", JSON.stringify({
                id: meData.user.id,
                name: meData.user.name,
                email: meData.user.email,
                role: meData.user.role,
                organizationId: meData.user.organizationId,
                profilePicture: meData.user.profilePicture,
              }))

              // Clear pending status
              localStorage.removeItem("pendingOrg")
              localStorage.removeItem("memberStatus")

              // Refresh the auth context and wait for it to complete
              await refreshUser()

              // Small delay to ensure auth context is updated
              setTimeout(() => {
                // Force a full page reload to ensure all contexts are refreshed
                window.location.href = meData.user.role === "Admin" ? "/admin" :
                                       meData.user.role === "Lead" ? "/lead" : "/member"
              }, 500)
              return
            }
          }
        }

        // Check if request still exists (not rejected)
        const statusResponse = await fetch("/api/member-requests/status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.success) {
            if (!statusData.hasRequest) {
              // No request found - might have been rejected
              router.push("/request-rejected")
            } else if (statusData.status === "rejected") {
              router.push("/request-rejected")
            }
          }
        }
      } catch (error) {
        console.error("Error checking approval status:", error)
      }
    }

    // Check immediately
    checkApprovalStatus()

    // Then check every 3 seconds
    const checkInterval = setInterval(checkApprovalStatus, 3000)

    return () => clearInterval(checkInterval)
  }, [router, authLoading, isAuthenticated, authUser, refreshUser])

  const handleCancelRequest = async () => {
    if (!confirm("Are you sure you want to cancel your join request?")) {
      return
    }

    setIsCancelling(true)

    try {
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("You must be logged in")
      }

      const response = await fetch("/api/member-requests/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel request")
      }

      if (data.success) {
        // Clear pending org info
        localStorage.removeItem("pendingOrg")
        localStorage.removeItem("memberStatus")

        // Redirect to welcome page
        router.push("/welcome")
      }
    } catch (err: any) {
      console.error("Error cancelling request:", err)
      alert(err.message || "Failed to cancel request")
    } finally {
      setIsCancelling(false)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

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
  if (!isAuthenticated || !authUser || authUser.organizationId) {
    return null
  }

  if (!orgInfo || !user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-2">
          <CardHeader className="text-center space-y-4 border-b">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
            </div>
            <CardTitle className="text-3xl">Request Sent!</CardTitle>
            <CardDescription className="text-base">
              Your request to join <strong>{orgInfo.name}</strong> is pending approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                {user.profilePicture || user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* Status Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">Waiting for Admin Approval</p>
                  <p className="text-sm text-muted-foreground">
                    Your request to join <strong>{orgInfo.name}</strong> has been sent to{" "}
                    <strong>{orgInfo.adminName}</strong> (Admin). You will have full access as soon as your request
                    is approved.
                  </p>
                </div>
              </div>
            </div>

            {/* What You Can Do */}
            <div className="space-y-3">
              <p className="font-medium text-foreground text-sm">While you wait:</p>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Request Submitted</p>
                    <p className="text-xs text-muted-foreground">Your join request is in the queue</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg opacity-50">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Admin Review</p>
                    <p className="text-xs text-muted-foreground">Waiting for approval...</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg opacity-30">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Full Access Granted</p>
                    <p className="text-xs text-muted-foreground">You'll be redirected automatically</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground text-center">
                  <strong>Tip:</strong> This usually takes just a few minutes. You can close this page and come back
                  later - you'll receive an email when you're approved.
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleCancelRequest}
                disabled={isCancelling}
                variant="destructive"
                className="w-full"
              >
                {isCancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Request"
                )}
              </Button>
              <Button onClick={handleLogout} variant="outline" className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
