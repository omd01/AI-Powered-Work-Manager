"use client"

import { useState } from "react"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import AITaskAssignerModal from "@/components/ai-task-assigner-modal"
import { useOrganization } from "@/lib/organization-context"

export default function FloatingAITaskAssigner() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { currentOrganization, getOrganizationMembers } = useOrganization()

  // Get current user role (using first member for demo purposes)
  // In a real app, you would get the actual logged-in user
  const members = getOrganizationMembers(currentOrganization.id)
  const currentUserRole = members[0]?.role // For demo, using first member

  // Only show for Admin and Lead roles
  const canAccessAITaskAssigner = currentUserRole === "Admin" || currentUserRole === "Lead"

  if (!canAccessAITaskAssigner) return null

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 h-14 px-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105"
      >
        <Zap className="w-5 h-5" />
        <span className="font-medium">AI Task Assigner</span>
      </Button>

      <AITaskAssignerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
