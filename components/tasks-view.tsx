"use client"

import { ArrowLeft, Plus, Filter, Search, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface TasksViewProps {
  projectId: string
}

export default function TasksView({ projectId }: TasksViewProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const tasks = [
    {
      id: "1",
      title: "Design homepage mockups",
      description: "Create high-fidelity mockups for the new homepage design",
      assignee: "Emma Wilson",
      priority: "High",
      status: "In Progress",
      dueDate: "2025-12-10",
      skills: ["UI Design", "Figma"],
      subtasks: [
        { id: "1-1", title: "Mobile layout", completed: true },
        { id: "1-2", title: "Desktop layout", completed: false },
        { id: "1-3", title: "Component library", completed: false },
      ],
    },
    {
      id: "2",
      title: "Set up database schema",
      description: "Create PostgreSQL schema for user management and projects",
      assignee: "David Park",
      priority: "Critical",
      status: "In Progress",
      dueDate: "2025-12-05",
      skills: ["Database", "PostgreSQL"],
      subtasks: [
        { id: "2-1", title: "Users table", completed: true },
        { id: "2-2", title: "Projects table", completed: true },
      ],
    },
    {
      id: "3",
      title: "Implement authentication",
      description: "Add user signup and login functionality",
      assignee: "Sarah Chen",
      priority: "High",
      status: "Planning",
      dueDate: "2025-12-08",
      skills: ["Backend", "Security"],
      subtasks: [],
    },
    {
      id: "4",
      title: "Write API documentation",
      description: "Document all REST endpoints with examples",
      assignee: "Marcus Johnson",
      priority: "Medium",
      status: "Todo",
      dueDate: "2025-12-12",
      skills: ["Documentation", "API"],
      subtasks: [],
    },
  ]

  const getPriorityIcon = (priority: string) => {
    if (priority === "Critical") return <AlertCircle className="w-4 h-4 text-destructive" />
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100/20 text-blue-700 border-blue-200/30"
      case "Todo":
        return "bg-gray-100/20 text-gray-700 border-gray-200/30"
      case "Planning":
        return "bg-purple-100/20 text-purple-700 border-purple-200/30"
      case "Done":
        return "bg-green-100/20 text-green-700 border-green-200/30"
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30"
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Website Redesign</h2>
            <p className="text-muted-foreground">24 tasks • 12 completed • 65% progress</p>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Tasks Kanban-style view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {["Todo", "Planning", "In Progress", "Done"].map((status) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">{status}</h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                {tasks.filter((t) => t.status === status).length}
              </span>
            </div>

            {tasks
              .filter((t) => t.status === status)
              .map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm leading-tight">{task.title}</p>
                      </div>
                      {getPriorityIcon(task.priority)}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>

                    {/* Assignee */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{task.assignee.charAt(0)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{task.assignee}</span>
                    </div>

                    {/* Skills */}
                    <div className="flex gap-1 flex-wrap">
                      {task.skills.map((skill) => (
                        <span key={skill} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Priority and Due Date */}
                    <div className="flex gap-2 items-center text-xs">
                      <span
                        className={`px-2 py-1 rounded-full font-medium ${
                          task.priority === "Critical"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-orange-100/20 text-orange-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-muted-foreground">{task.dueDate}</span>
                    </div>

                    {/* Subtasks */}
                    {task.subtasks.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">
                          Subtasks: {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                        </p>
                        <div className="space-y-1">
                          {task.subtasks.map((subtask) => (
                            <div key={subtask.id} className="flex items-center gap-2 text-xs">
                              {subtask.completed ? (
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                              ) : (
                                <Circle className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span
                                className={subtask.completed ? "line-through text-muted-foreground" : "text-foreground"}
                              >
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        ))}
      </div>

      {/* Task Detail View */}
      {expandedTask && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>Edit task information and track progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Detailed task editing panel will be implemented here. This is a placeholder for expanded task management.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
