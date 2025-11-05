"use client"

import { useState } from "react"
import MemberMyTasksView from "@/components/member-my-tasks-view"
import MemberProjectsView from "@/components/member-projects-view"
import MyScheduleView from "@/components/my-schedule-view"
import MySkillsView from "@/components/my-skills-view"
import OrganizationSwitcher from "@/components/organization-switcher"
import { OrganizationProvider } from "@/lib/organization-context"

export default function MemberPage() {
  const [currentView, setCurrentView] = useState<"my-tasks" | "projects" | "my-schedule" | "my-skills">("my-tasks")

  const handleViewChange = (view: "my-tasks" | "projects" | "my-schedule" | "my-skills") => {
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
              onClick={() => handleViewChange("my-schedule")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                currentView === "my-schedule"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
            >
              My Schedule
            </button>
            <button
              onClick={() => handleViewChange("my-skills")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                currentView === "my-skills"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
            >
              My Skills
            </button>
          </div>

          <div className="p-4 border-t border-sidebar-border space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/20">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
                M
              </div>
              <div className="text-sm">
                <p className="font-medium text-sidebar-foreground">Member</p>
                <p className="text-xs text-sidebar-foreground/60">user@example.com</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {currentView === "my-tasks" && <MemberMyTasksView />}
          {currentView === "projects" && <MemberProjectsView />}
          {currentView === "my-schedule" && <MyScheduleView />}
          {currentView === "my-skills" && <MySkillsView />}
        </main>
      </div>
    </OrganizationProvider>
  )
}
