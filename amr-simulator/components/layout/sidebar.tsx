"use client"

import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FolderOpen, Settings, BarChart3, Layers, Bot, Route } from "lucide-react"

const navigationItems = [
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "workspace", label: "Workspace", icon: Layers },
  { id: "robots", label: "Robot Library", icon: Bot },
  { id: "missions", label: "Missions", icon: Route },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const { currentView, setCurrentView } = useAppStore()

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-sidebar-foreground">AMR Mission Simulator</h1>
      </div>

      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 text-sidebar-foreground",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
                onClick={() => setCurrentView(item.id as any)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
