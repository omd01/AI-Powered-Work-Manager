"use client"

import { useState } from "react"
import { Search, AlertCircle, GripVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface Task {
  id: string
  title: string
  description: string
  priority: "High" | "Medium" | "Low" | "Critical"
  status: "Todo" | "In Progress" | "Done"
  dueDate: string
  project: string
}

export default function MemberMyTasksView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Mock tasks assigned to Member - using state to allow updates
  const [allTasks, setAllTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Design homepage mockups",
      description: "Create high-fidelity mockups for the new homepage design",
      priority: "High",
      status: "In Progress",
      dueDate: "2025-12-10",
      project: "Website Redesign",
    },
    {
      id: "2",
      title: "Implement login form",
      description: "Create login form component with validation",
      priority: "Critical",
      status: "Todo",
      dueDate: "2025-12-05",
      project: "Mobile App MVP",
    },
    {
      id: "3",
      title: "Write unit tests",
      description: "Add unit tests for authentication module",
      priority: "Medium",
      status: "Todo",
      dueDate: "2025-12-08",
      project: "Mobile App MVP",
    },
    {
      id: "4",
      title: "Update API documentation",
      description: "Document all REST endpoints with examples",
      priority: "Medium",
      status: "Done",
      dueDate: "2025-12-01",
      project: "Backend Infrastructure",
    },
    {
      id: "5",
      title: "Code review for payment module",
      description: "Review and approve the payment processing implementation",
      priority: "High",
      status: "In Progress",
      dueDate: "2025-12-07",
      project: "Website Redesign",
    },
    {
      id: "6",
      title: "Fix responsive layout issues",
      description: "Fix mobile layout issues on dashboard page",
      priority: "High",
      status: "Done",
      dueDate: "2025-11-28",
      project: "Website Redesign",
    },
  ])

  const filteredTasks = allTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const tasksByStatus = {
    Todo: filteredTasks.filter((t) => t.status === "Todo"),
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

  const handleDrop = (e: React.DragEvent, newStatus: "Todo" | "In Progress" | "Done") => {
    e.preventDefault()

    if (draggedTask) {
      // Update the task status
      setAllTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === draggedTask ? { ...task, status: newStatus } : task)),
      )
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
        return "bg-destructive/20 text-destructive"
      case "High":
        return "bg-orange-100/20 text-orange-700 dark:text-orange-400"
      case "Medium":
        return "bg-yellow-100/20 text-yellow-700 dark:text-yellow-400"
      case "Low":
        return "bg-green-100/20 text-green-700 dark:text-green-400"
      default:
        return "bg-muted/20 text-muted-foreground"
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">My Tasks</h2>
        <p className="text-muted-foreground">Manage and track your assigned tasks</p>
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
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm leading-tight mb-1">{task.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        </div>
                      </div>
                      {task.priority === "Critical" && (
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      )}
                    </div>

                    {/* Project Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded">
                        {task.project}
                      </span>
                    </div>

                    {/* Priority and Due Date */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                    </div>
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


