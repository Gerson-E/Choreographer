"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Bot, Edit, Trash2, Zap, Weight, Battery, Ruler } from "lucide-react"
import type { Robot } from "@/lib/store"

export function RobotLibraryView() {
  const { activeScenario, addRobotToScenario, updateRobotInScenario, removeRobotFromScenario, setSelectedRobot } =
    useAppStore()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    speed: 1.0,
    payload: 100,
    batteryCapacity: 5000,
    footprintWidth: 0.8,
    footprintHeight: 1.2,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      speed: 1.0,
      payload: 100,
      batteryCapacity: 5000,
      footprintWidth: 0.8,
      footprintHeight: 1.2,
    })
  }

  const handleCreateRobot = () => {
    if (!activeScenario || !formData.name || !formData.type) return

    const newRobot: Robot = {
      id: `robot-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      speed: formData.speed,
      payload: formData.payload,
      batteryCapacity: formData.batteryCapacity,
      footprint: {
        width: formData.footprintWidth,
        height: formData.footprintHeight,
      },
    }

    addRobotToScenario(activeScenario.id, newRobot)
    resetForm()
    setIsCreateDialogOpen(false)
  }

  const handleEditRobot = (robot: Robot) => {
    setEditingRobot(robot)
    setFormData({
      name: robot.name,
      type: robot.type,
      speed: robot.speed,
      payload: robot.payload,
      batteryCapacity: robot.batteryCapacity,
      footprintWidth: robot.footprint.width,
      footprintHeight: robot.footprint.height,
    })
  }

  const handleUpdateRobot = () => {
    if (!activeScenario || !editingRobot) return

    const updates = {
      name: formData.name,
      type: formData.type,
      speed: formData.speed,
      payload: formData.payload,
      batteryCapacity: formData.batteryCapacity,
      footprint: {
        width: formData.footprintWidth,
        height: formData.footprintHeight,
      },
    }

    updateRobotInScenario(activeScenario.id, editingRobot.id, updates)
    setEditingRobot(null)
    resetForm()
  }

  const handleDeleteRobot = (robotId: string) => {
    if (!activeScenario) return
    removeRobotFromScenario(activeScenario.id, robotId)
  }

  const getRobotTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Light Duty": "bg-blue-100 text-blue-800",
      "Medium Duty": "bg-green-100 text-green-800",
      "Heavy Duty": "bg-red-100 text-red-800",
      "High Speed": "bg-purple-100 text-purple-800",
      Precision: "bg-orange-100 text-orange-800",
      Compact: "bg-teal-100 text-teal-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  if (!activeScenario) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-8 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Scenario Selected</h2>
            <p className="text-muted-foreground">Select a scenario to manage its robot library</p>
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
            <h1 className="text-2xl font-bold text-foreground">Robot Library</h1>
            <p className="text-muted-foreground">Manage robot types for {activeScenario.name}</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Robot Type
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Robot Type</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Robot Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Heavy Forklift AGV"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type Category</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g., Heavy Duty"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="speed">Speed (m/s)</Label>
                    <Input
                      id="speed"
                      type="number"
                      step="0.1"
                      value={formData.speed}
                      onChange={(e) => setFormData({ ...formData, speed: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payload">Payload (kg)</Label>
                    <Input
                      id="payload"
                      type="number"
                      value={formData.payload}
                      onChange={(e) => setFormData({ ...formData, payload: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="battery">Battery Capacity (Wh)</Label>
                  <Input
                    id="battery"
                    type="number"
                    value={formData.batteryCapacity}
                    onChange={(e) => setFormData({ ...formData, batteryCapacity: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="width">Width (m)</Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.1"
                      value={formData.footprintWidth}
                      onChange={(e) => setFormData({ ...formData, footprintWidth: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Length (m)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={formData.footprintHeight}
                      onChange={(e) => setFormData({ ...formData, footprintHeight: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateRobot} className="flex-1">
                    Create Robot
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeScenario.robots.map((robot) => (
            <Card
              key={robot.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedRobot(robot)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{robot.name}</CardTitle>
                    <Badge className={`mt-2 ${getRobotTypeColor(robot.type)}`}>{robot.type}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditRobot(robot)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteRobot(robot.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>{robot.speed} m/s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      <span>{robot.payload} kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-muted-foreground" />
                      <span>{robot.batteryCapacity} Wh</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {robot.footprint.width}×{robot.footprint.height}m
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Robot Dialog */}
        <Dialog open={!!editingRobot} onOpenChange={() => setEditingRobot(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Robot Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Robot Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type Category</Label>
                <Input
                  id="edit-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-speed">Speed (m/s)</Label>
                  <Input
                    id="edit-speed"
                    type="number"
                    step="0.1"
                    value={formData.speed}
                    onChange={(e) => setFormData({ ...formData, speed: Number.parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-payload">Payload (kg)</Label>
                  <Input
                    id="edit-payload"
                    type="number"
                    value={formData.payload}
                    onChange={(e) => setFormData({ ...formData, payload: Number.parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-battery">Battery Capacity (Wh)</Label>
                <Input
                  id="edit-battery"
                  type="number"
                  value={formData.batteryCapacity}
                  onChange={(e) => setFormData({ ...formData, batteryCapacity: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-width">Width (m)</Label>
                  <Input
                    id="edit-width"
                    type="number"
                    step="0.1"
                    value={formData.footprintWidth}
                    onChange={(e) => setFormData({ ...formData, footprintWidth: Number.parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-height">Length (m)</Label>
                  <Input
                    id="edit-height"
                    type="number"
                    step="0.1"
                    value={formData.footprintHeight}
                    onChange={(e) => setFormData({ ...formData, footprintHeight: Number.parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateRobot} className="flex-1">
                  Update Robot
                </Button>
                <Button variant="outline" onClick={() => setEditingRobot(null)}>
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
