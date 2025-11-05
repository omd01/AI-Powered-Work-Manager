"use client"

import { useState, useMemo } from "react"
import { Filter, Search, CheckCircle2, Circle, AlertCircle, ChevronDown, RefreshCw, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface Task {
  id: string
  title: string
  description: string
  assignee: string
  priority: "High" | "Medium" | "Low" | "Critical"
  status: "Todo" | "Planning" | "In Progress" | "Done"
  dueDate: string
  skills: string[]
  project: string
  subtasks: Array<{ id: string; title: string; completed: boolean }>
}

export default function LeadMyTasksView() {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "status">("dueDate")
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)

  // Tasks assigned to Lead (e.g., review tasks) - using state to allow updates
  const [allTasks, setAllTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Review Alex's code",
      description: "Review the pull request for the authentication module",
      assignee: "Lead",
      priority: "High",
      status: "In Progress",
      dueDate: "2025-12-10",
      skills: ["Code Review", "Security"],
      project: "Mobile App MVP",
      subtasks: [
        { id: "1-1", title: "Check security best practices", completed: true },
        { id: "1-2", title: "Verify error handling", completed: false },
        { id: "1-3", title: "Test edge cases", completed: false },
      ],
    },
    {
      id: "2",
      title: "Approve database schema",
      description: "Review and approve the proposed database schema changes",
      assignee: "Lead",
      priority: "Critical",
      status: "Todo",
      dueDate: "2025-12-05",
      skills: ["Database", "Architecture"],
      project: "Mobile App MVP",
      subtasks: [],
    },
    {
      id: "3",
      title: "Plan sprint goals",
      description: "Define and prioritize sprint goals for the next iteration",
      assignee: "Lead",
      priority: "High",
      status: "Planning",
      dueDate: "2025-12-08",
      skills: ["Planning", "Project Management"],
      project: "Website Redesign",
      subtasks: [],
    },
    {
      id: "4",
      title: "Review UI mockups",
      description: "Review and provide feedback on the new homepage designs",
      assignee: "Lead",
      priority: "Medium",
      status: "Todo",
      dueDate: "2025-12-12",
      skills: ["UI/UX", "Design Review"],
      project: "Website Redesign",
      subtasks: [],
    },
  ])

  // Function to update task status
  const handleStatusChange = (taskId: string, newStatus: "Todo" | "Planning" | "In Progress" | "Done") => {
    setAllTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)),
    )
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverTaskId(taskId)
  }

  const handleDragLeave = () => {
    setDragOverTaskId(null)
  }

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault()

    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null)
      setDragOverTaskId(null)
      return
    }

    setAllTasks((prevTasks) => {
      const tasks = [...prevTasks]
      const draggedIndex = tasks.findIndex((t) => t.id === draggedTaskId)
      const targetIndex = tasks.findIndex((t) => t.id === targetTaskId)

      if (draggedIndex === -1 || targetIndex === -1) return tasks

      // Remove dragged task and insert at target position
      const [draggedTask] = tasks.splice(draggedIndex, 1)
      tasks.splice(targetIndex, 0, draggedTask)

      return tasks
    })

    setDraggedTaskId(null)
    setDragOverTaskId(null)
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverTaskId(null)
  }

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = allTasks

    // Search filter
    if (searchQuery) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Status filter
    if (filterStatus) {
      result = result.filter((task) => task.status === filterStatus)
    }

    // Priority filter
    if (filterPriority) {
      result = result.filter((task) => task.priority === filterPriority)
    }

    // Sort
    const sortedResult = [...result]
    switch (sortBy) {
      case "dueDate":
        sortedResult.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        break
      case "priority":
        const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        sortedResult.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        break
      case "status":
        const statusOrder = { "In Progress": 0, Planning: 1, Todo: 2, Done: 3 }
        sortedResult.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
        break
    }

    return sortedResult
  }, [searchQuery, filterStatus, filterPriority, sortBy])

  const getPriorityIcon = (priority: string) => {
    if (priority === "Critical") return <AlertCircle className="w-4 h-4 text-destructive" />
    return null
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100/20 text-blue-700 dark:text-blue-400 border-blue-200/30 dark:border-blue-900"
      case "Todo":
        return "bg-gray-100/20 text-gray-700 dark:text-gray-400 border-gray-200/30 dark:border-gray-900"
      case "Planning":
        return "bg-purple-100/20 text-purple-700 dark:text-purple-400 border-purple-200/30 dark:border-purple-900"
      case "Done":
        return "bg-green-100/20 text-green-700 dark:text-green-400 border-green-200/30 dark:border-green-900"
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30"
    }
  }

  const taskStats = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.status === "Done").length,
    inProgress: allTasks.filter((t) => t.status === "In Progress").length,
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
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {/* Sort Dropdown */}
          <div className="relative group">
            <Button variant="outline" className="gap-2 bg-transparent">
              Sort by: {sortBy === "dueDate" ? "Due Date" : sortBy === "priority" ? "Priority" : "Status"}
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div className="absolute hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg mt-1 z-10">
              <button
                onClick={() => setSortBy("dueDate")}
                className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0"
              >
                Due Date
              </button>
              <button
                onClick={() => setSortBy("priority")}
                className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0"
              >
                Priority
              </button>
              <button
                onClick={() => setSortBy("status")}
                className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0"
              >
                Status
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <Button variant={filterStatus ? "default" : "outline"} className="gap-2">
              <Filter className="w-4 h-4" />
              Status {filterStatus && `(${filterStatus})`}
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div className="absolute hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg mt-1 z-10">
              <button
                onClick={() => setFilterStatus(null)}
                className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border"
              >
                All Status
              </button>
              {["Todo", "Planning", "In Progress", "Done"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="relative group">
            <Button variant={filterPriority ? "default" : "outline"} className="gap-2">
              Priority {filterPriority && `(${filterPriority})`}
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div className="absolute hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg mt-1 z-10">
              <button
                onClick={() => setFilterPriority(null)}
                className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border"
              >
                All Priorities
              </button>
              {["Critical", "High", "Medium", "Low"].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className="px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0"
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragOver={(e) => handleDragOver(e, task.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, task.id)}
              onDragEnd={handleDragEnd}
              className={`cursor-move hover:shadow-md transition-all hover:border-primary/50 ${
                draggedTaskId === task.id ? "opacity-50" : ""
              } ${dragOverTaskId === task.id ? "border-primary border-2" : ""}`}
              onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <GripVertical
                        className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">{task.title}</h3>
                          {getPriorityIcon(task.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Change Status Dropdown */}
                      <div className="relative group">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span className="text-xs">Change Status</span>
                        </Button>
                        <div className="absolute right-0 hidden group-hover:flex flex-col bg-popover border border-border rounded-lg shadow-lg mt-1 z-20 min-w-[140px]">
                          {["Todo", "Planning", "In Progress", "Done"].map((status) => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(task.id, status as "Todo" | "Planning" | "In Progress" | "Done")
                              }}
                              className={`px-4 py-2 text-left hover:bg-muted/50 text-sm border-b border-border last:border-0 ${
                                task.status === status ? "bg-muted font-medium" : ""
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Project Badge */}
                      <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded">
                        {task.project}
                      </span>

                      {/* Priority Badge */}
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>

                      {/* Due Date */}
                      <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                    </div>

                    {/* Skills */}
                    <div className="flex gap-1 flex-wrap justify-end">
                      {task.skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Subtasks Progress */}
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

                  {/* Expanded Details */}
                  {expandedTask === task.id && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Full Description</p>
                        <p className="text-sm text-foreground">{task.description}</p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Assigned to</p>
                          <p className="text-sm text-foreground">{task.assignee}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Project</p>
                          <p className="text-sm text-foreground">{task.project}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No tasks found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  )
}

