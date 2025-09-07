"use client"

import { useAppStore } from "@/lib/store"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, RotateCcw, FastForward, Rewind } from "lucide-react"

export function Timeline() {
  const { simulationTime, setSimulationTime, isSimulating, setIsSimulating, activeScenario } = useAppStore()

  const maxTime = (activeScenario?.parameters.shiftHours || 8) * 60 * 60 * 1000 // Convert hours to milliseconds

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    setIsSimulating(!isSimulating)
  }

  const handleStop = () => {
    setIsSimulating(false)
    setSimulationTime(0)
  }

  const handleReset = () => {
    setSimulationTime(0)
  }

  const handleSpeedChange = (multiplier: number) => {
    // Speed control would be implemented in simulation engine
    console.log(`Speed changed to ${multiplier}x`)
  }

  return (
    <div className="h-16 bg-card border-t border-border flex items-center px-4 gap-4">
      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => handleSpeedChange(0.5)} title="0.5x Speed">
          <Rewind className="h-4 w-4" />
        </Button>

        <Button size="sm" variant="outline" onClick={handlePlayPause} disabled={!activeScenario}>
          {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Button size="sm" variant="outline" onClick={handleStop} disabled={!activeScenario}>
          <Square className="h-4 w-4" />
        </Button>

        <Button size="sm" variant="outline" onClick={handleReset} disabled={!activeScenario}>
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button size="sm" variant="outline" onClick={() => handleSpeedChange(2)} title="2x Speed">
          <FastForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline Scrubber */}
      <div className="flex-1 flex items-center gap-4">
        <span className="text-sm text-muted-foreground min-w-[80px] font-mono">{formatTime(simulationTime)}</span>

        <Slider
          value={[simulationTime]}
          onValueChange={(value) => setSimulationTime(value[0])}
          max={maxTime}
          step={1000} // 1 second steps
          className="flex-1"
          disabled={!activeScenario}
        />

        <span className="text-sm text-muted-foreground min-w-[80px] font-mono">{formatTime(maxTime)}</span>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-2">
        <Badge variant={isSimulating ? "default" : "secondary"}>{isSimulating ? "Running" : "Paused"}</Badge>

        <div className="text-sm text-muted-foreground">Speed: 1x</div>

        {activeScenario && (
          <div className="text-sm text-muted-foreground">Shift: {activeScenario.parameters.shiftHours}h</div>
        )}
      </div>
    </div>
  )
}
