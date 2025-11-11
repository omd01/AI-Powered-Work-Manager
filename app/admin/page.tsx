"use client"

import { useState, useEffect } from "react"
import Dashboard from "@/components/dashboard"
import ProjectsView from "@/components/projects-view"
import AdminTasksView from "@/components/admin-tasks-view"
import MembersView from "@/components/members-view"
import OrganizationSwitcher from "@/components/organization-switcher"
import { OrganizationProvider } from "@/lib/organization-context"
import MyTasksView from "@/components/my-tasks-view"
import MyScheduleView from "@/components/my-schedule-view"
import CreateProjectModal from "@/components/create-project-modal"
import AdminAITaskAssignerSleek from "@/components/admin-ai-task-assigner-sleek"
import TeamSettingsModal from "@/components/team-settings-modal"
import ManageProjectTeamModal from "@/components/manage-project-team-modal"
import FloatingAITaskAssigner from "@/components/floating-ai-task-assigner"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["Admin"]} requireOrganization={true}>
      <AdminPageContent />
    </ProtectedRoute>
  )
}

function AdminPageContent() {
  const { user, logout } = useAuth()
  const [currentView, setCurrentView] = useState<
    "dashboard" | "projects" | "tasks" | "members" | "my-tasks" | "schedule"
  >("dashboard")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [isAITaskAssignerOpen, setIsAITaskAssignerOpen] = useState(false)
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false)
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  // Check for pending member requests
  useEffect(() => {
    const checkPendingRequests = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("/api/member-requests/pending", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })

        const data = await response.json()
        if (data.success) {
          setPendingRequestsCount(data.count || 0)
        }
      } catch (error) {
        console.error("Error fetching pending requests count:", error)
      }
    }

    checkPendingRequests()
    // Poll every 30 seconds to reduce server load
    const interval = setInterval(checkPendingRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    setCurrentView("tasks")
  }

  const handleViewChange = (
    view: "dashboard" | "projects" | "tasks" | "members" | "my-tasks" | "schedule",
  ) => {
    setCurrentView(view)
  }

  return (
    <OrganizationProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
          <div className="p-2 border-b border-sidebar-border">
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
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                currentView === "members"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
            >
              <span>Members</span>
              {pendingRequestsCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-500 rounded-full">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleViewChange("schedule")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                currentView === "schedule"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
            >
              My Schedule
            </button>
          </div>

          <div className="mt-auto p-4 border-t border-sidebar-border space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/20">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 text-sm min-w-0">
                <p className="font-medium text-sidebar-foreground truncate">{user?.role || "Admin"}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email || "user@example.com"}</p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {currentView === "dashboard" && (
            <Dashboard
              onViewChange={handleViewChange}
              onOpenCreateProject={() => setIsCreateProjectOpen(true)}
              onOpenAITaskAssigner={() => setIsAITaskAssignerOpen(true)}
              onOpenTeamSettings={() => setIsTeamSettingsOpen(true)}
            />
          )}
          {currentView === "my-tasks" && <MyTasksView />}
          {currentView === "schedule" && <MyScheduleView />}
          {currentView === "projects" && <ProjectsView onProjectSelect={handleProjectSelect} />}
          {currentView === "tasks" && selectedProject && (
            <AdminTasksView projectId={selectedProject} onOpenManageTeam={() => setIsManageTeamOpen(true)} />
          )}
          {currentView === "members" && <MembersView onViewChange={handleViewChange} />}
        </main>

        {/* Modals */}
        <CreateProjectModal isOpen={isCreateProjectOpen} onClose={() => setIsCreateProjectOpen(false)} />
        <AdminAITaskAssignerSleek isOpen={isAITaskAssignerOpen} onClose={() => setIsAITaskAssignerOpen(false)} />
        <TeamSettingsModal isOpen={isTeamSettingsOpen} onClose={() => setIsTeamSettingsOpen(false)} />
        <ManageProjectTeamModal
          isOpen={isManageTeamOpen}
          onClose={() => setIsManageTeamOpen(false)}
          projectId={selectedProject}
          onTeamUpdate={() => {
            // Optionally refresh project details if needed
          }}
        />

        {/* Floating AI Task Assigner Button */}
        <FloatingAITaskAssigner />
      </div>
    </OrganizationProvider>
  )
}

