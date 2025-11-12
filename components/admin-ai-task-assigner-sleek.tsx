"use client"

import { useState } from "react"
import { Zap, ArrowRight, Sparkles, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AdminAITaskAssignerSleekProps {
  isOpen: boolean
  onClose: () => void
}

interface AnalyzedTask {
  projectId: string
  projectName: string
  leadId: string
  leadName: string
  taskTitle: string
  taskDescription: string
  priority: "High" | "Medium" | "Low"
  confidence?: number
  reasoning?: string
}

export default function AdminAITaskAssignerSleek({ isOpen, onClose }: AdminAITaskAssignerSleekProps) {
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
      const response = await fetch("/api/ai/generate-task", {
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
      }
    } catch (error) {
      console.error("Error generating task:", error)
      setError("Failed to generate task. Please try again.")
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
          assignedToId: analyzedTask.leadId,
          priority: priority,
          status: "Todo",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStep("success")
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        setError(data.error || "Failed to assign task")
      }
    } catch (error) {
      console.error("Error assigning task:", error)
      setError("Failed to assign task. Please try again.")
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="w-5 h-5 text-primary" />
                Assign a New Task with AI
              </DialogTitle>
              <DialogDescription className="text-sm">
                Describe what needs to be done. AI will identify the project and assign it to the right lead.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Minimalistic Input */}
              <div>
                <Textarea
                  placeholder='e.g., "create a landing page for the schedule app" or "fix the login bug in mobile app"'
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
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

              {/* Action Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!userInput.trim() || isAnalyzing}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Task
                  </>
                )}
              </Button>

              {/* Info Card - Minimalistic */}
              <Card className="border-muted bg-muted/30">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      AI will automatically identify the project, find the lead, generate a professional task
                      description, and let you review before assigning.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {step === "review" && analyzedTask && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CheckCircle className="w-5 h-5 text-primary" />
                Review & Assign
              </DialogTitle>
              <DialogDescription className="text-sm">Review the AI-generated task before assigning</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* AI Analysis - Minimalistic */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-medium text-foreground">{analyzedTask.projectName}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Lead:</span>
                    <span className="font-medium text-primary">{analyzedTask.leadName}</span>
                    {analyzedTask.confidence && (
                      <>
                        <span className="text-muted-foreground mx-1">•</span>
                        <span className="text-xs text-muted-foreground">
                          {analyzedTask.confidence}% confidence
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Editable Fields - Minimalistic */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Task Title</label>
                  <Input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="h-10"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                  <Select value={priority} onValueChange={(value: "High" | "Medium" | "Low") => setPriority(value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Medium">Medium Priority</SelectItem>
                      <SelectItem value="Low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="min-h-[120px] resize-none"
                    placeholder="Task description"
                  />
                </div>
              </div>

              {/* Action Buttons - Minimalistic */}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={handleClose} className="h-10">
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignTask}
                  disabled={isAssigning}
                  className="bg-primary hover:bg-primary/90 h-10"
                >
                  {isAssigning ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Assign to Lead
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Task Assigned Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              The task has been assigned to {analyzedTask?.leadName}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}