"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  GripVertical,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface Task {
  id: string
  title: string
  description: string
  assignedBy: string
  assignedByEmail: string
  assignedByRole: string
  priority: "High" | "Medium" | "Low" | "Critical"
  status: "Todo" | "Planning" | "In Progress" | "Done" | "Blocked"
  dueDate: string
  skills: string[]
  subtasks: Subtask[]
  isAIAssigned: boolean
  createdAt: string
}

interface Project {
  id: string
  name: string
  description: string
  lead: string
  leadEmail: string
  leadId: string
  status: string
  priority: string
  progress: number
  tasks: number
  dueDate: string
  startDate: string
  myTasks: Task[]
}

export default function MemberProjectsView() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<{ projectId: string; status: string } | null>(null)

  // Fetch member's projects and their tasks
  const fetchProjects = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")

      // Fetch all projects
      const projectsResponse = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const projectsData = await projectsResponse.json()

      if (projectsData.success && projectsData.projects) {
        // Filter projects where user is a member (either lead or in memberIds array)
        const memberProjects = projectsData.projects.filter((project: any) => {
          const isLead = project.leadId === user.id
          const isMember = project.memberIds && project.memberIds.includes(user.id)
          return isLead || isMember
        })

        // For each project, fetch user's tasks
        const projectsWithTasks = await Promise.all(
          memberProjects.map(async (project: any) => {
            try {
              const tasksResponse = await fetch(`/api/projects/${project.id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                credentials: "include",
              })

              const tasksData = await tasksResponse.json()

              if (tasksData.success && tasksData.tasks) {
                // Filter tasks assigned to the current user
                const myTasks = tasksData.tasks.filter((task: any) => task.assigneeId === user.id)

                return {
                  ...project,
                  myTasks: myTasks.map((task: any) => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    assignedBy: "Unknown", // Will be populated by task API
                    assignedByEmail: "",
                    assignedByRole: "",
                    priority: task.priority,
                    status: task.status,
                    dueDate: task.dueDate,
                    skills: task.skills || [],
                    subtasks: task.subtasks || [],
                    isAIAssigned: false,
                    createdAt: "",
                  })),
                }
              }

              return { ...project, myTasks: [] }
            } catch (err) {
              console.error(`Error fetching tasks for project ${project.id}:`, err)
              return { ...project, myTasks: [] }
            }
          }),
        )

        setProjects(projectsWithTasks)
      } else {
        setError(projectsData.error || "Failed to fetch projects")
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      setError("Failed to fetch projects")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  // Update task status via API
  const updateTaskStatus = async (
    projectId: string,
    taskId: string,
    newStatus: "Todo" | "Planning" | "In Progress" | "Done",
  ) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  myTasks: project.myTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)),
                }
              : project,
          ),
        )
      } else {
        alert(data.error || "Failed to update task status")
        fetchProjects()
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      alert("Failed to update task status")
      fetchProjects()
    }
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, projectId: string, columnStatus: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn({ projectId, status: columnStatus })
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, projectId: string, newStatus: "Todo" | "In Progress" | "Done") => {
    e.preventDefault()

    if (draggedTask) {
      const project = projects.find((p) => p.id === projectId)
      const task = project?.myTasks.find((t) => t.id === draggedTask)

      if (task && task.status !== newStatus) {
        await updateTaskStatus(projectId, draggedTask, newStatus)
      }
      setDraggedTask(null)
      setDragOverColumn(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-destructive/20 text-destructive border-destructive/30"
      case "High":
        return "bg-orange-100/20 text-orange-700 dark:text-orange-400 border-orange-200/30"
      case "Medium":
        return "bg-yellow-100/20 text-yellow-700 dark:text-yellow-400 border-yellow-200/30"
      case "Low":
        return "bg-green-100/20 text-green-700 dark:text-green-400 border-green-200/30"
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100/20 text-blue-700 dark:text-blue-400 border-blue-200/30"
      case "Completed":
      case "Done":
        return "bg-green-100/20 text-green-700 dark:text-green-400 border-green-200/30"
      case "Planning":
        return "bg-purple-100/20 text-purple-700 dark:text-purple-400 border-purple-200/30"
      case "On Hold":
        return "bg-gray-100/20 text-gray-700 dark:text-gray-400 border-gray-200/30"
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30"
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
      case "Lead":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Error: {error}</p>
          <Button onClick={fetchProjects} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">My Projects</h2>
            <p className="text-muted-foreground">
              {filteredProjects.length} projects • {filteredProjects.reduce((sum, p) => sum + p.myTasks.length, 0)}{" "}
              total tasks
            </p>
          </div>
          <Button onClick={fetchProjects} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const isExpanded = expandedProjects.has(project.id)
            const tasksByStatus = {
              Todo: project.myTasks.filter((t) => t.status === "Todo" || t.status === "Planning"),
              "In Progress": project.myTasks.filter((t) => t.status === "In Progress"),
              Done: project.myTasks.filter((t) => t.status === "Done"),
            }

            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Project Header */}
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleProject(project.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">{project.name}</h3>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusColor(project.status)}`}
                        >
                          {project.status}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded border ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Lead: {project.lead}</span>
                        </div>
                        {project.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {project.dueDate}</span>
                          </div>
                        )}
                        <span>{project.myTasks.length} my tasks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground mb-1">{project.progress}%</div>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded: Kanban Board for Tasks */}
                  {isExpanded && project.myTasks.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-4">My Tasks in this Project</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(["Todo", "In Progress", "Done"] as const).map((status) => (
                          <div
                            key={status}
                            className={`space-y-3 p-3 rounded-lg border-2 transition-colors ${
                              dragOverColumn?.projectId === project.id && dragOverColumn?.status === status
                                ? "border-primary bg-primary/5"
                                : "border-transparent bg-muted/20"
                            }`}
                            onDragOver={(e) => handleDragOver(e, project.id, status)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, project.id, status)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-foreground text-xs">{status}</h5>
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                {tasksByStatus[status].length}
                              </span>
                            </div>

                            <div className="space-y-2 min-h-[200px]">
                              {tasksByStatus[status].map((task) => (
                                <Card
                                  key={task.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, task.id)}
                                  onDragEnd={handleDragEnd}
                                  className={`cursor-move hover:shadow-md transition-all hover:border-primary/50 ${
                                    draggedTask === task.id ? "opacity-50 scale-95" : ""
                                  }`}
                                >
                                  <CardContent className="p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-1">
                                        <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1 mb-1">
                                            <p className="font-medium text-foreground text-xs leading-tight">
                                              {task.title}
                                            </p>
                                            {task.isAIAssigned && (
                                              <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                                        </div>
                                      </div>
                                      {task.priority === "Critical" && (
                                        <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}
                                      >
                                        {task.priority}
                                      </span>
                                      {task.dueDate && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Calendar className="w-3 h-3" />
                                          <span>{task.dueDate}</span>
                                        </div>
                                      )}
                                    </div>

                                    {task.subtasks.length > 0 && (
                                      <div className="pt-2 border-t border-border">
                                        <p className="text-xs text-muted-foreground">
                                          Subtasks: {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                                        </p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}

                              {tasksByStatus[status].length === 0 && (
                                <div className="text-center py-6 text-muted-foreground text-xs">No tasks</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && project.myTasks.length === 0 && (
                    <div className="mt-6 pt-6 border-t border-border text-center py-8">
                      <p className="text-muted-foreground text-sm">No tasks assigned to you in this project</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No projects found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try a different search query" : "You will see projects here once you're assigned to them"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
