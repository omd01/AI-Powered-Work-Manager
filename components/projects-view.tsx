"use client"

import { useState } from "react"
import { Plus, Search, Filter, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import CreateProjectModal from "./create-project-modal"

interface ProjectsViewProps {
  onProjectSelect: (projectId: string) => void
}

export default function ProjectsView({ onProjectSelect }: ProjectsViewProps) {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)

  const projects = [
    {
      id: "1",
      name: "Website Redesign",
      description: "Complete overhaul of the marketing website",
      lead: "Sarah Chen",
      members: 5,
      status: "In Progress",
      progress: 65,
      tasks: 24,
      dueDate: "2025-12-15",
      priority: "High",
    },
    {
      id: "2",
      name: "Mobile App MVP",
      description: "Build MVP for the new mobile application",
      lead: "Marcus Johnson",
      members: 8,
      status: "In Progress",
      progress: 45,
      tasks: 32,
      dueDate: "2026-01-30",
      priority: "Critical",
    },
    {
      id: "3",
      name: "Database Migration",
      description: "Migrate from legacy system to PostgreSQL",
      lead: "Alex Rivera",
      members: 3,
      status: "In Progress",
      progress: 80,
      tasks: 18,
      dueDate: "2025-12-01",
      priority: "High",
    },
    {
      id: "4",
      name: "Security Audit",
      description: "Complete security assessment and compliance check",
      lead: "Jamie Lee",
      members: 4,
      status: "Planning",
      progress: 10,
      tasks: 14,
      dueDate: "2026-02-15",
      priority: "Medium",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-destructive/20 text-destructive border-destructive/30"
      case "High":
        return "bg-orange-100/20 text-orange-700 border-orange-200/30"
      case "Medium":
        return "bg-yellow-100/20 text-yellow-700 border-yellow-200/30"
      default:
        return "bg-green-100/20 text-green-700 border-green-200/30"
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Projects</h2>
          <p className="text-muted-foreground">Manage and organize your team projects</p>
        </div>
        <Button
          onClick={() => setIsCreateProjectOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
            onClick={() => onProjectSelect(project.id)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{project.name}</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Progress</span>
                  <span className="text-sm text-muted-foreground">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              {/* Project Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Lead</p>
                  <p className="font-medium text-foreground">{project.lead}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Team</p>
                  <p className="font-medium text-foreground">{project.members} members</p>
                </div>
              </div>

              {/* Status and Priority */}
              <div className="flex gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {project.status}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full border ${getPriorityColor(project.priority)}`}
                >
                  {project.priority}
                </span>
              </div>

              {/* Task Count */}
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{project.tasks}</span> tasks
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateProjectModal isOpen={isCreateProjectOpen} onClose={() => setIsCreateProjectOpen(false)} />
    </div>
  )
}
