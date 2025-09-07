"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MousePointer,
  Square,
  Circle,
  Move,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Upload,
  Layers,
  Play,
  Pause,
  StampIcon as StopIcon,
} from "lucide-react"
import { SimulationEngine, type SimulationState } from "@/lib/simulation"

type Tool = "select" | "station" | "charger" | "zone" | "path" | "pan"
type StationType = "pickup" | "dropoff" | "workstation" | "charger"

interface CanvasPoint {
  x: number
  y: number
}

interface CanvasStation {
  id: string
  name: string
  type: StationType
  position: CanvasPoint
  size: number
}

export function CanvasWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simulationEngineRef = useRef<SimulationEngine | null>(null)
  const animationFrameRef = useRef<number>()

  const {
    activeScenario,
    setSelectedStation,
    selectedStation,
    isSimulating,
    setIsSimulating,
    simulationTime,
    setSimulationTime,
  } = useAppStore()

  const [activeTool, setActiveTool] = useState<Tool>("select")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<CanvasPoint>({ x: 0, y: 0 })
  const [canvasStations, setCanvasStations] = useState<CanvasStation[]>([])
  const [gridSize] = useState(50)
  const [showGrid, setShowGrid] = useState(true)
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null)

  // Convert scenario stations to canvas stations
  useEffect(() => {
    if (activeScenario) {
      const stations = activeScenario.stations.map((station) => ({
        id: station.id,
        name: station.name,
        type: station.type,
        position: {
          x: station.position.x * gridSize + 100,
          y: station.position.y * gridSize + 100,
        },
        size: 30,
      }))
      setCanvasStations(stations)
    }
  }, [activeScenario, gridSize])

  // Initialize simulation engine
  useEffect(() => {
    if (activeScenario) {
      simulationEngineRef.current = new SimulationEngine(activeScenario, setSimulationState)
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [activeScenario])

  // Animation loop
  useEffect(() => {
    if (isSimulating && simulationEngineRef.current) {
      let lastTime = Date.now()

      const animate = () => {
        const currentTime = Date.now()
        const deltaTime = currentTime - lastTime
        lastTime = currentTime

        simulationEngineRef.current?.step(deltaTime)
        setSimulationTime(simulationEngineRef.current?.getState().time || 0)

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isSimulating, setSimulationTime])

  // Handle simulation controls
  const handlePlayPause = () => {
    if (!simulationEngineRef.current) return

    if (isSimulating) {
      simulationEngineRef.current.pause()
      setIsSimulating(false)
    } else {
      simulationEngineRef.current.start()
      setIsSimulating(true)
    }
  }

  const handleStop = () => {
    if (!simulationEngineRef.current) return

    simulationEngineRef.current.reset()
    setIsSimulating(false)
    setSimulationTime(0)
  }

  const handleTimelineChange = (time: number) => {
    if (!simulationEngineRef.current) return

    simulationEngineRef.current.setTime(time)
    setSimulationTime(time)
  }

  const snapToGrid = useCallback(
    (point: CanvasPoint): CanvasPoint => {
      return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize,
      }
    },
    [gridSize],
  )

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number): CanvasPoint => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      }
    },
    [pan, zoom],
  )

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (!showGrid) return

      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1 / zoom

      const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize
      const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize
      const endX = startX + width / zoom + gridSize
      const endY = startY + height / zoom + gridSize

      ctx.beginPath()
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY)
        ctx.lineTo(x, endY)
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y)
        ctx.lineTo(endX, y)
      }
      ctx.stroke()
    },
    [showGrid, gridSize, pan, zoom],
  )

  const drawCongestionHeatmap = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!simulationState?.congestionMap) return

      for (const [key, density] of simulationState.congestionMap) {
        const [x, y] = key.split(",").map(Number)
        const intensity = Math.min(density / 3, 1) // Normalize to 0-1

        ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.3})`
        ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize)
      }
    },
    [simulationState, gridSize],
  )

  const drawStation = useCallback(
    (ctx: CanvasRenderingContext2D, station: CanvasStation) => {
      const { position, size, type, name } = station
      const isSelected = selectedStation?.id === station.id

      // Station colors by type
      const colors = {
        pickup: "#3b82f6", // blue
        dropoff: "#10b981", // green
        workstation: "#f59e0b", // amber
        charger: "#8b5cf6", // purple
      }

      // Draw station circle
      ctx.fillStyle = colors[type]
      ctx.strokeStyle = isSelected ? "#ef4444" : "#374151"
      ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom

      ctx.beginPath()
      ctx.arc(position.x, position.y, size, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      // Draw station icon
      ctx.fillStyle = "white"
      ctx.font = `${16 / zoom}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const icons = {
        pickup: "📦",
        dropoff: "📤",
        workstation: "⚙️",
        charger: "🔋",
      }

      ctx.fillText(icons[type], position.x, position.y)

      // Draw station label
      ctx.fillStyle = "#374151"
      ctx.font = `${12 / zoom}px sans-serif`
      ctx.fillText(name, position.x, position.y + size + 20 / zoom)
    },
    [selectedStation, zoom],
  )

  const drawRobot = useCallback(
    (ctx: CanvasRenderingContext2D, robot: any) => {
      const { position, status, batteryLevel, robotType } = robot

      // Robot colors by status
      const statusColors = {
        idle: "#6b7280",
        moving: "#3b82f6",
        working: "#f59e0b",
        charging: "#10b981",
      }

      // Draw robot body
      ctx.fillStyle = statusColors[status] || "#6b7280"
      ctx.strokeStyle = "#374151"
      ctx.lineWidth = 2 / zoom

      const robotSize = 15
      ctx.beginPath()
      ctx.arc(position.x, position.y, robotSize, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      // Draw robot direction indicator
      ctx.fillStyle = "white"
      ctx.beginPath()
      ctx.arc(position.x + robotSize * 0.3, position.y, 3, 0, 2 * Math.PI)
      ctx.fill()

      // Draw battery indicator
      const batteryWidth = 20
      const batteryHeight = 4
      const batteryX = position.x - batteryWidth / 2
      const batteryY = position.y - robotSize - 10

      ctx.strokeStyle = "#374151"
      ctx.lineWidth = 1 / zoom
      ctx.strokeRect(batteryX, batteryY, batteryWidth, batteryHeight)

      ctx.fillStyle = batteryLevel > 0.3 ? "#10b981" : "#ef4444"
      ctx.fillRect(batteryX, batteryY, batteryWidth * batteryLevel, batteryHeight)

      // Draw robot ID
      ctx.fillStyle = "#374151"
      ctx.font = `${10 / zoom}px sans-serif`
      ctx.textAlign = "center"
      ctx.fillText(robot.id.slice(-1), position.x, position.y + robotSize + 15)
    },
    [zoom],
  )

  const drawRobotPath = useCallback(
    (ctx: CanvasRenderingContext2D, robot: any) => {
      if (!robot.path || robot.path.length < 2) return

      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2 / zoom
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      ctx.moveTo(robot.path[0].x, robot.path[0].y)
      for (let i = 1; i < robot.path.length; i++) {
        ctx.lineTo(robot.path[i].x, robot.path[i].y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    },
    [zoom],
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = canvas

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Apply transform
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw grid
    drawGrid(ctx, width, height)

    // Draw congestion heatmap
    drawCongestionHeatmap(ctx)

    // Draw stations
    canvasStations.forEach((station) => drawStation(ctx, station))

    // Draw robots and their paths
    if (simulationState?.robots) {
      simulationState.robots.forEach((robot) => {
        drawRobotPath(ctx, robot)
        drawRobot(ctx, robot)
      })
    }

    ctx.restore()
  }, [
    pan,
    zoom,
    drawGrid,
    drawCongestionHeatmap,
    drawStation,
    drawRobot,
    drawRobotPath,
    canvasStations,
    simulationState,
  ])

  // Redraw canvas when dependencies change
  useEffect(() => {
    draw()
  }, [draw])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      draw()
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [draw])

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY)

    if (activeTool === "pan" || e.button === 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      return
    }

    if (activeTool === "select") {
      // Check if clicking on a station
      const clickedStation = canvasStations.find((station) => {
        const dx = point.x - station.position.x
        const dy = point.y - station.position.y
        return Math.sqrt(dx * dx + dy * dy) <= station.size
      })

      if (clickedStation) {
        const originalStation = activeScenario?.stations.find((s) => s.id === clickedStation.id)
        setSelectedStation(originalStation || null)
      } else {
        setSelectedStation(null)
      }
    }

    if (activeTool === "station") {
      const snappedPoint = snapToGrid(point)
      const newStation: CanvasStation = {
        id: `station-${Date.now()}`,
        name: `Station ${canvasStations.length + 1}`,
        type: "workstation",
        position: snappedPoint,
        size: 30,
      }
      setCanvasStations((prev) => [...prev, newStation])
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && (activeTool === "pan" || e.buttons === 4)) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta))
    setZoom(newZoom)
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const tools = [
    { id: "select", label: "Select", icon: MousePointer },
    { id: "station", label: "Station", icon: Circle },
    { id: "charger", label: "Charger", icon: Zap },
    { id: "zone", label: "Zone", icon: Square },
    { id: "pan", label: "Pan", icon: Move },
  ]

  if (!activeScenario) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Scenario Selected</h2>
            <p className="text-muted-foreground">Select a scenario from the Projects view to start working</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between p-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{activeScenario.name}</h3>
          <Badge variant="outline">Canvas</Badge>
          {simulationState && (
            <Badge variant={isSimulating ? "default" : "secondary"}>{isSimulating ? "Running" : "Paused"}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Simulation Controls */}
          <div className="flex items-center gap-1 mr-4">
            <Button variant="outline" size="sm" onClick={handlePlayPause} disabled={!simulationEngineRef.current}>
              {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleStop} disabled={!simulationEngineRef.current}>
              <StopIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Drawing Tools */}
          <div className="flex items-center gap-1 mr-4">
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTool(tool.id as Tool)}
                  title={tool.label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              )
            })}
          </div>

          {/* View Controls */}
          <Button variant="outline" size="sm" onClick={() => setZoom(zoom * 1.2)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(zoom * 0.8)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Floor Plan
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
            <Layers className="h-4 w-4 mr-2" />
            Grid
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          style={{
            cursor: activeTool === "pan" ? "grab" : activeTool === "select" ? "default" : "crosshair",
          }}
        />

        {/* Canvas Info */}
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2 text-xs text-muted-foreground">
          <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
          <div>Tool: {tools.find((t) => t.id === activeTool)?.label}</div>
          <div>Stations: {canvasStations.length}</div>
          {simulationState && (
            <>
              <div>Robots: {simulationState.robots.length}</div>
              <div>Active Missions: {simulationState.robots.filter((r) => r.currentMission).length}</div>
              <div>Completed: {simulationState.completedMissions.length}</div>
            </>
          )}
        </div>

        {/* Simulation Stats */}
        {simulationState && (
          <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs">
            <h4 className="font-medium mb-2">Live Stats</h4>
            <div className="space-y-1">
              <div>Time: {Math.floor(simulationState.time / 1000)}s</div>
              <div>Active Robots: {simulationState.robots.filter((r) => r.status !== "idle").length}</div>
              <div>Queue: {simulationState.missionQueue.filter((m) => !m.assignedRobot).length}</div>
              <div>
                Avg Battery:{" "}
                {(
                  (simulationState.robots.reduce((sum, r) => sum + r.batteryLevel, 0) / simulationState.robots.length) *
                  100
                ).toFixed(0)}
                %
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
