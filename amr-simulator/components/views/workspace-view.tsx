"use client"

import { useAppStore } from "@/lib/store"
import { CanvasWorkspace } from "@/components/canvas/canvas-workspace"

export function WorkspaceView() {
  const { activeScenario } = useAppStore()

  return <CanvasWorkspace />
}
