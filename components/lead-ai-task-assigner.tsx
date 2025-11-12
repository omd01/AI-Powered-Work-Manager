"use client"

import { useState } from "react"
import { Zap, ArrowRight, Sparkles, CheckCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface LeadAITaskAssignerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface AnalyzedTask {
  projectId: string
  projectName: string
  memberId: string
  memberName: string
  taskTitle: string
  taskDescription: string
  priority: "High" | "Medium" | "Low"
  matchScore?: number
  reasoning?: string
}

export default function LeadAITaskAssigner({ isOpen, onClose, onSuccess }: LeadAITaskAssignerProps) {
  const [step, setStep] = useState<"input" | "review" | "success">("input")
  const [userInput, setUserInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzedTask, setAnalyzedTask] = useState<AnalyzedTask | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editable task fields
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium")

  const handleAnalyze = async () => {
    if (!userInput.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/ai/generate-task-for-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ prompt: userInput }),
      })

      const data = await response.json()

      if (data.success && data.task) {
        const task = data.task
        setAnalyzedTask(task)
        setTaskTitle(task.taskTitle)
        setTaskDescription(task.taskDescription)
        setPriority(task.priority)
        setStep("review")
      } else {
        setError(data.error || "Failed to generate task")
        toast.error(data.error || "Failed to generate task")
      }
    } catch (error) {
      setError("Failed to generate task. Please try again.")
      toast.error("Failed to generate task. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAssignTask = async () => {
    if (!analyzedTask) return

    setIsAssigning(true)
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
          title: taskTitle,
          description: taskDescription,
          projectId: analyzedTask.projectId,
          assignedToId: analyzedTask.memberId,
          priority: priority,
          status: "Todo",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStep("success")
        toast.success(`Task assigned to ${analyzedTask.memberName}`)
        setTimeout(() => {
          handleClose()
          onSuccess?.()
        }, 2000)
      } else {
        setError(data.error || "Failed to assign task")
        toast.error(data.error || "Failed to assign task")
      }
    } catch (error) {
      setError("Failed to assign task. Please try again.")
      toast.error("Failed to assign task. Please try again.")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleClose = () => {
    setStep("input")
    setUserInput("")
    setAnalyzedTask(null)
    setTaskTitle("")
    setTaskDescription("")
    setPriority("Medium")
    setError(null)
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Zap className="w-5 h-5 text-primary" />
                AI Task Assigner
              </DialogTitle>
              <DialogDescription>
                Describe what you need done, and AI will create a task and assign it to the best team member
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Input Field */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  What task needs to be done?
                </label>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Example: Create a login page with email and password validation, add forgot password link"
                  className="min-h-[100px] text-base resize-none focus-visible:ring-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      handleAnalyze()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Press {typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Enter or click below
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !userInput.trim()}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Task with AI
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "review" && analyzedTask && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ArrowRight className="w-5 h-5 text-primary" />
                Review & Assign Task
              </DialogTitle>
              <DialogDescription>
                AI analyzed your request and prepared a task for{" "}
                <span className="font-semibold text-foreground">{analyzedTask.memberName}</span> in{" "}
                <span className="font-semibold text-primary">{analyzedTask.projectName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Match Score */}
              {analyzedTask.matchScore && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Skill Match Score</span>
                  </div>
                  <span className={`text-lg font-bold ${getMatchScoreColor(analyzedTask.matchScore)}`}>
                    {analyzedTask.matchScore}%
                  </span>
                </div>
              )}

              {/* AI Reasoning */}
              {analyzedTask.reasoning && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">AI Reasoning: </span>
                    {analyzedTask.reasoning}
                  </p>
                </div>
              )}

              {/* Task Title */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Task Title</label>
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="text-base"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Task Description</label>
                <Textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  className="min-h-[120px] text-base resize-none"
                />
              </div>

              {/* Priority Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Priority</label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor("High")}`}>
                        High
                      </span>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor("Medium")}`}>
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="Low">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor("Low")}`}>
                        Low
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAssignTask} disabled={isAssigning} className="flex-1 bg-primary hover:bg-primary/90">
                  {isAssigning ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Assign Task
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "success" && analyzedTask && (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Success</DialogTitle>
            </DialogHeader>
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10 flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Task Assigned Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                The task has been assigned to {analyzedTask?.memberName}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
