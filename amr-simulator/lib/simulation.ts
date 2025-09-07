import type { Scenario, Robot, Mission } from "./store"

export interface SimulationRobot {
  id: string
  robotType: Robot
  position: { x: number; y: number }
  targetPosition: { x: number; y: number }
  currentMission: Mission | null
  currentStep: number
  batteryLevel: number
  status: "idle" | "moving" | "working" | "charging"
  path: Array<{ x: number; y: number }>
  completedMissions: number
}

export interface SimulationState {
  robots: SimulationRobot[]
  time: number
  isRunning: boolean
  congestionMap: Map<string, number>
  missionQueue: Array<{ mission: Mission; assignedRobot?: string }>
  completedMissions: Array<{ mission: Mission; completionTime: number; robot: string }>
}

export class SimulationEngine {
  private scenario: Scenario
  private state: SimulationState
  private onUpdate: (state: SimulationState) => void

  constructor(scenario: Scenario, onUpdate: (state: SimulationState) => void) {
    this.scenario = scenario
    this.onUpdate = onUpdate
    this.state = this.initializeSimulation()
  }

  private initializeSimulation(): SimulationState {
    const robots: SimulationRobot[] = []

    // Create robot instances based on fleet size
    for (let i = 0; i < this.scenario.parameters.fleetSize; i++) {
      const robotType = this.scenario.robots[i % this.scenario.robots.length]
      const chargerStation = this.scenario.stations.find((s) => s.type === "charger")

      robots.push({
        id: `robot-${i}`,
        robotType,
        position: chargerStation
          ? { x: chargerStation.position.x * 50 + 100, y: chargerStation.position.y * 50 + 100 }
          : { x: 100, y: 100 },
        targetPosition: chargerStation
          ? { x: chargerStation.position.x * 50 + 100, y: chargerStation.position.y * 50 + 100 }
          : { x: 100, y: 100 },
        currentMission: null,
        currentStep: 0,
        batteryLevel: 1.0,
        status: "idle",
        path: [],
        completedMissions: 0,
      })
    }

    // Initialize mission queue with repeated missions
    const missionQueue = []
    for (let i = 0; i < 50; i++) {
      const mission = this.scenario.missions[i % this.scenario.missions.length]
      missionQueue.push({ mission: { ...mission, id: `${mission.id}-${i}` } })
    }

    return {
      robots,
      time: 0,
      isRunning: false,
      congestionMap: new Map(),
      missionQueue,
      completedMissions: [],
    }
  }

  public start() {
    this.state.isRunning = true
  }

  public pause() {
    this.state.isRunning = false
  }

  public reset() {
    this.state = this.initializeSimulation()
    this.onUpdate(this.state)
  }

  public setTime(time: number) {
    this.state.time = time
    this.updateRobotPositions()
    this.onUpdate(this.state)
  }

  public step(deltaTime: number) {
    if (!this.state.isRunning) return

    this.state.time += deltaTime

    // Assign missions to idle robots
    this.assignMissions()

    // Update robot positions and states
    this.updateRobots(deltaTime)

    // Update congestion map
    this.updateCongestionMap()

    this.onUpdate(this.state)
  }

  private assignMissions() {
    const idleRobots = this.state.robots.filter((r) => r.status === "idle")
    const unassignedMissions = this.state.missionQueue.filter((m) => !m.assignedRobot)

    for (const robot of idleRobots) {
      if (unassignedMissions.length === 0) break

      const mission = unassignedMissions[0]
      mission.assignedRobot = robot.id
      robot.currentMission = mission.mission
      robot.currentStep = 0
      robot.status = "moving"

      // Set target to first station
      const firstStation = this.scenario.stations.find((s) => s.id === mission.mission.steps[0].stationId)
      if (firstStation) {
        robot.targetPosition = {
          x: firstStation.position.x * 50 + 100,
          y: firstStation.position.y * 50 + 100,
        }
        robot.path = this.calculatePath(robot.position, robot.targetPosition)
      }
    }
  }

  private updateRobots(deltaTime: number) {
    for (const robot of this.state.robots) {
      if (robot.status === "moving") {
        this.moveRobot(robot, deltaTime)
      } else if (robot.status === "working") {
        this.updateWorkingRobot(robot, deltaTime)
      }

      // Update battery level
      if (robot.status !== "charging") {
        robot.batteryLevel = Math.max(0, robot.batteryLevel - deltaTime * 0.0001)
      } else {
        robot.batteryLevel = Math.min(1, robot.batteryLevel + deltaTime * 0.001)
      }
    }
  }

  private moveRobot(robot: SimulationRobot, deltaTime: number) {
    const speed = robot.robotType.speed * 50 // Convert to pixels per second
    const dx = robot.targetPosition.x - robot.position.x
    const dy = robot.targetPosition.y - robot.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 5) {
      // Reached target
      robot.position = { ...robot.targetPosition }
      robot.status = "working"
      return
    }

    // Move towards target
    const moveDistance = (speed * deltaTime) / 1000
    robot.position.x += (dx / distance) * moveDistance
    robot.position.y += (dy / distance) * moveDistance
  }

  private updateWorkingRobot(robot: SimulationRobot, deltaTime: number) {
    if (!robot.currentMission) return

    const currentStep = robot.currentMission.steps[robot.currentStep]
    if (!currentStep) return

    // Simulate work duration (simplified)
    setTimeout(() => {
      robot.currentStep++

      if (robot.currentStep >= robot.currentMission!.steps.length) {
        // Mission completed
        this.state.completedMissions.push({
          mission: robot.currentMission!,
          completionTime: this.state.time,
          robot: robot.id,
        })

        robot.completedMissions++
        robot.currentMission = null
        robot.currentStep = 0
        robot.status = "idle"

        // Remove from mission queue
        this.state.missionQueue = this.state.missionQueue.filter((m) => m.assignedRobot !== robot.id)
      } else {
        // Move to next step
        const nextStep = robot.currentMission!.steps[robot.currentStep]
        const nextStation = this.scenario.stations.find((s) => s.id === nextStep.stationId)

        if (nextStation) {
          robot.targetPosition = {
            x: nextStation.position.x * 50 + 100,
            y: nextStation.position.y * 50 + 100,
          }
          robot.path = this.calculatePath(robot.position, robot.targetPosition)
          robot.status = "moving"
        }
      }
    }, currentStep.duration * 10) // Accelerated time
  }

  private calculatePath(from: { x: number; y: number }, to: { x: number; y: number }) {
    // Simple straight-line path for now
    return [from, to]
  }

  private updateRobotPositions() {
    // Update robot positions based on current time for scrubbing
    for (const robot of this.state.robots) {
      // Simplified position calculation based on time
      const timeProgress = (this.state.time / 1000) % 60 // 60 second cycle
      const angle = (timeProgress / 60) * 2 * Math.PI
      const centerX = 300
      const centerY = 300
      const radius = 100

      robot.position = {
        x: centerX + Math.cos(angle + robot.id.charCodeAt(robot.id.length - 1)) * radius,
        y: centerY + Math.sin(angle + robot.id.charCodeAt(robot.id.length - 1)) * radius,
      }
    }
  }

  private updateCongestionMap() {
    this.state.congestionMap.clear()

    // Calculate congestion based on robot density
    for (const robot of this.state.robots) {
      const gridX = Math.floor(robot.position.x / 50)
      const gridY = Math.floor(robot.position.y / 50)
      const key = `${gridX},${gridY}`

      this.state.congestionMap.set(key, (this.state.congestionMap.get(key) || 0) + 1)
    }
  }

  public getState(): SimulationState {
    return this.state
  }
}
