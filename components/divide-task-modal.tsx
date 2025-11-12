"use client"

import { useState, useEffect } from "react"
import { Sparkles, CheckCircle, Zap, TrendingUp, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface SubTask {
  title: string
  description: string
  assignedTo: string
  assignedToName: string
  priority: "High" | "Medium" | "Low"
  matchScore: number
  reasoning: string
}

interface DivideTaskModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  taskTitle: string
  projectName: string
  onSuccess?: () => void
}

interface CreatedSubtask extends SubTask {
  isCreated: boolean
  isCreating: boolean
}

interface ProjectMember {
  id: string
  name: string
  email: string
}

export default function DivideTaskModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  projectName,
  onSuccess,
}: DivideTaskModalProps) {
  const [step, setStep] = useState<"analyzing" | "review" | "creating" | "success">("analyzing")
  const [subtasks, setSubtasks] = useState<CreatedSubtask[]>([])
  const [error, setError] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [subtaskAssignments, setSubtaskAssignments] = useState<Record<number, string>>({})

  // Automatically start analyzing when modal opens
  useEffect(() => {
    if (isOpen && step === "analyzing") {
      handleAnalyzeTask()
    }
  }, [isOpen])

  // Fetch project members for reassignment dropdown
  const fetchProjectMembers = async (projId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/projects/${projId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success && data.project?.members) {
        const members = data.project.members.map((m: any) => ({
          id: m.id || m._id,
          name: m.name,
          email: m.email,
        }))
        setProjectMembers(members)
      }
    } catch (error) {
      // Silently fail - not critical for task division
    }
  }

  const handleAnalyzeTask = async () => {
    setError(null)
    setStep("analyzing")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/ai/divide-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ taskId }),
      })

      const data = await response.json()

      if (data.success && data.subtasks) {
        // Transform subtasks to include creation status
        const transformedSubtasks = data.subtasks.map((st: SubTask) => ({
          ...st,
          isCreated: false,
          isCreating: false,
        }))
        setSubtasks(transformedSubtasks)
        setProjectId(data.project?.id || null)

        // Initialize assignments with AI suggestions
        const initialAssignments: Record<number, string> = {}
        data.subtasks.forEach((subtask: SubTask, index: number) => {
          initialAssignments[index] = subtask.assignedTo
        })
        setSubtaskAssignments(initialAssignments)

        // Fetch project members for reassignment
        if (data.project?.id) {
          fetchProjectMembers(data.project.id)
        }

        setStep("review")
      } else {
        setError(data.error || "Failed to divide task")
        setStep("review")
      }
    } catch (error) {
      setError("Failed to divide task. Please try again.")
      setStep("review")
    }
  }

  const handleAssignSingleSubtask = async (index: number) => {
    if (!projectId) {
      setError("Project ID not found. Please try again.")
      return
    }

    const subtask = subtasks[index]

    // Mark as creating
    setSubtasks((prev) =>
      prev.map((st, i) => (i === index ? { ...st, isCreating: true } : st))
    )
    setError(null)

    try {
      const token = localStorage.getItem("token")

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          title: subtask.title,
          description: subtask.description,
          assignedToId: subtaskAssignments[index] || subtask.assignedTo,
          priority: subtask.priority,
          status: "Todo",
          projectId: projectId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Mark as created
        setSubtasks((prev) =>
          prev.map((st, i) => (i === index ? { ...st, isCreated: true, isCreating: false } : st))
        )
        toast.success(`Assigned subtask: ${subtask.title}`)

        // Check if all subtasks are created
        const allCreated = subtasks.every((st, i) => i === index || st.isCreated)
        if (allCreated) {
          setTimeout(() => {
            handleClose()
            onSuccess?.()
          }, 1500)
        }
      } else {
        setSubtasks((prev) =>
          prev.map((st, i) => (i === index ? { ...st, isCreating: false } : st))
        )
        setError(data.error || `Failed to assign subtask: ${subtask.title}`)
      }
    } catch (error) {
      setSubtasks((prev) =>
        prev.map((st, i) => (i === index ? { ...st, isCreating: false } : st))
      )
      setError(`Failed to assign subtask: ${subtask.title}. Please try again.`)
    }
  }

  const handleConfirmSubtasks = async () => {
    if (!projectId) {
      setError("Project ID not found. Please try again.")
      return
    }

    setStep("creating")
    setError(null)

    try {
      const token = localStorage.getItem("token")

      // Create all subtasks with custom assignments
      const createPromises = subtasks.map((subtask, index) =>
        fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            title: subtask.title,
            description: subtask.description,
            assignedToId: subtaskAssignments[index] || subtask.assignedTo,
            priority: subtask.priority,
            status: "Todo",
            projectId: projectId,
          }),
        })
      )

      const responses = await Promise.all(createPromises)
      const results = await Promise.all(responses.map((r) => r.json()))

      const failedTasks = results.filter((r) => !r.success)
      if (failedTasks.length > 0) {
        setError(`Failed to create ${failedTasks.length} subtask(s)`)
        setStep("review")
        return
      }

      setStep("success")
      toast.success(`Created ${subtasks.length} subtasks successfully`)
      setTimeout(() => {
        handleClose()
        onSuccess?.()
      }, 2000)
    } catch (error) {
      setError("Failed to create subtasks. Please try again.")
      setStep("review")
    }
  }

  const handleClose = () => {
    setStep("analyzing")
    setSubtasks([])
    setError(null)
    setProjectId(null)
    onClose()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
      case "Medium":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
      case "Low":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
      default:
        return "text-muted-foreground bg-muted"
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-blue-600 dark:text-blue-400"
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-orange-600 dark:text-orange-400"
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} >
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        {step === "analyzing" && (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Analyzing Task</DialogTitle>
            </DialogHeader>
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 animate-pulse">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Analyzing Task...</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                AI is dividing "{taskTitle}" and matching team members based on their skills
              </p>
            </div>
          </>
        )}

        {step === "review" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Zap className="w-5 h-5 text-primary" />
                Review Divided Tasks
              </DialogTitle>
              <DialogDescription className="text-sm">
                <span className="font-medium text-foreground">{taskTitle}</span> → divided into {subtasks.length}{" "}
                subtasks in <span className="font-medium text-primary">{projectName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {subtasks.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {subtasks.map((subtask, index) => (
                      <Card key={index} className="hover:shadow-lg transition-all border-l-4 border-l-primary/40 hover:border-l-primary">
                        <CardContent className="pt-5 pb-5 px-5">
                          <div className="space-y-4">
                            {/* Header: Title + Match Score */}
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-semibold text-base text-foreground leading-tight flex-1">
                                {subtask.title}
                              </h4>
                              <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${getMatchScoreColor(subtask.matchScore)} bg-opacity-10`}
                              >
                                <TrendingUp className="w-4 h-4" />
                                {subtask.matchScore}%
                              </div>
                            </div>

                            {/* Assigned To with Reassign Dropdown & Priority */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground mb-1.5 block">Assign To</label>
                                <Select
                                  value={subtaskAssignments[index] || subtask.assignedTo}
                                  onValueChange={(value) => {
                                    setSubtaskAssignments((prev) => ({
                                      ...prev,
                                      [index]: value,
                                    }))
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {projectMembers.map((member) => (
                                      <SelectItem key={member.id} value={member.id}>
                                        {member.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="pt-5">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(subtask.priority)}`}>
                                  {subtask.priority}
                                </span>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground leading-relaxed">{subtask.description}</p>

                            {/* Reasoning */}
                            <div className="pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Match Reasoning: </span>
                                {subtask.reasoning}
                              </p>
                            </div>

                            {/* Assign Button */}
                            <div className="pt-3">
                              {subtask.isCreated ? (
                                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-green-100/20 text-green-700 dark:text-green-400">
                                  <UserCheck className="w-4 h-4" />
                                  <span className="text-sm font-medium">Assigned</span>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => handleAssignSingleSubtask(index)}
                                  disabled={subtask.isCreating}
                                  className="w-full bg-primary hover:bg-primary/90"
                                  size="sm"
                                >
                                  {subtask.isCreating ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Assigning...
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Assign Now
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-border">
                    <Button variant="outline" onClick={handleClose} className="h-10">
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmSubtasks} className="bg-primary hover:bg-primary/90 h-10">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create {subtasks.length} Subtasks
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No subtasks generated</p>
                  <Button onClick={handleAnalyzeTask} variant="outline" size="sm" className="mt-4">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {step === "creating" && (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Creating Subtasks</DialogTitle>
            </DialogHeader>
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 animate-pulse">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Creating Subtasks...</h3>
              <p className="text-sm text-muted-foreground">Assigning {subtasks.length} tasks to team members</p>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Success</DialogTitle>
            </DialogHeader>
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10 flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Tasks Created Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                {subtasks.length} subtasks have been assigned to team members
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
