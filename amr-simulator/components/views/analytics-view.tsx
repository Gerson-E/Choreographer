"use client"

import { useMemo, useState } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Target,
  Battery,
  Users,
  Route,
  GitCompare,
  ArrowUpDown,
} from "lucide-react"
import type { Scenario } from "@/lib/store"

export function AnalyticsView() {
  const { activeScenario, scenarios } = useAppStore()
  const [comparisonMode, setComparisonMode] = useState(false)
  const [compareScenarioId, setCompareScenarioId] = useState<string>("")

  const compareScenario = scenarios.find((s) => s.id === compareScenarioId)

  // Generate mock analytics data based on scenario
  const getAnalyticsData = (scenario: Scenario | null) => {
    if (!scenario?.simulationResults) return null

    const results = scenario.simulationResults

    // Hourly throughput data
    const hourlyThroughput = Array.from({ length: 8 }, (_, i) => ({
      hour: `${i + 1}h`,
      throughput: Math.round(results.throughputPerHour + (Math.random() - 0.5) * 10),
      target: results.throughputPerHour,
    }))

    // Mission time distribution
    const missionTimeData = [
      { timeRange: "0-5min", count: 45, percentage: 35 },
      { timeRange: "5-10min", count: 52, percentage: 40 },
      { timeRange: "10-15min", count: 25, percentage: 20 },
      { timeRange: "15-20min", count: 6, percentage: 5 },
    ]

    // Robot utilization over time
    const utilizationData = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      utilization: Math.round((results.robotUtilization + (Math.random() - 0.5) * 0.3) * 100),
      chargerUtilization: Math.round((results.chargerUtilization + (Math.random() - 0.5) * 0.2) * 100),
    }))

    // Station performance
    const stationPerformance = scenario.stations.map((station, index) => ({
      name: station.name,
      waitTime: Math.round(results.waitAtStations + (Math.random() - 0.5) * 4),
      throughput: Math.round(results.throughputPerHour / scenario.stations.length + Math.random() * 5),
      utilization: Math.round((0.6 + Math.random() * 0.4) * 100),
      type: station.type,
    }))

    return {
      hourlyThroughput,
      missionTimeData,
      utilizationData,
      stationPerformance,
      kpis: {
        throughputPerHour: results.throughputPerHour,
        avgMissionTime: results.avgMissionTime,
        waitAtStations: results.waitAtStations,
        collisionCount: results.collisionCount,
        chargerUtilization: results.chargerUtilization,
        robotUtilization: results.robotUtilization,
        onTimePercentage: results.onTimePercentage,
      },
    }
  }

  const analyticsData = getAnalyticsData(activeScenario)
  const compareAnalyticsData = getAnalyticsData(compareScenario || null)

  // Calculate deltas for comparison
  const calculateDelta = (current: number, compare: number) => {
    const delta = ((current - compare) / compare) * 100
    return {
      value: delta,
      isPositive: delta > 0,
      formatted: `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`,
    }
  }

  // Insights and recommendations
  const insights = useMemo(() => {
    if (!analyticsData) return []

    const insights = []
    const { kpis, stationPerformance } = analyticsData

    // Bottleneck analysis
    const bottleneckStations = stationPerformance
      .filter((station) => station.waitTime > 5)
      .sort((a, b) => b.waitTime - a.waitTime)
      .slice(0, 3)

    if (bottleneckStations.length > 0) {
      insights.push({
        type: "warning",
        title: "Station Bottlenecks Detected",
        description: `${bottleneckStations[0].name} has highest wait time (${bottleneckStations[0].waitTime}min)`,
        suggestion: "Consider adding parallel stations or optimizing workflow",
        impact: "High",
      })
    }

    // Utilization analysis
    if (kpis.robotUtilization < 0.7) {
      insights.push({
        type: "info",
        title: "Low Robot Utilization",
        description: `Current utilization: ${(kpis.robotUtilization * 100).toFixed(0)}%`,
        suggestion: "Reduce fleet size or increase mission frequency",
        impact: "Medium",
      })
    }

    if (kpis.robotUtilization > 0.9) {
      insights.push({
        type: "warning",
        title: "High Robot Utilization",
        description: `Current utilization: ${(kpis.robotUtilization * 100).toFixed(0)}%`,
        suggestion: "Add more robots or optimize mission scheduling",
        impact: "High",
      })
    }

    // Battery analysis
    if (kpis.chargerUtilization > 0.8) {
      insights.push({
        type: "warning",
        title: "Charger Capacity Constraint",
        description: `Charger utilization: ${(kpis.chargerUtilization * 100).toFixed(0)}%`,
        suggestion: "Add more charging stations or implement opportunity charging",
        impact: "Medium",
      })
    }

    // Performance analysis
    if (kpis.onTimePercentage < 0.85) {
      insights.push({
        type: "error",
        title: "Poor On-Time Performance",
        description: `Only ${(kpis.onTimePercentage * 100).toFixed(0)}% missions completed on time`,
        suggestion: "Review SLA targets or optimize robot routing",
        impact: "High",
      })
    }

    return insights
  }, [analyticsData])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getComparisonChartData = () => {
    if (!analyticsData || !compareAnalyticsData) return []

    return [
      {
        metric: "Throughput/hr",
        current: analyticsData.kpis.throughputPerHour,
        compare: compareAnalyticsData.kpis.throughputPerHour,
      },
      {
        metric: "Avg Mission Time",
        current: analyticsData.kpis.avgMissionTime,
        compare: compareAnalyticsData.kpis.avgMissionTime,
      },
      {
        metric: "Robot Utilization %",
        current: analyticsData.kpis.robotUtilization * 100,
        compare: compareAnalyticsData.kpis.robotUtilization * 100,
      },
      {
        metric: "On-Time %",
        current: analyticsData.kpis.onTimePercentage * 100,
        compare: compareAnalyticsData.kpis.onTimePercentage * 100,
      },
      {
        metric: "Wait Time",
        current: analyticsData.kpis.waitAtStations,
        compare: compareAnalyticsData.kpis.waitAtStations,
      },
    ]
  }

  if (!activeScenario) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Scenario Selected</h2>
            <p className="text-muted-foreground">Select a scenario to view its analytics and KPIs</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Simulation Data</h2>
            <p className="text-muted-foreground">Run a simulation to generate analytics data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Performance insights for {activeScenario.name}
              {comparisonMode && compareScenario && ` vs ${compareScenario.name}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={comparisonMode ? "default" : "outline"} onClick={() => setComparisonMode(!comparisonMode)}>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare
            </Button>

            {comparisonMode && (
              <Select value={compareScenarioId} onValueChange={setCompareScenarioId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select scenario to compare" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios
                    .filter((s) => s.id !== activeScenario.id && s.simulationResults)
                    .map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Throughput/Hour</p>
                  <p className="text-2xl font-bold">{analyticsData.kpis.throughputPerHour}</p>
                  {comparisonMode && compareAnalyticsData && (
                    <div className="flex items-center gap-1">
                      {(() => {
                        const delta = calculateDelta(
                          analyticsData.kpis.throughputPerHour,
                          compareAnalyticsData.kpis.throughputPerHour,
                        )
                        return (
                          <p
                            className={`text-xs flex items-center gap-1 ${delta.isPositive ? "text-green-600" : "text-red-600"}`}
                          >
                            {delta.isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {delta.formatted}
                          </p>
                        )
                      })()}
                    </div>
                  )}
                  {!comparisonMode && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +5.2% vs target
                    </p>
                  )}
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Mission Time</p>
                  <p className="text-2xl font-bold">{analyticsData.kpis.avgMissionTime.toFixed(1)}m</p>
                  {comparisonMode && compareAnalyticsData && (
                    <div className="flex items-center gap-1">
                      {(() => {
                        const delta = calculateDelta(
                          analyticsData.kpis.avgMissionTime,
                          compareAnalyticsData.kpis.avgMissionTime,
                        )
                        return (
                          <p
                            className={`text-xs flex items-center gap-1 ${!delta.isPositive ? "text-green-600" : "text-red-600"}`}
                          >
                            {!delta.isPositive ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : (
                              <TrendingUp className="h-3 w-3" />
                            )}
                            {delta.formatted}
                          </p>
                        )
                      })()}
                    </div>
                  )}
                  {!comparisonMode && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      +2.1% vs target
                    </p>
                  )}
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Robot Utilization</p>
                  <p className="text-2xl font-bold">{(analyticsData.kpis.robotUtilization * 100).toFixed(0)}%</p>
                  {comparisonMode && compareAnalyticsData && (
                    <div className="flex items-center gap-1">
                      {(() => {
                        const delta = calculateDelta(
                          analyticsData.kpis.robotUtilization * 100,
                          compareAnalyticsData.kpis.robotUtilization * 100,
                        )
                        return (
                          <p
                            className={`text-xs flex items-center gap-1 ${delta.isPositive ? "text-green-600" : "text-red-600"}`}
                          >
                            {delta.isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {delta.formatted}
                          </p>
                        )
                      })()}
                    </div>
                  )}
                  {!comparisonMode && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Optimal range
                    </p>
                  )}
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">On-Time %</p>
                  <p className="text-2xl font-bold">{(analyticsData.kpis.onTimePercentage * 100).toFixed(0)}%</p>
                  {comparisonMode && compareAnalyticsData && (
                    <div className="flex items-center gap-1">
                      {(() => {
                        const delta = calculateDelta(
                          analyticsData.kpis.onTimePercentage * 100,
                          compareAnalyticsData.kpis.onTimePercentage * 100,
                        )
                        return (
                          <p
                            className={`text-xs flex items-center gap-1 ${delta.isPositive ? "text-green-600" : "text-red-600"}`}
                          >
                            {delta.isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {delta.formatted}
                          </p>
                        )
                      })()}
                    </div>
                  )}
                  {!comparisonMode && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Above target
                    </p>
                  )}
                </div>
                <Route className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {comparisonMode && compareAnalyticsData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Scenario Comparison: {activeScenario.name} vs {compareScenario?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getComparisonChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#3b82f6" name={activeScenario.name} />
                  <Bar dataKey="compare" fill="#10b981" name={compareScenario?.name} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Throughput Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hourly Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.hourlyThroughput}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="throughput" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mission Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mission Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.missionTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeRange" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilization Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Utilization Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.utilizationData.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="utilization" stroke="#3b82f6" name="Robot Utilization %" />
                  <Line type="monotone" dataKey="chargerUtilization" stroke="#8b5cf6" name="Charger Utilization %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Station Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Station Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.stationPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="waitTime" fill="#f59e0b" name="Wait Time (min)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Battery className="h-4 w-4" />
                Battery & Charging
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Charger Utilization</span>
                <span className="font-medium">{(analyticsData.kpis.chargerUtilization * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Battery Level</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Low Battery Events</span>
                <span className="font-medium">3</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Efficiency Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Wait at Stations</span>
                <span className="font-medium">{analyticsData.kpis.waitAtStations.toFixed(1)}min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Travel Efficiency</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Path Optimization</span>
                <span className="font-medium">92%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Safety & Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Collisions</span>
                <span className="font-medium">{analyticsData.kpis.collisionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Near Misses</span>
                <span className="font-medium">7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Emergency Stops</span>
                <span className="font-medium">2</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI-Powered Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge className={getImpactColor(insight.impact)}>{insight.impact} Impact</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    <p className="text-sm font-medium text-blue-600">{insight.suggestion}</p>
                  </div>
                </div>
              ))}

              {insights.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">All Systems Operating Optimally</h3>
                  <p className="text-muted-foreground">No critical issues or bottlenecks detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
