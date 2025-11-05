"use client"

import { useState } from "react"
import { Calendar, Clock, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface TimeBlock {
  id: string
  title: string
  day: string
  startTime: string
  endTime: string
  type: "working" | "blocked"
}

export default function MyScheduleView() {
  const [workingHours, setWorkingHours] = useState({
    monday: { start: "09:00", end: "17:00", enabled: true },
    tuesday: { start: "09:00", end: "17:00", enabled: true },
    wednesday: { start: "09:00", end: "17:00", enabled: true },
    thursday: { start: "09:00", end: "17:00", enabled: true },
    friday: { start: "09:00", end: "17:00", enabled: true },
    saturday: { start: "09:00", end: "17:00", enabled: false },
    sunday: { start: "09:00", end: "17:00", enabled: false },
  })

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
    {
      id: "1",
      title: "Team Meeting",
      day: "monday",
      startTime: "10:00",
      endTime: "11:00",
      type: "blocked",
    },
  ])

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ]

  const handleWorkingHoursChange = (day: string, field: string, value: string | boolean) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      },
    }))
  }

  const handleSave = () => {
    console.log("Saving schedule:", { workingHours, timeBlocks })
    alert("Schedule saved! AI will use this information for task assignments.")
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          My Schedule
        </h2>
        <p className="text-muted-foreground">
          Set your working hours and block off time. The AI uses this to assign tasks accurately.
        </p>
      </div>

      <div className="space-y-6">
        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Working Hours
            </CardTitle>
            <CardDescription>Set your regular working hours for each day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {days.map((day) => (
                <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-24">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={workingHours[day.key as keyof typeof workingHours].enabled}
                        onChange={(e) => handleWorkingHoursChange(day.key, "enabled", e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-foreground">{day.label}</span>
                    </label>
                  </div>
                  {workingHours[day.key as keyof typeof workingHours].enabled && (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">From</span>
                        <Input
                          type="time"
                          value={workingHours[day.key as keyof typeof workingHours].start}
                          onChange={(e) => handleWorkingHoursChange(day.key, "start", e.target.value)}
                          className="w-32"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">to</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={workingHours[day.key as keyof typeof workingHours].end}
                          onChange={(e) => handleWorkingHoursChange(day.key, "end", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Blocks */}
        <Card>
          <CardHeader>
            <CardTitle>Blocked Time</CardTitle>
            <CardDescription>Block off specific times when you're unavailable</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeBlocks.length > 0 ? (
                timeBlocks.map((block) => (
                  <div key={block.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{block.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {block.day} • {block.startTime} - {block.endTime}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTimeBlocks((prev) => prev.filter((b) => b.id !== block.id))}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No blocked time slots. Click "Add Blocked Time" to add one.
                </p>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const newBlock: TimeBlock = {
                    id: Date.now().toString(),
                    title: "New Blocked Time",
                    day: "monday",
                    startTime: "10:00",
                    endTime: "11:00",
                    type: "blocked",
                  }
                  setTimeBlocks((prev) => [...prev, newBlock])
                }}
              >
                Add Blocked Time
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Save Schedule
          </Button>
        </div>
      </div>
    </div>
  )
}


