"use client"

import { useState } from "react"
import { Users, ChevronDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrganization } from "@/lib/organization-context"

interface MembersViewProps {
  onViewChange?: (view: "dashboard" | "projects" | "tasks" | "members") => void
}

export default function MembersView({ onViewChange }: MembersViewProps) {
  const { currentOrganization, getOrganizationMembers, updateMemberRole } = useOrganization()
  const members = getOrganizationMembers(currentOrganization.id)
  const [selectedRole, setSelectedRole] = useState<Record<string, boolean>>({})

  const handleRoleChange = (memberId: string, newRole: "Admin" | "Lead" | "Member") => {
    updateMemberRole(currentOrganization.id, memberId, newRole)
    setSelectedRole((prev) => ({ ...prev, [memberId]: false }))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800"
      case "Lead":
        return "bg-blue-100 text-blue-800"
      case "Member":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Users className="w-8 h-8" />
          Team Members
        </h2>
        <p className="text-muted-foreground">
          Manage team members in <span className="font-semibold text-foreground">{currentOrganization.name}</span>
        </p>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {members.map((member) => (
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
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Role Badge with Dropdown */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Role:</span>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedRole((prev) => ({ ...prev, [member.id]: !prev[member.id] }))}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${getRoleColor(member.role)}`}
                    >
                      {member.role}
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {/* Dropdown Menu */}
                    {selectedRole[member.id] && (
                      <div className="absolute top-full mt-1 left-0 bg-background border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                        {(["Admin", "Lead", "Member"] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(member.id, role)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${member.role === role ? "bg-muted" : ""}`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Projects:</p>
                <div className="flex flex-wrap gap-2">
                  {member.projects.length > 0 ? (
                    member.projects.map((project, idx) => (
                      <span key={idx} className="inline-block bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                        {project}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No projects assigned</span>
                  )}
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
          <CardDescription>Overview of team composition</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Total Members</p>
              <p className="text-2xl font-bold text-foreground">{members.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Admins</p>
              <p className="text-2xl font-bold text-foreground">{members.filter((m) => m.role === "Admin").length}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Leads</p>
              <p className="text-2xl font-bold text-foreground">{members.filter((m) => m.role === "Lead").length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
