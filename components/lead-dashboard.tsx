"use client"

import { ArrowRight, Users, Briefcase, CheckSquare, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrganization } from "@/lib/organization-context"

interface LeadDashboardProps {
  onViewChange: (view: "dashboard" | "projects" | "tasks" | "members" | "my-tasks") => void
  onOpenAITaskAssigner: () => void
  onOpenManageTeam: () => void
}

// Mock data for Lead's projects and team
const LEAD_PROJECTS = [
  {
    id: "1",
    name: "Mobile App MVP",
    members: 8,
    status: "In Progress",
    progress: 45,
    tasks: 32,
  },
  {
    id: "2",
    name: "Website Redesign",
    members: 5,
    status: "In Progress",
    progress: 65,
    tasks: 24,
  },
]

const LEAD_TEAM_MEMBERS = [
  { name: "Emma Wilson", role: "Member", skills: ["Frontend Development", "React", "CSS"] },
  { name: "James Park", role: "Member", skills: ["Mobile Development", "React Native", "iOS"] },
  { name: "David Kim", role: "Member", skills: ["Backend Development", "Node.js"] },
]

export default function LeadDashboard({
  onViewChange,
  onOpenAITaskAssigner,
  onOpenManageTeam,
}: LeadDashboardProps) {
  const { currentOrganization } = useOrganization()

  const activeProjects = LEAD_PROJECTS.length
  const teamMembers = LEAD_TEAM_MEMBERS.length
  const pendingTasks = LEAD_PROJECTS.reduce((sum, p) => sum + p.tasks, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, Lead
          {currentOrganization && <span className="text-primary"> — {currentOrganization.name}</span>}
        </h2>
        <p className="text-muted-foreground">Manage your projects and assign tasks to your team with AI</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-foreground">{activeProjects}</p>
              <Briefcase className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-foreground">{teamMembers}</p>
              <Users className="w-8 h-8 text-accent opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-foreground">{pendingTasks}</p>
              <CheckSquare className="w-8 h-8 text-secondary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-foreground">{Math.round(pendingTasks * 0.8)}</p>
              <Zap className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>Projects you are leading</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {LEAD_PROJECTS.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => onViewChange("projects")}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.members} team members</p>
                    </div>
                    <div className="text-right">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{project.progress}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => onViewChange("projects")}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                View Projects
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent border-primary text-primary hover:bg-primary/10"
                onClick={onOpenAITaskAssigner}
              >
                <Zap className="w-4 h-4 mr-2" />
                Assign Tasks with AI
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={onOpenManageTeam}>
                Manage Project Team
              </Button>
            </CardContent>
          </Card>

          {/* AI Feature Highlight */}
          <Card className="mt-4 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                AI Task Assigner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Describe what you need in natural language, and AI will automatically break it down, prioritize, and
                assign tasks to the best team members.
              </p>
              <Button
                size="sm"
                className="w-full bg-primary hover:bg-primary/90"
                onClick={onOpenAITaskAssigner}
              >
                Try Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

