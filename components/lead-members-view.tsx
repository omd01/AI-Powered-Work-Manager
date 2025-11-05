"use client"

import { Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrganization } from "@/lib/organization-context"

interface LeadMembersViewProps {
  onViewChange?: (view: "dashboard" | "projects" | "tasks" | "members") => void
}

export default function LeadMembersView({ onViewChange }: LeadMembersViewProps) {
  const { currentOrganization } = useOrganization()

  // Only members on Lead's project teams
  const teamMembers = [
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
      name: "David Kim",
      email: "david@acme.com",
      role: "Member",
      projects: ["Mobile App MVP"],
      skills: ["Backend Development", "Node.js", "AWS"],
      avatar: "DK",
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Users className="w-8 h-8" />
          My Team Members
        </h2>
        <p className="text-muted-foreground">
          Team members on your projects in <span className="font-semibold text-foreground">{currentOrganization.name}</span>
        </p>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {teamMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{member.name}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Role Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Role:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {member.role}
                </span>
              </div>

              {/* Projects */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Projects:</p>
                <div className="flex flex-wrap gap-2">
                  {member.projects.map((project, idx) => (
                    <span key={idx} className="inline-block bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                      {project}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, idx) => (
                    <span key={idx} className="inline-block bg-secondary/20 text-secondary text-xs px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Team Summary</CardTitle>
          <CardDescription>Overview of your project teams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Total Members</p>
              <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Active Projects</p>
              <p className="text-2xl font-bold text-foreground">
                {new Set(teamMembers.flatMap((m) => m.projects)).size}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Unique Skills</p>
              <p className="text-2xl font-bold text-foreground">
                {new Set(teamMembers.flatMap((m) => m.skills)).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

