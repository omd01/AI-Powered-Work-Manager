"use client"

import { useState } from "react"
import { Zap, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useOrganization } from "@/lib/organization-context"

interface AdminAITaskAssignerModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AIGeneratedTask {
  id: string
  title: string
  description: string
  assignedTo: string
  priority: "High" | "Medium" | "Low" | "Critical"
  dueDate: string
  type: "project" | "task"
}

export default function AdminAITaskAssignerModal({ isOpen, onClose }: AdminAITaskAssignerModalProps) {
  const { currentOrganization, getOrganizationMembers } = useOrganization()
  const members = getOrganizationMembers(currentOrganization.id)
  
  // Filter to show only Leads and Admins
  const leads = members.filter((m) => m.role === "Lead" || m.role === "Admin")

  const [projectGoal, setProjectGoal] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState<AIGeneratedTask[]>([])
  const [showReview, setShowReview] = useState(false)

  const handleGenerate = () => {
    if (!projectGoal.trim()) return

    setIsGenerating(true)
    // Simulate AI processing
    setTimeout(() => {
      // Mock AI-generated high-level task/project based on the prompt
      const mockTasks: AIGeneratedTask[] = [
        {
          id: "ai-1",
          title: "Website Redesign Project",
          description: "Start a new website redesign project. Create project structure and assign Lead.",
          assignedTo: "member-2", // Marcus Johnson (Lead)
          priority: "High",
          dueDate: "2026-02-28",
          type: "project",
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
    // Here you would save the tasks/projects to the backend
    console.log("Assigning high-level tasks/projects:", generatedTasks)
    alert("High-level task/project assigned successfully!")
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
            AI Task Assigner (Admin)
          </DialogTitle>
          <DialogDescription>
            Describe a high-level task or project goal. AI will create a project or high-level task and assign it to a Lead.
          </DialogDescription>
        </DialogHeader>

        {!showReview ? (
          <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  High-Level Task or Project Goal
                </label>
                <Textarea
                  placeholder='Example: "Start a new website redesign project."'
                  value={projectGoal}
                  onChange={(e) => setProjectGoal(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Describe what you need at a high level. AI will create projects or high-level tasks and assign them to Leads.
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
                    Generate Project/Task & Assign to Lead
                  </>
                )}
              </Button>
            </div>

            {/* AI Info Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  How AI Task Assignment Works (Admin)
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                    <span>AI creates high-level tasks or new projects based on your description</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                    <span>Assigns them to Leads based on their expertise and current workload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                    <span>Leads will then break down the work and assign tasks to their team members</span>
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
              <h3 className="text-lg font-semibold mb-4">Review AI-Generated Projects/Tasks</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Review the high-level tasks or projects. You can modify Lead assignments before confirming.
              </p>

              <div className="space-y-4">
                {generatedTasks.map((task) => (
                  <Card key={task.id} className="border-primary/20">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground">{task.title}</h4>
                              <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                                {task.type === "project" ? "Project" : "High-Level Task"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
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

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Assign To Lead
                            </label>
                            <Select value={task.assignedTo} onValueChange={(value) => handleAssignChange(task.id, value)}>
                              <SelectTrigger>
                                <SelectValue>
                                  {leads.find((m) => m.id === task.assignedTo)?.name || "Select Lead"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {leads.map((lead) => (
                                  <SelectItem key={lead.id} value={lead.id}>
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4" />
                                      <span>{lead.name} ({lead.role})</span>
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
                Confirm Assignment
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

