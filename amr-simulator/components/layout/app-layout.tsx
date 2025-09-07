"use client"

import type React from "react"

import { useAppStore } from "@/lib/store"
import { Sidebar } from "./sidebar"
import { TopToolbar } from "./top-toolbar"
import { PropertiesPanel } from "./properties-panel"
import { Timeline } from "./timeline"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentView } = useAppStore()

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopToolbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden">{children}</div>

            {currentView === "workspace" && <PropertiesPanel />}
          </div>

          {currentView === "workspace" && <Timeline />}
        </main>
      </div>
    </div>
  )
}
