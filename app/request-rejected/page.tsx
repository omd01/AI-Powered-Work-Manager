"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, ArrowLeft } from "lucide-react"

export default function RequestRejectedPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth()

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authLoading) {
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

      // Check if actually rejected
      const memberStatus = localStorage.getItem("memberStatus")
      if (memberStatus !== "rejected") {
        // If not rejected, redirect to welcome page
        router.push("/welcome")
      }
    }
  }, [authLoading, isAuthenticated, user, router])

  const handleBackToWelcome = () => {
    // Clear rejection status
    localStorage.removeItem("memberStatus")
    localStorage.removeItem("pendingOrg")
    router.push("/welcome")
  }

  const handleLogout = async () => {
    localStorage.removeItem("pendingOrg")
    localStorage.removeItem("memberStatus")
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
  if (!isAuthenticated || !user || user.organizationId) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-2">
          <CardHeader className="text-center space-y-4 border-b">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            <CardTitle className="text-3xl">Request Not Approved</CardTitle>
            <CardDescription className="text-base">
              Your request to join the organization was not approved at this time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Info Message */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                The organization's admin has reviewed your request and decided not to approve it at this time. This
                could be for various reasons such as team capacity or role requirements.
              </p>
            </div>

            {/* What's Next */}
            <div className="space-y-3">
              <p className="font-medium text-foreground text-sm">What can you do?</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Contact the organization's admin directly if you have questions</p>
                <p>• Try joining a different organization</p>
                <p>• Create your own organization and invite team members</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              <Button onClick={handleBackToWelcome} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Welcome
              </Button>
              <Button onClick={handleLogout} variant="outline" className="w-full">
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
