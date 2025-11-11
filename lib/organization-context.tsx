"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

export interface Organization {
  id: string
  name: string
  handle: string
  logo?: string
  memberCount: number
  projectCount: number
  taskCount: number
  inviteCode: string
}

export interface Member {
  id: string
  name: string
  email: string
  role: "Admin" | "Lead" | "Member"
  skills: string[]
  profilePicture?: string
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  members: Member[]
  isLoading: boolean
  refreshOrganization: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrganizationData = async () => {
    if (!isAuthenticated || !user?.organizationId) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/organizations/stats", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.organization) {
          setCurrentOrganization({
            id: data.organization.id,
            name: data.organization.name,
            handle: data.organization.handle,
            logo: data.organization.name.substring(0, 2).toUpperCase(),
            memberCount: data.statistics.memberCount,
            projectCount: data.statistics.projectCount,
            taskCount: data.statistics.taskCount,
            inviteCode: data.organization.inviteCode,
          })
          setMembers(data.members || [])
        }
      }
    } catch (error) {
      console.error("Error fetching organization data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshOrganization = async () => {
    await fetchOrganizationData()
  }

  useEffect(() => {
    if (isAuthenticated && user?.organizationId) {
      // Clear current data before fetching new organization
      setCurrentOrganization(null)
      setMembers([])
      setIsLoading(true)
      fetchOrganizationData()
    } else {
      setCurrentOrganization(null)
      setMembers([])
      setIsLoading(false)
    }
  }, [isAuthenticated, user?.organizationId])

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        members,
        isLoading,
        refreshOrganization
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider")
  }
  return context
}