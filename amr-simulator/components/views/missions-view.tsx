"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Route, Edit, Trash2, Clock, ArrowRight } from "lucide-react"
import type { Mission } from "@/lib/store"

export function MissionsView() {
  const { activeScenario, addMissionToScenario, updateMissionInScenario, removeMissionFromScenario } = useAppStore()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    priority: 1,
    sla: 30,
    steps: [{ stationId: "", action: "pickup" as const, duration: 30 }],
  })

  const resetForm = () => {
    setFormData({
      name: "",
      priority: 1,
      sla: 30,
      steps: [{ stationId: "", action: "pickup" as const, duration: 30 }],
    })
  }

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { stationId: "", action: "pickup", duration: 30 }],
    })
  }

  const removeStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    })
  }

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setFormData({ ...formData, steps: newSteps })
  }

  const handleCreateMission = () => {
    if (!activeScenario || !formData.name || formData.steps.length === 0) return

    const newMission: Mission = {
      id: `mission-${Date.now()}`,
      name: formData.name,
      priority: formData.priority,
      sla: formData.sla,
      steps: formData.steps.filter((step) => step.stationId),
    }

    addMissionToScenario(activeScenario.id, newMission)
    resetForm()
    setIsCreateDialogOpen(false)
  }

  const handleEditMission = (mission: Mission) => {
    setEditingMission(mission)
    setFormData({
      name: mission.name,
      priority: mission.priority,
      sla: mission.sla,
      steps: mission.steps,
    })
  }

  const handleUpdateMission = () => {
    if (!activeScenario || !editingMission) return

    const updates = {
      name: formData.name,
      priority: formData.priority,
      sla: formData.sla,
      steps: formData.steps.filter((step) => step.stationId),
    }

    updateMissionInScenario(activeScenario.id, editingMission.id, updates)
    setEditingMission(null)
    resetForm()
  }

  const handleDeleteMission = (missionId: string) => {
    if (!activeScenario) return
    removeMissionFromScenario(activeScenario.id, missionId)
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "bg-red-100 text-red-800"
    if (priority === 2) return "bg-orange-100 text-orange-800"
    return "bg-green-100 text-green-800"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return "High"
    if (priority === 2) return "Medium"
    return "Low"
  }

  const getStationName = (stationId: string) => {
    const station = activeScenario?.stations.find((s) => s.id === stationId)
    return station?.name || "Unknown Station"
  }

  if (!activeScenario) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-8 text-center">
            <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Scenario Selected</h2>
            <p className="text-muted-foreground">Select a scenario to manage its missions</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mission Management</h1>
            <p className="text-muted-foreground">Define mission workflows for {activeScenario.name}</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Mission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Mission</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="mission-name">Mission Name</Label>
                    <Input
                      id="mission-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Parts to Assembly Line"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority.toString()}
                      onValueChange={(value) => setFormData({ ...formData, priority: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">High (1)</SelectItem>
                        <SelectItem value="2">Medium (2)</SelectItem>
                        <SelectItem value="3">Low (3)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sla">SLA (minutes)</Label>
                  <Input
                    id="sla"
                    type="number"
                    value={formData.sla}
                    onChange={(e) => setFormData({ ...formData, sla: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Mission Steps</Label>
                    <Button variant="outline" size="sm" onClick={addStep}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Step
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <Select
                            value={step.stationId}
                            onValueChange={(value) => updateStep(index, "stationId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select station" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeScenario.stations.map((station) => (
                                <SelectItem key={station.id} value={station.id}>
                                  {station.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={step.action} onValueChange={(value) => updateStep(index, "action", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pickup">Pickup</SelectItem>
                              <SelectItem value="dropoff">Dropoff</SelectItem>
                              <SelectItem value="charge">Charge</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            value={step.duration}
                            onChange={(e) => updateStep(index, "duration", Number.parseInt(e.target.value))}
                            placeholder="Duration (s)"
                          />
                        </div>

                        {formData.steps.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateMission} className="flex-1">
                    Create Mission
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeScenario.missions.map((mission) => (
            <Card key={mission.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{mission.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getPriorityColor(mission.priority)}>
                        {getPriorityLabel(mission.priority)} Priority
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {mission.sla}min SLA
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditMission(mission)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteMission(mission.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Mission Flow</h4>
                    <div className="space-y-2">
                      {mission.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <span className="font-medium">{step.action}</span>
                          <span className="text-muted-foreground">at</span>
                          <span>{getStationName(step.stationId)}</span>
                          <span className="text-muted-foreground">({step.duration}s)</span>
                          {index < mission.steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Duration:</span>
                      <span className="font-medium">
                        {mission.steps.reduce((sum, step) => sum + step.duration, 0)}s
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Mission Dialog */}
        <Dialog open={!!editingMission} onOpenChange={() => setEditingMission(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Mission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="edit-mission-name">Mission Name</Label>
                  <Input
                    id="edit-mission-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={formData.priority.toString()}
                    onValueChange={(value) => setFormData({ ...formData, priority: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">High (1)</SelectItem>
                      <SelectItem value="2">Medium (2)</SelectItem>
                      <SelectItem value="3">Low (3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-sla">SLA (minutes)</Label>
                <Input
                  id="edit-sla"
                  type="number"
                  value={formData.sla}
                  onChange={(e) => setFormData({ ...formData, sla: Number.parseInt(e.target.value) })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Mission Steps</Label>
                  <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Select value={step.stationId} onValueChange={(value) => updateStep(index, "stationId", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select station" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeScenario.stations.map((station) => (
                              <SelectItem key={station.id} value={station.id}>
                                {station.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={step.action} onValueChange={(value) => updateStep(index, "action", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pickup">Pickup</SelectItem>
                            <SelectItem value="dropoff">Dropoff</SelectItem>
                            <SelectItem value="charge">Charge</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          value={step.duration}
                          onChange={(e) => updateStep(index, "duration", Number.parseInt(e.target.value))}
                          placeholder="Duration (s)"
                        />
                      </div>

                      {formData.steps.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateMission} className="flex-1">
                  Update Mission
                </Button>
                <Button variant="outline" onClick={() => setEditingMission(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
