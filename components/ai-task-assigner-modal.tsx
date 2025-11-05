"use client"

import { useState } from "react"
import { X, Zap, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AITaskAssignerModalProps {
  isOpen: boolean
  onClose: () => void
}

// Mock team members for the Lead
const TEAM_MEMBERS = [
  { id: "member-4", name: "Emma Wilson", skills: ["Frontend Development", "React", "CSS"] },
  { id: "member-5", name: "James Park", skills: ["Mobile Development", "React Native", "iOS"] },
  { id: "member-6", name: "David Kim", skills: ["Backend Development", "Node.js", "AWS"] },
]

interface AIGeneratedTask {
  id: string
  title: string
  description: string
  assignedTo: string
  priority: "High" | "Medium" | "Low" | "Critical"
  dueDate: string
  skills: string[]
}

export default function AITaskAssignerModal({ isOpen, onClose }: AITaskAssignerModalProps) {
  const [projectGoal, setProjectGoal] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState<AIGeneratedTask[]>([])
  const [showReview, setShowReview] = useState(false)

  const handleGenerate = () => {
    if (!projectGoal.trim()) return

    setIsGenerating(true)
    // Simulate AI processing
    setTimeout(() => {
      // Mock AI-generated tasks based on the prompt
      const mockTasks: AIGeneratedTask[] = [
        {
          id: "ai-1",
          title: "Create login page UI",
          description: "Design and implement the login page with email/password fields",
          assignedTo: "member-4", // Emma Wilson (Frontend)
          priority: "Critical",
          dueDate: "2025-12-15",
          skills: ["Frontend Development", "React"],
        },
        {
          id: "ai-2",
          title: "Connect login to seller API",
          description: "Integrate login endpoint with backend seller API and handle authentication",
          assignedTo: "member-6", // David Kim (Backend)
          priority: "Critical",
          dueDate: "2025-12-16",
          skills: ["Backend Development", "Node.js"],
        },
        {
          id: "ai-3",
          title: "Add form validation",
          description: "Implement client-side validation for login form fields",
          assignedTo: "member-4", // Emma Wilson
          priority: "High",
          dueDate: "2025-12-15",
          skills: ["Frontend Development", "React"],
        },
      ]

      setGeneratedTasks(mockTasks)
      setIsGenerating(false)
      setShowReview(true)
    }, 2000)
  }

  const handleAssignChange = (taskId: string, newAssignee: string) => {
    setGeneratedTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, assignedTo: newAssignee } : task)),
    )
  }

  const handleConfirmAssignments = () => {
    // Here you would save the tasks to the backend
    console.log("Assigning tasks:", generatedTasks)
    alert("Tasks assigned successfully!")
    onClose()
    // Reset
    setProjectGoal("")
    setGeneratedTasks([])
    setShowReview(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Zap className="w-6 h-6 text-primary" />
            AI Task Assigner
          </DialogTitle>
          <DialogDescription>
            Describe what you need in natural language. AI will break it down into tasks and assign them to your team
            members based on their skills and availability.
          </DialogDescription>
        </DialogHeader>

        {!showReview ? (
          <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Project Goal or Task Description
                </label>
                <Textarea
                  placeholder='Example: "Create the login page and connect to the seller API, make it urgent."'
                  value={projectGoal}
                  onChange={(e) => setProjectGoal(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Be specific about what needs to be done. AI will analyze your team's skills and create optimized
                  assignments.
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!projectGoal.trim() || isGenerating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isGenerating ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-pulse" />
                    AI is analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Tasks & Assignments
                  </>
                )}
              </Button>
            </div>

            {/* AI Info Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  How AI Task Assignment Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                    <span>AI breaks down your goal into specific, actionable tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                    <span>Analyzes team members' skills and current workload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                    <span>Assigns tasks to the most suitable team members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                    <span>You review and adjust assignments before confirming</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Review Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Review AI-Generated Tasks</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Review the tasks and assignments. You can modify assignments before confirming.
              </p>

              <div className="space-y-4">
                {generatedTasks.map((task) => (
                  <Card key={task.id} className="border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{task.title}</CardTitle>
                          <CardDescription className="mt-1">{task.description}</CardDescription>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            task.priority === "Critical"
                              ? "bg-destructive/20 text-destructive"
                              : "bg-orange-100/20 text-orange-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Assign To
                          </label>
                          <Select value={task.assignedTo} onValueChange={(value) => handleAssignChange(task.id, value)}>
                            <SelectTrigger>
                              <SelectValue>
                                {TEAM_MEMBERS.find((m) => m.id === task.assignedTo)?.name || "Select member"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {TEAM_MEMBERS.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>{member.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
                          <input
                            type="date"
                            value={task.dueDate}
                            onChange={(e) =>
                              setGeneratedTasks((prev) =>
                                prev.map((t) => (t.id === task.id ? { ...t, dueDate: e.target.value } : t)),
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Required Skills</p>
                        <div className="flex gap-2 flex-wrap">
                          {task.skills.map((skill) => (
                            <span key={skill} className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowReview(false)}>
                Back to Edit
              </Button>
              <Button onClick={handleConfirmAssignments} className="bg-primary hover:bg-primary/90">
                Confirm Assignments
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

