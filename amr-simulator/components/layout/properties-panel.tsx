"use client"

import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit } from "lucide-react"

export function PropertiesPanel() {
  const { selectedRobot, selectedStation, activeScenario } = useAppStore()

  return (
    <div className="w-80 bg-card border-l border-border p-4 overflow-y-auto">
      <div className="space-y-4">
        {selectedStation && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Station Properties</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="station-name" className="text-xs text-muted-foreground">
                  Name
                </Label>
                <Input id="station-name" value={selectedStation.name} className="mt-1" placeholder="Station name" />
              </div>

              <div>
                <Label htmlFor="station-type" className="text-xs text-muted-foreground">
                  Type
                </Label>
                <Select value={selectedStation.type}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="dropoff">Dropoff</SelectItem>
                    <SelectItem value="workstation">Workstation</SelectItem>
                    <SelectItem value="charger">Charger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="pos-x" className="text-xs text-muted-foreground">
                    X Position
                  </Label>
                  <Input id="pos-x" type="number" value={selectedStation.position.x.toFixed(1)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="pos-y" className="text-xs text-muted-foreground">
                    Y Position
                  </Label>
                  <Input id="pos-y" type="number" value={selectedStation.position.y.toFixed(1)} className="mt-1" />
                </div>
              </div>

              {selectedStation.capacity && (
                <div>
                  <Label htmlFor="capacity" className="text-xs text-muted-foreground">
                    Capacity
                  </Label>
                  <Input id="capacity" type="number" value={selectedStation.capacity} className="mt-1" />
                </div>
              )}

              <div className="pt-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedStation.type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedRobot && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Robot Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Name:</span>
                <p className="text-sm font-medium">{selectedRobot.name}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Type:</span>
                <Badge variant="secondary" className="ml-2">
                  {selectedRobot.type}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Speed:</span>
                <p className="text-sm">{selectedRobot.speed} m/s</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Payload:</span>
                <p className="text-sm">{selectedRobot.payload} kg</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Battery:</span>
                <p className="text-sm">{selectedRobot.batteryCapacity} Wh</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeScenario && !selectedStation && !selectedRobot && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scenario Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-lg font-bold">{activeScenario.stations.length}</div>
                  <div className="text-xs text-muted-foreground">Stations</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-lg font-bold">{activeScenario.robots.length}</div>
                  <div className="text-xs text-muted-foreground">Robot Types</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-lg font-bold">{activeScenario.missions.length}</div>
                  <div className="text-xs text-muted-foreground">Missions</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-lg font-bold">{activeScenario.parameters.fleetSize}</div>
                  <div className="text-xs text-muted-foreground">Fleet Size</div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-muted-foreground">Shift Hours:</span>
                  <p className="text-sm">{activeScenario.parameters.shiftHours}h</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Charging Policy:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {activeScenario.parameters.chargingPolicy}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Speed Limit:</span>
                  <p className="text-sm">{activeScenario.parameters.speedLimit} m/s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedStation && !selectedRobot && !activeScenario && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Select an element to view its properties</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
