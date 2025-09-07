"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { AppLayout } from "@/components/layout/app-layout"
import { ProjectsView } from "@/components/views/projects-view"
import { WorkspaceView } from "@/components/views/workspace-view"
import { RobotLibraryView } from "@/components/views/robot-library-view"
import { MissionsView } from "@/components/views/missions-view"
import { AnalyticsView } from "@/components/views/analytics-view"

const demoScenarios = [
  {
    id: "demo-small-cell",
    name: "Small Cell Assembly",
    description: "Compact assembly line with 2 robot types and 7 stations",
    lastModified: "2024-01-15T10:30:00Z",
    createdBy: "John Smith",
    tags: ["assembly", "small-scale", "demo"],
    stations: [
      { id: "pickup-1", name: "Parts Pickup A", type: "pickup" as const, position: { x: 2, y: 2 }, capacity: 10 },
      { id: "pickup-2", name: "Parts Pickup B", type: "pickup" as const, position: { x: 8, y: 2 }, capacity: 8 },
      { id: "assembly-1", name: "Assembly Station 1", type: "workstation" as const, position: { x: 5, y: 5 } },
      { id: "assembly-2", name: "Assembly Station 2", type: "workstation" as const, position: { x: 7, y: 5 } },
      { id: "dropoff-1", name: "Finished Goods", type: "dropoff" as const, position: { x: 5, y: 8 }, capacity: 15 },
      { id: "charger-1", name: "Charger A", type: "charger" as const, position: { x: 1, y: 8 } },
      { id: "charger-2", name: "Charger B", type: "charger" as const, position: { x: 9, y: 8 } },
    ],
    robots: [
      {
        id: "agv-small",
        name: "Small AGV",
        type: "Light Duty",
        speed: 1.2,
        payload: 50,
        batteryCapacity: 2400,
        footprint: { width: 0.6, height: 0.8 },
      },
      {
        id: "agv-medium",
        name: "Medium AGV",
        type: "Medium Duty",
        speed: 1.0,
        payload: 150,
        batteryCapacity: 4800,
        footprint: { width: 0.8, height: 1.2 },
      },
    ],
    missions: [
      {
        id: "mission-1",
        name: "Parts to Assembly A",
        priority: 1,
        sla: 15,
        steps: [
          { stationId: "pickup-1", action: "pickup" as const, duration: 30 },
          { stationId: "assembly-1", action: "dropoff" as const, duration: 20 },
        ],
      },
      {
        id: "mission-2",
        name: "Parts to Assembly B",
        priority: 1,
        sla: 15,
        steps: [
          { stationId: "pickup-2", action: "pickup" as const, duration: 30 },
          { stationId: "assembly-2", action: "dropoff" as const, duration: 20 },
        ],
      },
      {
        id: "mission-3",
        name: "Finished Goods Collection",
        priority: 2,
        sla: 30,
        steps: [
          { stationId: "assembly-1", action: "pickup" as const, duration: 25 },
          { stationId: "dropoff-1", action: "dropoff" as const, duration: 15 },
        ],
      },
    ],
    parameters: {
      fleetSize: 3,
      shiftHours: 8,
      chargingPolicy: "opportunity" as const,
      speedLimit: 1.5,
      rightOfWayRules: ["Priority lanes", "Intersection stops"],
    },
    simulationResults: {
      throughputPerHour: 24,
      avgMissionTime: 8.5,
      waitAtStations: 2.1,
      collisionCount: 0,
      chargerUtilization: 0.65,
      robotUtilization: 0.78,
      onTimePercentage: 0.92,
    },
  },
  {
    id: "demo-warehouse",
    name: "Large Warehouse Distribution",
    description: "High-throughput warehouse with 15 stations and 4 robot types",
    lastModified: "2024-01-12T14:20:00Z",
    createdBy: "Sarah Johnson",
    tags: ["warehouse", "high-throughput", "logistics"],
    stations: [
      { id: "inbound-1", name: "Inbound Dock A", type: "pickup" as const, position: { x: 1, y: 2 }, capacity: 50 },
      { id: "inbound-2", name: "Inbound Dock B", type: "pickup" as const, position: { x: 1, y: 4 }, capacity: 50 },
      { id: "inbound-3", name: "Inbound Dock C", type: "pickup" as const, position: { x: 1, y: 6 }, capacity: 50 },
      { id: "sort-1", name: "Sort Station 1", type: "workstation" as const, position: { x: 5, y: 3 } },
      { id: "sort-2", name: "Sort Station 2", type: "workstation" as const, position: { x: 5, y: 5 } },
      { id: "storage-1", name: "Storage Zone A", type: "dropoff" as const, position: { x: 9, y: 2 }, capacity: 100 },
      { id: "storage-2", name: "Storage Zone B", type: "dropoff" as const, position: { x: 9, y: 4 }, capacity: 100 },
      { id: "storage-3", name: "Storage Zone C", type: "dropoff" as const, position: { x: 9, y: 6 }, capacity: 100 },
      { id: "outbound-1", name: "Outbound Dock A", type: "dropoff" as const, position: { x: 13, y: 3 }, capacity: 40 },
      { id: "outbound-2", name: "Outbound Dock B", type: "dropoff" as const, position: { x: 13, y: 5 }, capacity: 40 },
      { id: "charger-1", name: "Charging Station 1", type: "charger" as const, position: { x: 3, y: 1 } },
      { id: "charger-2", name: "Charging Station 2", type: "charger" as const, position: { x: 7, y: 1 } },
      { id: "charger-3", name: "Charging Station 3", type: "charger" as const, position: { x: 11, y: 1 } },
    ],
    robots: [
      {
        id: "forklift-heavy",
        name: "Heavy Forklift AGV",
        type: "Heavy Duty",
        speed: 0.8,
        payload: 500,
        batteryCapacity: 12000,
        footprint: { width: 1.2, height: 2.0 },
      },
      {
        id: "agv-standard",
        name: "Standard AGV",
        type: "Standard",
        speed: 1.5,
        payload: 200,
        batteryCapacity: 6000,
        footprint: { width: 0.9, height: 1.4 },
      },
      {
        id: "shuttle-fast",
        name: "Fast Shuttle",
        type: "High Speed",
        speed: 2.2,
        payload: 100,
        batteryCapacity: 4000,
        footprint: { width: 0.7, height: 1.0 },
      },
      {
        id: "picker-compact",
        name: "Compact Picker",
        type: "Compact",
        speed: 1.0,
        payload: 75,
        batteryCapacity: 3000,
        footprint: { width: 0.5, height: 0.8 },
      },
    ],
    missions: [
      {
        id: "inbound-sort",
        name: "Inbound to Sort",
        priority: 1,
        sla: 10,
        steps: [
          { stationId: "inbound-1", action: "pickup" as const, duration: 45 },
          { stationId: "sort-1", action: "dropoff" as const, duration: 30 },
        ],
      },
      {
        id: "sort-storage",
        name: "Sort to Storage",
        priority: 2,
        sla: 20,
        steps: [
          { stationId: "sort-1", action: "pickup" as const, duration: 35 },
          { stationId: "storage-1", action: "dropoff" as const, duration: 25 },
        ],
      },
      {
        id: "storage-outbound",
        name: "Storage to Outbound",
        priority: 1,
        sla: 15,
        steps: [
          { stationId: "storage-1", action: "pickup" as const, duration: 40 },
          { stationId: "outbound-1", action: "dropoff" as const, duration: 30 },
        ],
      },
    ],
    parameters: {
      fleetSize: 12,
      shiftHours: 16,
      chargingPolicy: "threshold" as const,
      speedLimit: 2.0,
      rightOfWayRules: ["Main corridors", "Loading zone priority", "Emergency stops"],
    },
    simulationResults: {
      throughputPerHour: 156,
      avgMissionTime: 12.3,
      waitAtStations: 4.2,
      collisionCount: 2,
      chargerUtilization: 0.82,
      robotUtilization: 0.89,
      onTimePercentage: 0.87,
    },
  },
  {
    id: "demo-manufacturing",
    name: "Automotive Parts Manufacturing",
    description: "Complex manufacturing floor with quality control stations",
    lastModified: "2024-01-10T09:15:00Z",
    createdBy: "Mike Chen",
    tags: ["manufacturing", "automotive", "quality-control"],
    stations: [
      { id: "raw-materials", name: "Raw Materials", type: "pickup" as const, position: { x: 2, y: 2 }, capacity: 30 },
      { id: "machining-1", name: "CNC Station 1", type: "workstation" as const, position: { x: 6, y: 2 } },
      { id: "machining-2", name: "CNC Station 2", type: "workstation" as const, position: { x: 10, y: 2 } },
      { id: "quality-check", name: "Quality Control", type: "workstation" as const, position: { x: 8, y: 5 } },
      { id: "assembly-line", name: "Assembly Line", type: "workstation" as const, position: { x: 6, y: 8 } },
      { id: "packaging", name: "Packaging Station", type: "workstation" as const, position: { x: 10, y: 8 } },
      {
        id: "finished-goods",
        name: "Finished Goods",
        type: "dropoff" as const,
        position: { x: 14, y: 5 },
        capacity: 25,
      },
      { id: "rework", name: "Rework Station", type: "workstation" as const, position: { x: 4, y: 5 } },
      { id: "charger-1", name: "Charger 1", type: "charger" as const, position: { x: 2, y: 8 } },
      { id: "charger-2", name: "Charger 2", type: "charger" as const, position: { x: 12, y: 2 } },
    ],
    robots: [
      {
        id: "precision-agv",
        name: "Precision AGV",
        type: "Precision",
        speed: 0.9,
        payload: 300,
        batteryCapacity: 8000,
        footprint: { width: 1.0, height: 1.5 },
      },
      {
        id: "heavy-lifter",
        name: "Heavy Lifter",
        type: "Heavy Duty",
        speed: 0.6,
        payload: 800,
        batteryCapacity: 15000,
        footprint: { width: 1.4, height: 2.2 },
      },
      {
        id: "quality-bot",
        name: "Quality Inspector Bot",
        type: "Inspection",
        speed: 0.7,
        payload: 50,
        batteryCapacity: 5000,
        footprint: { width: 0.8, height: 1.0 },
      },
    ],
    missions: [
      {
        id: "raw-to-machining",
        name: "Raw Materials to Machining",
        priority: 1,
        sla: 25,
        steps: [
          { stationId: "raw-materials", action: "pickup" as const, duration: 60 },
          { stationId: "machining-1", action: "dropoff" as const, duration: 45 },
        ],
      },
      {
        id: "machining-to-qc",
        name: "Machining to Quality Control",
        priority: 1,
        sla: 20,
        steps: [
          { stationId: "machining-1", action: "pickup" as const, duration: 40 },
          { stationId: "quality-check", action: "dropoff" as const, duration: 90 },
        ],
      },
      {
        id: "qc-to-assembly",
        name: "Quality Control to Assembly",
        priority: 2,
        sla: 30,
        steps: [
          { stationId: "quality-check", action: "pickup" as const, duration: 35 },
          { stationId: "assembly-line", action: "dropoff" as const, duration: 120 },
        ],
      },
    ],
    parameters: {
      fleetSize: 8,
      shiftHours: 12,
      chargingPolicy: "opportunity" as const,
      speedLimit: 1.2,
      rightOfWayRules: ["Safety zones", "Clean room protocols", "Heavy equipment priority"],
    },
    simulationResults: {
      throughputPerHour: 18,
      avgMissionTime: 15.7,
      waitAtStations: 6.8,
      collisionCount: 1,
      chargerUtilization: 0.71,
      robotUtilization: 0.85,
      onTimePercentage: 0.94,
    },
  },
]

export default function HomePage() {
  const { currentView, addScenario, scenarios } = useAppStore()

  useEffect(() => {
    if (scenarios.length === 0) {
      demoScenarios.forEach((scenario) => addScenario(scenario))
    }
  }, [addScenario, scenarios.length])

  return (
    <AppLayout>
      {currentView === "projects" && <ProjectsView />}
      {currentView === "workspace" && <WorkspaceView />}
      {currentView === "robots" && <RobotLibraryView />}
      {currentView === "missions" && <MissionsView />}
      {currentView === "analytics" && <AnalyticsView />}
    </AppLayout>
  )
}
