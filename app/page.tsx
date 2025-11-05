"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the admin page by default
    router.push("/admin")
  }, [router])

  return (
    <div className="flex h-screen bg-background items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Work Management</h1>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
