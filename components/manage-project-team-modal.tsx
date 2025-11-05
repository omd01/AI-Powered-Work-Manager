"use client"

import { useState } from "react"
import { X, Users, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ManageProjectTeamModalProps {
  isOpen: boolean
  onClose: () => void
}

// Mock available members that can be added to projects
const AVAILABLE_MEMBERS = [
  { id: "member-7", name: "Sarah Chen", email: "sarah@acme.com", skills: ["Project Management", "UI/UX"], avatar: "SC" },
  { id: "member-8", name: "Alex Rivera", email: "alex@acme.com", skills: ["DevOps", "Database"], avatar: "AR" },
]

// Current team members
const CURRENT_TEAM_MEMBERS = [
  { id: "member-4", name: "Emma Wilson", email: "emma@acme.com", skills: ["Frontend Development", "React"], avatar: "EW" },
  { id: "member-5", name: "James Park", email: "james@acme.com", skills: ["Mobile Development", "React Native"], avatar: "JP" },
  { id: "member-6", name: "David Kim", email: "david@acme.com", skills: ["Backend Development", "Node.js"], avatar: "DK" },
]

export default function ManageProjectTeamModal({ isOpen, onClose }: ManageProjectTeamModalProps) {
  const [teamMembers, setTeamMembers] = useState(CURRENT_TEAM_MEMBERS)
  const [searchQuery, setSearchQuery] = useState("")

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const handleAddMember = (member: typeof AVAILABLE_MEMBERS[0]) => {
    if (!teamMembers.find((m) => m.id === member.id)) {
      setTeamMembers((prev) => [...prev, member])
    }
  }

  const filteredAvailable = AVAILABLE_MEMBERS.filter(
    (m) =>
      !teamMembers.find((tm) => tm.id === m.id) &&
      (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-6 h-6 text-primary" />
            Manage Project Team
          </DialogTitle>
          <DialogDescription>
            Add or remove team members from your projects. Changes will affect task assignments and project access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Team Members */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Team Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id} className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          <div className="flex gap-1 flex-wrap mt-2">
                            {member.skills.slice(0, 2).map((skill) => (
                              <span key={skill} className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Add Team Members */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Add Team Members</h3>
            <div className="mb-4">
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAvailable.length > 0 ? (
                filteredAvailable.map((member) => (
                  <Card key={member.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {member.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            <div className="flex gap-1 flex-wrap mt-2">
                              {member.skills.slice(0, 2).map((skill) => (
                                <span key={skill} className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddMember(member)}
                          className="border-primary text-primary hover:bg-primary/10"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  {searchQuery ? "No members found matching your search" : "No available members to add"}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log("Team updated:", teamMembers)
                alert("Team updated successfully!")
                onClose()
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

