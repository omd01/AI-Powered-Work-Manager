"use client"

import { useState } from "react"
import Dashboard from "@/components/dashboard"
import ProjectsView from "@/components/projects-view"
import TasksView from "@/components/tasks-view"
import MembersView from "@/components/members-view"
import OrganizationSwitcher from "@/components/organization-switcher"
import { OrganizationProvider } from "@/lib/organization-context"
import MyTasksView from "@/components/my-tasks-view"

export default function Home() {
  const [currentView, setCurrentView] = useState<"dashboard" | "projects" | "tasks" | "members" | "my-tasks">(
    "dashboard",
  )
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    setCurrentView("tasks")
  }

  const handleViewChange = (view: "dashboard" | "projects" | "tasks" | "members" | "my-tasks") => {
    setCurrentView(view)
  }

  return (
    <OrganizationProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
          <div className="p-4 border-b border-sidebar-border">
            <OrganizationSwitcher />
          </div>

          <div className="flex-1 p-4 space-y-2">
            <button
              onClick={() => handleViewChange("dashboard")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                currentView === "dashboard"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleViewChange("my-tasks")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                currentView === "my-tasks"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => handleViewChange("projects")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                currentView === "projects"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => handleViewChange("members")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                currentView === "members"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
            >
              Members
            </button>
          </div>

          <div className="p-4 border-t border-sidebar-border space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/20">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
                AI
              </div>
              <div className="text-sm">
                <p className="font-medium text-sidebar-foreground">Admin</p>
                <p className="text-xs text-sidebar-foreground/60">user@example.com</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {currentView === "dashboard" && <Dashboard onViewChange={handleViewChange} />}
          {currentView === "my-tasks" && <MyTasksView />}
          {currentView === "projects" && <ProjectsView onProjectSelect={handleProjectSelect} />}
          {currentView === "tasks" && selectedProject && <TasksView projectId={selectedProject} />}
          {currentView === "members" && <MembersView onViewChange={handleViewChange} />}
        </main>
      </div>
    </OrganizationProvider>
  )
}
