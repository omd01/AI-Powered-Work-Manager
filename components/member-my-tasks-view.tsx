"use client"

import { useState, useEffect } from "react"
import { Search, AlertCircle, GripVertical, RefreshCw, User, Calendar, Sparkles, CheckCircle2, Circle, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  assignedById: string
  priority: "High" | "Medium" | "Low" | "Critical"
  status: "Todo" | "Planning" | "In Progress" | "Done" | "Blocked"
  dueDate: string
  project: string
  projectId: string
  skills: string[]
  subtasks: Subtask[]
  isAIAssigned: boolean
  createdAt: string
}

export default function MemberMyTasksView() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  // Fetch tasks from API
  const fetchTasks = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/tasks/my-tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.tasks) {
        setAllTasks(data.tasks)
      } else {
        setError(data.error || "Failed to fetch tasks")
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Failed to fetch tasks")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [user])

  // Update task status via API
  const updateTaskStatus = async (taskId: string, newStatus: "Todo" | "Planning" | "In Progress" | "Done") => {
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
        setAllTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)),
        )
      } else {
        alert(data.error || "Failed to update task status")
        // Revert on error
        fetchTasks()
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      alert("Failed to update task status")
      // Revert on error
      fetchTasks()
    }
  }

  const deleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        // Remove from local state
        setAllTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
        alert(data.message || "Task deleted successfully")
      } else {
        alert(data.error || "Failed to delete task")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      alert("Failed to delete task")
    }
  }

  const filteredTasks = allTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const tasksByStatus = {
    Todo: filteredTasks.filter((t) => t.status === "Todo" || t.status === "Planning"),
    "In Progress": filteredTasks.filter((t) => t.status === "In Progress"),
    Done: filteredTasks.filter((t) => t.status === "Done"),
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(columnStatus)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: "Todo" | "In Progress" | "Done") => {
    e.preventDefault()

    if (draggedTask) {
      const task = allTasks.find((t) => t.id === draggedTask)
      if (task && task.status !== newStatus) {
        // Optimistically update UI
        setAllTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === draggedTask ? { ...t, status: newStatus } : t)),
        )
        // Update via API
        await updateTaskStatus(draggedTask, newStatus)
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

  const taskStats = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.status === "Done").length,
    inProgress: allTasks.filter((t) => t.status === "In Progress").length,
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Error: {error}</p>
          <Button onClick={fetchTasks} variant="outline">
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
            <h2 className="text-3xl font-bold text-foreground mb-2">My Tasks</h2>
            <p className="text-muted-foreground">
              {taskStats.total} tasks • {taskStats.completed} completed • {taskStats.inProgress} in progress
            </p>
          </div>
          <Button onClick={fetchTasks} variant="outline" size="sm">
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
            placeholder="Search tasks..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(["Todo", "In Progress", "Done"] as const).map((status) => (
          <div
            key={status}
            className={`space-y-4 p-4 rounded-lg border-2 transition-colors ${
              dragOverColumn === status ? "border-primary bg-primary/5" : "border-transparent bg-muted/20"
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">{status}</h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                {tasksByStatus[status].length}
              </span>
            </div>

            <div className="space-y-3 min-h-[400px]">
              {tasksByStatus[status].map((task) => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move hover:shadow-md transition-all hover:border-primary/50 ${
                    draggedTask === task.id ? "opacity-50 scale-95" : ""
                  }`}
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground text-sm leading-tight">{task.title}</h4>
                            {task.isAIAssigned && (
                              <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        </div>
                      </div>
                      {task.priority === "Critical" && (
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      )}
                    </div>

                    {/* Assigned By */}
                    <div className="flex items-center gap-2 text-xs">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Assigned by:</span>
                      <span className="font-medium text-foreground">{task.assignedBy}</span>
                      {task.assignedByRole && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${getRoleBadgeColor(task.assignedByRole)}`}>
                          {task.assignedByRole}
                        </span>
                      )}
                    </div>

                    {/* Project Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded">
                        {task.project}
                      </span>
                    </div>

                    {/* Priority and Due Date */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{task.dueDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {task.skills.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {task.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="text-xs bg-blue-100/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                        {task.skills.length > 3 && (
                          <span className="text-xs text-muted-foreground px-2 py-0.5">
                            +{task.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Subtasks Progress */}
                    {task.subtasks.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">
                          Subtasks: {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                        </p>
                        {expandedTask === task.id && (
                          <div className="space-y-1">
                            {task.subtasks.map((subtask) => (
                              <div key={subtask.id} className="flex items-center gap-2 text-xs">
                                {subtask.completed ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                )}
                                <span
                                  className={subtask.completed ? "line-through text-muted-foreground" : "text-foreground"}
                                >
                                  {subtask.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded Details */}
                    {expandedTask === task.id && (
                      <div className="pt-2 border-t border-border space-y-2 text-xs">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Full Description</p>
                          <p className="text-foreground">{task.description || "No description"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-muted-foreground mb-0.5">Assigned by</p>
                            <p className="text-foreground">{task.assignedBy}</p>
                            <p className="text-muted-foreground text-xs">{task.assignedByEmail}</p>
                          </div>
                        </div>
                        {task.createdAt && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-0.5">Created</p>
                            <p className="text-foreground">{task.createdAt}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delete Button - Only for Personal Tasks */}
                    {task.project === "Personal" && !task.projectId && (
                      <div className="pt-3 border-t border-border">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTask(task.id, task.title)
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete Task
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {tasksByStatus[status].length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No tasks in {status}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
