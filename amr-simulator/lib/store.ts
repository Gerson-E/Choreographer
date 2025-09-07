import { create } from "zustand"

export interface Robot {
  id: string
  name: string
  type: string
  speed: number // m/s
  payload: number // kg
  batteryCapacity: number // Wh
  footprint: { width: number; height: number } // meters
}

export interface Station {
  id: string
  name: string
  type: "pickup" | "dropoff" | "charger" | "workstation"
  position: { x: number; y: number }
  capacity?: number
}

export interface Mission {
  id: string
  name: string
  priority: number
  sla: number // minutes
  steps: Array<{
    stationId: string
    action: "pickup" | "dropoff" | "charge"
    duration: number // seconds
  }>
}

export interface Scenario {
  id: string
  name: string
  description?: string
  lastModified?: string
  createdBy?: string
  tags?: string[]
  floorPlan?: string
  stations: Station[]
  robots: Robot[]
  missions: Mission[]
  parameters: {
    fleetSize: number
    shiftHours: number
    chargingPolicy: "opportunity" | "threshold"
    speedLimit: number
    rightOfWayRules: string[]
  }
  simulationResults?: {
    throughputPerHour: number
    avgMissionTime: number
    waitAtStations: number
    collisionCount: number
    chargerUtilization: number
    robotUtilization: number
    onTimePercentage: number
  }
}

interface AppState {
  currentView: "projects" | "workspace" | "robots" | "missions" | "analytics" | "settings"
  scenarios: Scenario[]
  activeScenario: Scenario | null
  selectedRobot: Robot | null
  selectedStation: Station | null
  isSimulating: boolean
  simulationTime: number

  // Actions
  setCurrentView: (view: "projects" | "workspace" | "robots" | "missions" | "analytics" | "settings") => void
  setActiveScenario: (scenario: Scenario | null) => void
  addScenario: (scenario: Scenario) => void
  updateScenario: (id: string, updates: Partial<Scenario>) => void
  setSelectedRobot: (robot: Robot | null) => void
  setSelectedStation: (station: Station | null) => void
  setIsSimulating: (simulating: boolean) => void
  setSimulationTime: (time: number) => void
  addRobotToScenario: (scenarioId: string, robot: Robot) => void
  updateRobotInScenario: (scenarioId: string, robotId: string, updates: Partial<Robot>) => void
  removeRobotFromScenario: (scenarioId: string, robotId: string) => void
  addMissionToScenario: (scenarioId: string, mission: Mission) => void
  updateMissionInScenario: (scenarioId: string, missionId: string, updates: Partial<Mission>) => void
  removeMissionFromScenario: (scenarioId: string, missionId: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: "projects",
  scenarios: [],
  activeScenario: null,
  selectedRobot: null,
  selectedStation: null,
  isSimulating: false,
  simulationTime: 0,

  setCurrentView: (view) => set({ currentView: view }),
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  addScenario: (scenario) =>
    set((state) => ({
      scenarios: [...state.scenarios, scenario],
    })),
  updateScenario: (id, updates) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      activeScenario: state.activeScenario?.id === id ? { ...state.activeScenario, ...updates } : state.activeScenario,
    })),
  setSelectedRobot: (robot) => set({ selectedRobot: robot }),
  setSelectedStation: (station) => set({ selectedStation: station }),
  setIsSimulating: (simulating) => set({ isSimulating: simulating }),
  setSimulationTime: (time) => set({ simulationTime: time }),

  addRobotToScenario: (scenarioId, robot) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) => (s.id === scenarioId ? { ...s, robots: [...s.robots, robot] } : s)),
      activeScenario:
        state.activeScenario?.id === scenarioId
          ? { ...state.activeScenario, robots: [...state.activeScenario.robots, robot] }
          : state.activeScenario,
    })),

  updateRobotInScenario: (scenarioId, robotId, updates) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === scenarioId ? { ...s, robots: s.robots.map((r) => (r.id === robotId ? { ...r, ...updates } : r)) } : s,
      ),
      activeScenario:
        state.activeScenario?.id === scenarioId
          ? {
              ...state.activeScenario,
              robots: state.activeScenario.robots.map((r) => (r.id === robotId ? { ...r, ...updates } : r)),
            }
          : state.activeScenario,
    })),

  removeRobotFromScenario: (scenarioId, robotId) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === scenarioId ? { ...s, robots: s.robots.filter((r) => r.id !== robotId) } : s,
      ),
      activeScenario:
        state.activeScenario?.id === scenarioId
          ? { ...state.activeScenario, robots: state.activeScenario.robots.filter((r) => r.id !== robotId) }
          : state.activeScenario,
    })),

  addMissionToScenario: (scenarioId, mission) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) => (s.id === scenarioId ? { ...s, missions: [...s.missions, mission] } : s)),
      activeScenario:
        state.activeScenario?.id === scenarioId
          ? { ...state.activeScenario, missions: [...state.activeScenario.missions, mission] }
          : state.activeScenario,
    })),

  updateMissionInScenario: (scenarioId, missionId, updates) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === scenarioId
          ? { ...s, missions: s.missions.map((m) => (m.id === missionId ? { ...m, ...updates } : m)) }
          : s,
      ),
      activeScenario:
        state.activeScenario?.id === scenarioId
          ? {
              ...state.activeScenario,
              missions: state.activeScenario.missions.map((m) => (m.id === missionId ? { ...m, ...updates } : m)),
            }
          : state.activeScenario,
    })),

  removeMissionFromScenario: (scenarioId, missionId) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === scenarioId ? { ...s, missions: s.missions.filter((m) => m.id !== missionId) } : s,
      ),
      activeScenario:
        state.activeScenario?.id === scenarioId
          ? { ...state.activeScenario, missions: state.activeScenario.missions.filter((m) => m.id !== missionId) }
          : state.activeScenario,
    })),
}))
