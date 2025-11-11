"use client"

import { useState } from "react"
import { Zap, ArrowRight, Sparkles, Send } from "lucide-react"
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
  project: { id: string; name: string }
  lead: { id: string; name: string }
  taskTitle: string
  taskDescription: string
  priority: "High" | "Medium" | "Low"
}

// Mock data for projects and leads
const MOCK_PROJECTS = [
  { id: "proj-1", name: "LinksUs", description: "B2B platform for link management", leadId: "lead-1" },
  { id: "proj-2", name: "Mobile App MVP", description: "Mobile application for iOS and Android", leadId: "lead-2" },
  { id: "proj-3", name: "Website Redesign", description: "Company website redesign project", leadId: "lead-1" },
]

const MOCK_LEADS = [
  { id: "lead-1", name: "Sarah Chen" },
  { id: "lead-2", name: "Marcus Johnson" },
]

export default function AdminAITaskAssignerSleek({ isOpen, onClose }: AdminAITaskAssignerSleekProps) {
  const [step, setStep] = useState<"input" | "review">("input")
  const [userInput, setUserInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzedTask, setAnalyzedTask] = useState<AnalyzedTask | null>(null)
  const [chatInput, setChatInput] = useState("")

  // Editable task fields
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium")

  const handleAnalyze = () => {
    if (!userInput.trim()) return

    setIsAnalyzing(true)

    // Simulate AI analysis
    setTimeout(() => {
      // AI identifies the project from the input
      const matchedProject = MOCK_PROJECTS.find((p) =>
        userInput.toLowerCase().includes(p.name.toLowerCase()),
      ) || MOCK_PROJECTS[0]

      // AI identifies the lead for that project
      const assignedLead = MOCK_LEADS.find((l) => l.id === matchedProject.leadId) || MOCK_LEADS[0]

      // AI generates task title and description
      const generatedTitle = userInput.charAt(0).toUpperCase() + userInput.slice(1)
      const generatedDescription = `Per the Admin's request: "${userInput}"\n\nContext: This task is for the ${matchedProject.name} project. ${matchedProject.description}.\n\nPlease review and break this down into specific tasks for your team members.`

      // Check if "urgent" or "high priority" is mentioned
      const isUrgent = /urgent|asap|high priority|critical/i.test(userInput)

      const analyzed: AnalyzedTask = {
        project: { id: matchedProject.id, name: matchedProject.name },
        lead: { id: assignedLead.id, name: assignedLead.name },
        taskTitle: generatedTitle,
        taskDescription: generatedDescription,
        priority: isUrgent ? "High" : "Medium",
      }

      setAnalyzedTask(analyzed)
      setTaskTitle(analyzed.taskTitle)
      setTaskDescription(analyzed.taskDescription)
      setPriority(analyzed.priority)
      setIsAnalyzing(false)
      setStep("review")
    }, 2000)
  }

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return

    const input = chatInput.toLowerCase()

    // Parse natural language changes
    if (input.includes("high priority") || input.includes("urgent")) {
      setPriority("High")
    } else if (input.includes("low priority")) {
      setPriority("Low")
    } else if (input.includes("medium priority")) {
      setPriority("Medium")
    }

    // Add notes to description
    if (input.includes("add") || input.includes("note")) {
      const additionalNote = `\n\nAdditional Note: ${chatInput}`
      setTaskDescription((prev) => prev + additionalNote)
    }

    // Update title if requested
    if (input.includes("change title to") || input.includes("rename to")) {
      const titleMatch = chatInput.match(/(?:change title to|rename to)\s+"([^"]+)"/i)
      if (titleMatch) {
        setTaskTitle(titleMatch[1])
      }
    }

    setChatInput("")
  }

  const handleAssignTask = () => {
    // Here you would send the task to the backend
    console.log("Assigning task to lead:", {
      project: analyzedTask?.project,
      lead: analyzedTask?.lead,
      title: taskTitle,
      description: taskDescription,
      priority,
    })

    alert(`Task "${taskTitle}" assigned to ${analyzedTask?.lead.name}!`)
    handleClose()
  }

  const handleClose = () => {
    setStep("input")
    setUserInput("")
    setAnalyzedTask(null)
    setTaskTitle("")
    setTaskDescription("")
    setPriority("Medium")
    setChatInput("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Zap className="w-6 h-6 text-primary" />
                Assign a New Task
              </DialogTitle>
              <DialogDescription>
                Describe what needs to be done in natural language. AI will identify the right project and assign it to
                the appropriate Lead.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Single Text Input */}
              <div>
                <Textarea
                  placeholder='e.g., "update landing page of linksus" or "fix the mobile app login"'
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="min-h-[120px] text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      handleAnalyze()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Press Ctrl+Enter to analyze, or click the button below
                </p>
              </div>

              {/* AI Info Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">AI will automatically:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Identify the relevant project from your description</li>
                        <li>• Find the Lead responsible for that project</li>
                        <li>• Generate a clear task with context</li>
                        <li>• Let you review and adjust before assigning</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!userInput.trim() || isAnalyzing}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Analyze & Prepare Task
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "review" && analyzedTask && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="w-6 h-6 text-primary" />
                Review AI-Generated Task
              </DialogTitle>
              <DialogDescription>Review and adjust the task before assigning it to the Lead</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* AI Analysis Results (Non-editable) */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">AI Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Project:</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/20 text-secondary font-medium text-sm">
                        {analyzedTask.project.name}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Assigning to Lead:</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary font-medium text-sm">
                        {analyzedTask.lead.name}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Editable Task Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Task Title</label>
                  <Input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="text-base"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Priority</label>
                  <Select value={priority} onValueChange={(value: "High" | "Medium" | "Low") => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="min-h-[150px]"
                    placeholder="Task description with context"
                  />
                </div>
              </div>

              {/* Human-in-the-Loop Chat Box */}
              <Card className="border-accent/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Make quick changes with AI
                  </CardTitle>
                  <CardDescription className="text-xs">
                    e.g., "make this high priority and add a note to check the images"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Make a change..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleChatSubmit()
                        }
                      }}
                    />
                    <Button onClick={handleChatSubmit} size="icon" disabled={!chatInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Final Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleAssignTask} className="bg-primary hover:bg-primary/90">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Assign Task to Lead
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}