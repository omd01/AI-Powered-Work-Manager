"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Building2, Sparkles, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [orgHandle, setOrgHandle] = useState("")
  const [error, setError] = useState("")

  // Redirect if user already has an organization or not authenticated
  useEffect(() => {
    if (!isLoading) {
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
  }, [isLoading, isAuthenticated, user, router])

  // Show loading state while checking auth
  if (isLoading) {
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

  // Auto-generate handle from name
  const handleNameChange = (name: string) => {
    setOrgName(name)
    // Auto-generate handle if user hasn't manually entered one
    const generatedHandle = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
    setOrgHandle(generatedHandle)
  }

  const handleCreate = async () => {
    setError("")

    // Validation
    if (!orgName.trim()) {
      setError("Please enter an organization name")
      return
    }

    if (!orgHandle.trim()) {
      setError("Please enter an organization handle")
      return
    }

    // Validate handle format
    if (!/^[a-z0-9-]+$/.test(orgHandle)) {
      setError("Handle can only contain lowercase letters, numbers, and hyphens")
      return
    }

    setIsCreating(true)

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("You must be logged in to create an organization")
      }

      // Send create organization request to API
      const response = await fetch("/api/organizations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          name: orgName,
          handle: orgHandle,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create organization")
      }

      if (data.success && data.organization) {
        // Update user data with new token (role is now Admin)
        if (data.token) {
          localStorage.setItem("token", data.token)
        }

        // Store organization info
        localStorage.setItem("currentOrg", JSON.stringify(data.organization))
        localStorage.setItem("userRole", "Admin")
        localStorage.setItem("hasSeenWelcome", "true")

        // Refresh user in auth context
        await refreshUser()

        // Small delay to ensure state updates propagate
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Redirect to admin dashboard
        router.push("/admin")
      }
    } catch (err: any) {
      console.error("Error creating organization:", err)
      setError(err.message || "Failed to create organization")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/welcome")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Create Your Organization</CardTitle>
            <CardDescription className="text-base">
              Set up your workspace in just a few seconds
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName" className="text-sm font-medium">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="orgName"
                  placeholder="e.g., Acme Corp"
                  value={orgName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-12 text-base"
                  autoFocus
                  disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground">
                  This is the name your team will see
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgHandle" className="text-sm font-medium">
                  Organization Handle <span className="text-muted-foreground">(Auto-generated)</span>
                </Label>
                <Input
                  id="orgHandle"
                  placeholder="e.g., acme-corp"
                  value={orgHandle}
                  onChange={(e) => setOrgHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="h-12 text-base font-mono"
                  disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground">
                  {orgHandle
                    ? `Your organization URL: workflow-ai.com/${orgHandle}`
                    : "A URL will be generated from your organization name"}
                </p>
              </div>
            </div>

            {/* Info Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-foreground">What happens next?</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• You'll become the Admin with full access</li>
                      <li>• You'll get your own dashboard to manage everything</li>
                      <li>• You can invite team members with a link</li>
                      <li>• You can start creating projects and assigning tasks with AI</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleCreate}
              disabled={!orgName.trim() || isCreating}
              className="w-full h-12 text-base bg-primary hover:bg-primary/90"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Creating Organization...</span>
                </div>
              ) : (
                "Create Organization"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
