"use client"

import { useState } from "react"
import { Plus, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function MySkillsView() {
  const [skills, setSkills] = useState<string[]>([
    "Frontend Development",
    "React",
    "CSS",
    "UI Design",
  ])
  const [newSkill, setNewSkill] = useState("")

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills((prev) => [...prev, newSkill.trim()])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  const handleSave = () => {
    console.log("Saving skills:", skills)
    alert("Skills saved! AI will use this information for task assignments.")
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">My Skills</h2>
        <p className="text-muted-foreground">
          Add your skills and expertise. The AI uses this to match you with the right tasks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skills & Expertise</CardTitle>
          <CardDescription>List all your skills, technologies, and areas of expertise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Skill */}
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Frontend, Database, UI Design, Python..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddSkill()
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleAddSkill} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Skills List */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              Your Skills ({skills.length})
            </p>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center gap-2 bg-secondary/20 text-secondary px-3 py-2 rounded-full"
                  >
                    <span className="text-sm font-medium">{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:bg-secondary/30 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills added yet. Add your first skill above.</p>
            )}
          </div>

          {/* Suggested Skills */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Suggested Skills</p>
            <div className="flex flex-wrap gap-2">
              {[
                "JavaScript",
                "TypeScript",
                "Node.js",
                "PostgreSQL",
                "AWS",
                "Docker",
                "Testing",
                "API Design",
                "GraphQL",
                "MongoDB",
              ]
                .filter((skill) => !skills.includes(skill))
                .map((skill) => (
                  <button
                    key={skill}
                    onClick={() => {
                      if (!skills.includes(skill)) {
                        setSkills((prev) => [...prev, skill])
                      }
                    }}
                    className="text-sm bg-muted/50 text-muted-foreground hover:bg-muted px-3 py-2 rounded-full transition-colors"
                  >
                    + {skill}
                  </button>
                ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Skills
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


