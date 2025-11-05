"use client"

import { useState } from "react"
import { Search, AlertCircle } from "lucide-react"
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

  // Mock tasks assigned to Member
  const allTasks: Task[] = [
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
  ]

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

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (newStatus: "Todo" | "In Progress" | "Done") => {
    if (draggedTask) {
      // Here you would update the task status in the backend
      console.log(`Moving task ${draggedTask} to ${newStatus}`)
      setDraggedTask(null)
    }
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
            className="space-y-4"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status)}
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
                  onDragStart={() => handleDragStart(task.id)}
                  className="cursor-move hover:shadow-md transition-shadow hover:border-primary/50"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-sm leading-tight mb-1">{task.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
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


