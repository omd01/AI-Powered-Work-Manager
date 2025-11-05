"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrganization } from "@/lib/organization-context"

export default function MemberProjectsView() {
  const { currentOrganization } = useOrganization()

  // Projects the member is on
  const memberProjects = [
    {
      id: "1",
      name: "Website Redesign",
      description: "Complete overhaul of the marketing website",
      lead: "Sarah Chen",
      status: "In Progress",
      progress: 65,
    },
    {
      id: "2",
      name: "Mobile App MVP",
      description: "Build MVP for the new mobile application",
      lead: "Marcus Johnson",
      status: "In Progress",
      progress: 45,
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">My Projects</h2>
        <p className="text-muted-foreground">Projects you are working on</p>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {memberProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {project.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Lead: <span className="text-foreground font-medium">{project.lead}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {memberProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">No projects assigned</p>
          <p className="text-sm text-muted-foreground">You will see projects here once you're assigned to them</p>
        </div>
      )}
    </div>
  )
}


