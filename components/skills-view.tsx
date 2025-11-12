"use client"

import { useState, useEffect } from "react"
import { Plus, X, RefreshCw, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"

export default function SkillsView() {
  const { user } = useAuth()
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Fetch user's skills
  const fetchSkills = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/skills", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setSkills(data.skills || [])
      } else {
        setError(data.error || "Failed to fetch skills")
      }
    } catch (error) {
      console.error("Error fetching skills:", error)
      setError("Failed to fetch skills")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSkills()
  }, [user])

  // Add new skill
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newSkill.trim()) {
      alert("Please enter a skill name")
      return
    }

    try {
      setIsAdding(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ skill: newSkill.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setSkills(data.skills)
        setNewSkill("")
      } else {
        alert(data.error || "Failed to add skill")
      }
    } catch (error) {
      console.error("Error adding skill:", error)
      alert("Failed to add skill")
    } finally {
      setIsAdding(false)
    }
  }

  // Remove skill
  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!confirm(`Are you sure you want to remove "${skillToRemove}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/skills?skill=${encodeURIComponent(skillToRemove)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setSkills(data.skills)
      } else {
        alert(data.error || "Failed to remove skill")
      }
    } catch (error) {
      console.error("Error removing skill:", error)
      alert("Failed to remove skill")
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading skills...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">My Skills</h2>
          <p className="text-muted-foreground">
            Manage your skills and expertise • {skills.length} skill{skills.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={fetchSkills} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Add Skill Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Skill
          </CardTitle>
          <CardDescription>
            Add a skill to your profile. This helps with task assignment and team collaboration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSkill} className="flex gap-2">
            <Input
              placeholder="e.g., JavaScript, Project Management, UI/UX Design..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              disabled={isAdding}
              className="flex-1"
            />
            <Button type="submit" disabled={isAdding || !newSkill.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              {isAdding ? "Adding..." : "Add Skill"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Your Skills
          </CardTitle>
          <CardDescription>
            {skills.length > 0
              ? "Click the X button to remove a skill from your profile."
              : "You haven't added any skills yet. Add your first skill above!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/30 hover:bg-primary/20 transition-colors group"
                >
                  <span className="font-medium">{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="w-5 h-5 rounded-full bg-primary/20 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No skills added yet</p>
              <p className="text-sm mt-1">Start by adding your first skill above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
