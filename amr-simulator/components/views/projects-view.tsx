"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  FolderOpen,
  Calendar,
  Users,
  Search,
  Filter,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  GitCompare,
} from "lucide-react"

export function ProjectsView() {
  const { scenarios, setActiveScenario, setCurrentView } = useAppStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [showCompareDialog, setShowCompareDialog] = useState(false)

  const handleOpenScenario = (scenario: any) => {
    setActiveScenario(scenario)
    setCurrentView("workspace")
  }

  const handleCompareScenarios = () => {
    if (selectedScenarios.length >= 2) {
      // Set the first selected scenario as active and navigate to analytics
      const firstScenario = scenarios.find((s) => s.id === selectedScenarios[0])
      if (firstScenario) {
        setActiveScenario(firstScenario)
        setCurrentView("analytics")
        setShowCompareDialog(false)
      }
    }
  }

  const toggleScenarioSelection = (scenarioId: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId) ? prev.filter((id) => id !== scenarioId) : [...prev, scenarioId],
    )
  }

  const filteredScenarios = scenarios.filter((scenario) => {
    const matchesSearch =
      scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || scenario.tags?.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const allTags = Array.from(new Set(scenarios.flatMap((s) => s.tags || [])))

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getPerformanceStatus = (results?: any) => {
    if (!results) return { status: "unknown", color: "text-muted-foreground" }

    const onTimePercentage = results.onTimePercentage * 100
    if (onTimePercentage >= 95) return { status: "excellent", color: "text-green-600", icon: CheckCircle }
    if (onTimePercentage >= 85) return { status: "good", color: "text-blue-600", icon: TrendingUp }
    if (onTimePercentage >= 70) return { status: "fair", color: "text-yellow-600", icon: Clock }
    return { status: "poor", color: "text-red-600", icon: AlertTriangle }
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AMR Simulation Projects</h1>
            <p className="text-muted-foreground">Manage and analyze your autonomous mobile robot scenarios</p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare Scenarios
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Compare Scenarios</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select 2 or more scenarios to compare their performance metrics
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {scenarios
                      .filter((s) => s.simulationResults)
                      .map((scenario) => (
                        <div key={scenario.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                          <Checkbox
                            id={scenario.id}
                            checked={selectedScenarios.includes(scenario.id)}
                            onCheckedChange={() => toggleScenarioSelection(scenario.id)}
                          />
                          <div className="flex-1">
                            <label htmlFor={scenario.id} className="text-sm font-medium cursor-pointer">
                              {scenario.name}
                            </label>
                            <p className="text-xs text-muted-foreground">{scenario.description}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(scenario.simulationResults?.onTimePercentage * 100).toFixed(0)}% on-time
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <p className="text-sm text-muted-foreground">{selectedScenarios.length} scenario(s) selected</p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowCompareDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCompareScenarios} disabled={selectedScenarios.length < 2}>
                        Compare Selected
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Scenario
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Scenarios</span>
              </div>
              <p className="text-2xl font-bold">{scenarios.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Robots</span>
              </div>
              <p className="text-2xl font-bold">{scenarios.reduce((sum, s) => sum + s.parameters.fleetSize, 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Avg Throughput</span>
              </div>
              <p className="text-2xl font-bold">
                {Math.round(
                  scenarios.reduce((sum, s) => sum + (s.simulationResults?.throughputPerHour || 0), 0) /
                    scenarios.length || 0,
                )}
                <span className="text-sm text-muted-foreground ml-1">/hr</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Avg On-Time</span>
              </div>
              <p className="text-2xl font-bold">
                {Math.round(
                  scenarios.reduce((sum, s) => sum + (s.simulationResults?.onTimePercentage || 0) * 100, 0) /
                    scenarios.length || 0,
                )}
                %
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => {
            const performance = getPerformanceStatus(scenario.simulationResults)
            const PerformanceIcon = performance.icon

            return (
              <Card
                key={scenario.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                onClick={() => handleOpenScenario(scenario)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{scenario.name}</CardTitle>
                      {scenario.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{scenario.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary">{scenario.stations.length} stations</Badge>
                        <Badge variant="outline">{scenario.robots.length} robot types</Badge>
                        {PerformanceIcon && <PerformanceIcon className={`h-4 w-4 ${performance.color}`} />}
                      </div>
                    </div>
                    <FolderOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Fleet: {scenario.parameters.fleetSize}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {scenario.parameters.shiftHours}h shifts
                      </div>
                    </div>

                    {scenario.tags && scenario.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {scenario.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {scenario.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{scenario.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {scenario.simulationResults && (
                      <div className="pt-3 border-t border-border">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Throughput:</span>
                            <p className="font-medium text-sm">{scenario.simulationResults.throughputPerHour}/hr</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">On-time:</span>
                            <p className={`font-medium text-sm ${performance.color}`}>
                              {(scenario.simulationResults.onTimePercentage * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Utilization:</span>
                            <p className="font-medium text-sm">
                              {(scenario.simulationResults.robotUtilization * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Time:</span>
                            <p className="font-medium text-sm">
                              {scenario.simulationResults.avgMissionTime.toFixed(1)}m
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {scenario.lastModified && (
                      <div className="pt-2 text-xs text-muted-foreground">
                        Modified {formatDate(scenario.lastModified)}
                        {scenario.createdBy && ` by ${scenario.createdBy}`}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <Plus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">Create New Scenario</h3>
              <p className="text-sm text-muted-foreground">Start a new AMR simulation project with custom parameters</p>
            </CardContent>
          </Card>
        </div>

        {filteredScenarios.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No scenarios found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
