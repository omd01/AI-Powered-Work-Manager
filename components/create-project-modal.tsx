"use client"

import type React from "react"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrganization } from "@/lib/organization-context"

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { currentOrganization, getOrganizationMembers } = useOrganization()
  const members = getOrganizationMembers(currentOrganization.id)

  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    lead: "",
    priority: "Medium",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.projectName.trim()) {
      newErrors.projectName = "Project name is required"
    }
    if (!formData.description.trim()) {
      newErrors.description = "Project description is required"
    }
    if (!formData.lead) {
      newErrors.lead = "Project lead is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      console.log("[v0] Project created:", formData)
      // Reset form
      setFormData({
        projectName: "",
        description: "",
        lead: "",
        priority: "Medium",
      })
      setErrors({})
      onClose()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Create New Project</CardTitle>
              <CardDescription className="mt-1">Add a new project to {currentOrganization.name}</CardDescription>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg hover:bg-muted p-1 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="projectName" className="text-sm font-medium text-foreground block">
                Project Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="projectName"
                name="projectName"
                placeholder="Enter project name"
                value={formData.projectName}
                onChange={handleInputChange}
                className={errors.projectName ? "border-destructive" : ""}
                aria-invalid={!!errors.projectName}
              />
              {errors.projectName && <p className="text-xs text-destructive mt-1">{errors.projectName}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground block">
                Project Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe your project..."
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none ${
                  errors.description ? "border-destructive" : ""
                }`}
                aria-invalid={!!errors.description}
              />
              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
            </div>

            {/* Project Lead Dropdown */}
            <div className="space-y-2">
              <label htmlFor="lead" className="text-sm font-medium text-foreground block">
                Project Lead <span className="text-destructive">*</span>
              </label>
              <select
                id="lead"
                name="lead"
                value={formData.lead}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer ${
                  errors.lead ? "border-destructive" : ""
                }`}
                aria-invalid={!!errors.lead}
              >
                <option value="">Select a project lead</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
              {errors.lead && <p className="text-xs text-destructive mt-1">{errors.lead}</p>}
            </div>

            {/* Priority Selection */}
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium text-foreground block">
                Priority Level
              </label>
              <div className="flex gap-3">
                {["Low", "Medium", "High"].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        priority,
                      }))
                    }
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all border ${
                      formData.priority === priority
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-input border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
