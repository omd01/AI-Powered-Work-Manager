"use client"

import { useState } from "react"
import { ChevronDown, Building2 } from "lucide-react"
import { useOrganization } from "@/lib/organization-context"
import { Button } from "@/components/ui/button"
import CreateOrganizationModal from "./create-organization-modal"

export default function OrganizationSwitcher() {
  const { currentOrganization, organizations, setCurrentOrganization } = useOrganization()
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCreateOrganization = (orgName: string, inviteLink: string) => {
    console.log("[v0] Creating organization:", { orgName, inviteLink })
    // In a real app, this would send data to the backend
    // For now, just close the modal
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto text-sidebar-foreground hover:bg-sidebar-accent/20"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
              {currentOrganization.logo}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{currentOrganization.name}</p>
              <p className="text-xs text-sidebar-foreground/60">{currentOrganization.memberCount} members</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-sidebar border border-sidebar-border rounded-lg shadow-lg z-50">
            <div className="p-2 space-y-1">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setCurrentOrganization(org)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    currentOrganization.id === org.id
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold">
                      {org.logo}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{org.name}</p>
                      <p className="text-xs text-sidebar-foreground/50">{org.projectCount} projects</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-sidebar-border p-2">
              <button
                onClick={() => {
                  setIsModalOpen(true)
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/20 text-sm flex items-center gap-2 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Create Organization
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateOrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateOrganization={handleCreateOrganization}
      />
    </>
  )
}
