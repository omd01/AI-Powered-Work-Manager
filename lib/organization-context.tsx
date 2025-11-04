"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

export interface Organization {
  id: string
  name: string
  logo?: string
  memberCount: number
  projectCount: number
  taskCount: number
}

export interface Member {
  id: string
  name: string
  email: string
  role: "Admin" | "Lead" | "Member"
  projects: string[]
  skills: string[]
  avatar: string
}

export interface Team {
  id: string
  name: string
  members: Member[]
}

interface OrganizationContextType {
  currentOrganization: Organization
  organizations: Organization[]
  setCurrentOrganization: (org: Organization) => void
  getOrganizationMembers: (orgId: string) => Member[]
  updateMemberRole: (orgId: string, memberId: string, newRole: "Admin" | "Lead" | "Member") => void
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: "org-1",
    name: "Acme Corp",
    logo: "AC",
    memberCount: 24,
    projectCount: 8,
    taskCount: 42,
  },
  {
    id: "org-2",
    name: "TechStart Inc",
    logo: "TS",
    memberCount: 12,
    projectCount: 5,
    taskCount: 28,
  },
  {
    id: "org-3",
    name: "Design Studio",
    logo: "DS",
    memberCount: 8,
    projectCount: 3,
    taskCount: 15,
  },
]

const MOCK_MEMBERS: Record<string, Member[]> = {
  "org-1": [
    {
      id: "member-1",
      name: "Sarah Chen",
      email: "sarah@acme.com",
      role: "Admin",
      projects: ["Website Redesign", "Database Migration"],
      skills: ["Project Management", "UI/UX", "React"],
      avatar: "SC",
    },
    {
      id: "member-2",
      name: "Marcus Johnson",
      email: "marcus@acme.com",
      role: "Lead",
      projects: ["Mobile App MVP", "Website Redesign"],
      skills: ["Backend Development", "Node.js", "AWS"],
      avatar: "MJ",
    },
    {
      id: "member-3",
      name: "Alex Rivera",
      email: "alex@acme.com",
      role: "Lead",
      projects: ["Database Migration"],
      skills: ["DevOps", "Database", "Infrastructure"],
      avatar: "AR",
    },
    {
      id: "member-4",
      name: "Emma Wilson",
      email: "emma@acme.com",
      role: "Member",
      projects: ["Website Redesign", "Mobile App MVP"],
      skills: ["Frontend Development", "React", "CSS"],
      avatar: "EW",
    },
    {
      id: "member-5",
      name: "James Park",
      email: "james@acme.com",
      role: "Member",
      projects: ["Mobile App MVP"],
      skills: ["Mobile Development", "React Native", "iOS"],
      avatar: "JP",
    },
    {
      id: "member-6",
      name: "Lisa Anderson",
      email: "lisa@acme.com",
      role: "Member",
      projects: ["Database Migration"],
      skills: ["Database", "SQL", "Testing"],
      avatar: "LA",
    },
  ],
  "org-2": [
    {
      id: "member-7",
      name: "David Kim",
      email: "david@techstart.com",
      role: "Admin",
      projects: ["AI Platform", "API Gateway"],
      skills: ["Full Stack", "Python", "Machine Learning"],
      avatar: "DK",
    },
    {
      id: "member-8",
      name: "Rachel Green",
      email: "rachel@techstart.com",
      role: "Lead",
      projects: ["AI Platform"],
      skills: ["Data Science", "ML Ops", "Python"],
      avatar: "RG",
    },
    {
      id: "member-9",
      name: "Tom Brady",
      email: "tom@techstart.com",
      role: "Member",
      projects: ["API Gateway"],
      skills: ["Backend", "Go", "Microservices"],
      avatar: "TB",
    },
  ],
  "org-3": [
    {
      id: "member-10",
      name: "Nina Patel",
      email: "nina@designstudio.com",
      role: "Admin",
      projects: ["Brand Identity", "Web Design"],
      skills: ["UI Design", "Figma", "Brand Strategy"],
      avatar: "NP",
    },
    {
      id: "member-11",
      name: "Olivia Taylor",
      email: "olivia@designstudio.com",
      role: "Lead",
      projects: ["Web Design"],
      skills: ["Web Design", "Interaction Design", "Motion"],
      avatar: "OT",
    },
  ],
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization>(MOCK_ORGANIZATIONS[0])
  const [organizations] = useState<Organization[]>(MOCK_ORGANIZATIONS)
  const [members, setMembers] = useState<Record<string, Member[]>>(MOCK_MEMBERS)

  const getOrganizationMembers = (orgId: string): Member[] => {
    return members[orgId] || []
  }

  const updateMemberRole = (orgId: string, memberId: string, newRole: "Admin" | "Lead" | "Member") => {
    setMembers((prev) => ({
      ...prev,
      [orgId]: prev[orgId].map((member) => (member.id === memberId ? { ...member, role: newRole } : member)),
    }))
  }

  return (
    <OrganizationContext.Provider
      value={{ currentOrganization, organizations, setCurrentOrganization, getOrganizationMembers, updateMemberRole }}
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
