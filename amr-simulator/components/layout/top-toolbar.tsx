"use client"

import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, RotateCcw, Save, Upload, Download } from "lucide-react"

export function TopToolbar() {
  const { activeScenario, isSimulating, setIsSimulating, simulationTime, setSimulationTime } = useAppStore()

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

  return (
    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {activeScenario ? activeScenario.name : "No scenario selected"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {activeScenario && (
          <>
            <Button size="sm" variant="outline" onClick={handlePlayPause} disabled={!activeScenario}>
              {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button size="sm" variant="outline" onClick={handleStop} disabled={!activeScenario}>
              <Square className="h-4 w-4" />
            </Button>

            <Button size="sm" variant="outline" onClick={handleReset} disabled={!activeScenario}>
              <RotateCcw className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-2" />
          </>
        )}

        <Button size="sm" variant="outline">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>

        <Button size="sm" variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>

        <Button size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  )
}
