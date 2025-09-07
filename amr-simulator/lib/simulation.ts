import type { Scenario, Robot, Mission } from "./store"
import { findPath, calculateDistance, normalizeVector, multiplyVector, addVectors, subtractVectors, type Point, type Obstacle } from "./pathfinding"

export interface SimulationRobot {
  id: string
  robotType: Robot
  position: { x: number; y: number }
  targetPosition: { x: number; y: number }
  currentMission: Mission | null
  currentStep: number
  batteryLevel: number
  status: "idle" | "moving" | "working" | "charging"
  path: Point[]
  pathIndex: number
  speed: number
  radius: number
  reachedDestination: boolean
  isPaused: boolean
  pauseTimer: number
  totalDistance: number
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
    if (!scenario) {
      throw new Error('SimulationEngine requires a valid scenario')
    }
    if (!onUpdate || typeof onUpdate !== 'function') {
      throw new Error('SimulationEngine requires a valid onUpdate callback')
    }
    
    this.scenario = scenario
    this.onUpdate = onUpdate
    this.state = this.initializeSimulation()
    
    console.log('SimulationEngine initialized with scenario:', scenario.name)
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
        pathIndex: 0,
        speed: robotType.speed * 50, // Convert m/s to pixels per second
        radius: 8,
        reachedDestination: false,
        isPaused: false,
        pauseTimer: 0,
        totalDistance: 0,
        completedMissions: 0,
      })
    }

    // Initialize mission queue with repeated missions
    const missionQueue = []
    if (this.scenario.missions && this.scenario.missions.length > 0) {
      for (let i = 0; i < 50; i++) {
        const mission = this.scenario.missions[i % this.scenario.missions.length]
        // Only add missions that have valid steps
        if (mission && mission.steps && mission.steps.length > 0) {
          missionQueue.push({ mission: { ...mission, id: `${mission.id}-${i}` } })
        }
      }
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
    // Validate scenario data before starting
    if (!this.scenario || !this.scenario.missions || this.scenario.missions.length === 0) {
      console.error('Cannot start simulation: No valid missions found')
      return
    }

    // Validate that all missions have valid steps
    const invalidMissions = this.scenario.missions.filter(mission => 
      !mission.steps || mission.steps.length === 0
    )
    
    if (invalidMissions.length > 0) {
      console.error('Cannot start simulation: Found missions without valid steps:', invalidMissions)
      return
    }

    // Validate that all mission steps reference valid stations
    for (const mission of this.scenario.missions) {
      for (const step of mission.steps) {
        const station = this.scenario.stations.find(s => s.id === step.stationId)
        if (!station) {
          console.error(`Cannot start simulation: Mission ${mission.id} references invalid station ${step.stationId}`)
          return
        }
      }
    }

    console.log('Starting simulation with', this.scenario.missions.length, 'missions and', this.scenario.stations.length, 'stations')
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

    try {
      this.state.time += deltaTime

      // Assign missions to idle robots
      this.assignMissions()

      // Update robot positions and states
      this.updateRobots(deltaTime)

      // Update congestion map
      this.updateCongestionMap()

      this.onUpdate(this.state)
    } catch (error) {
      console.error('Error in simulation step:', error)
      // Pause simulation on error to prevent further issues
      this.state.isRunning = false
    }
  }

  private assignMissions() {
    const idleRobots = this.state.robots.filter((r) => r.status === "idle")
    const unassignedMissions = this.state.missionQueue.filter((m) => !m.assignedRobot)

    console.log('Assigning missions:', { idleRobots: idleRobots.length, unassignedMissions: unassignedMissions.length })

    for (const robot of idleRobots) {
      if (unassignedMissions.length === 0) break

      const mission = unassignedMissions[0]
      
      // Check if mission and steps exist
      if (!mission.mission || !mission.mission.steps || mission.mission.steps.length === 0) {
        console.warn('Invalid mission found, skipping:', mission)
        continue
      }
      
      mission.assignedRobot = robot.id
      robot.currentMission = mission.mission
      robot.currentStep = 0
      robot.status = "moving"
      robot.reachedDestination = false
      robot.pathIndex = 0

      // Set target to first station and calculate path
      const firstStep = mission.mission.steps[0]
      if (firstStep && firstStep.stationId) {
        const firstStation = this.scenario.stations.find((s) => s.id === firstStep.stationId)
        if (firstStation) {
          robot.targetPosition = {
            x: firstStation.position.x * 50 + 100,
            y: firstStation.position.y * 50 + 100,
          }
          
          // Calculate path using pathfinding algorithm
          const obstacles = this.getObstacles()
          robot.path = findPath(robot.position, robot.targetPosition, obstacles)
          
          console.log(`Robot ${robot.id} assigned mission, path length:`, robot.path.length, 'target:', robot.targetPosition)
        }
      }
    }
  }

  private updateRobots(deltaTime: number) {
    for (const robot of this.state.robots) {
      try {
        if (robot.status === "moving") {
          this.moveRobot(robot, deltaTime)
        } else if (robot.status === "working") {
          // Double-check that we have a valid mission before calling updateWorkingRobot
          if (robot.currentMission && robot.currentMission.steps && robot.currentMission.steps.length > 0) {
            this.updateWorkingRobot(robot, deltaTime)
          } else {
            // If no valid mission, reset robot to idle
            console.warn('Robot in working status but has no valid mission, resetting to idle:', robot.id)
            robot.status = "idle"
            robot.currentMission = null
            robot.currentStep = 0
          }
        }

        // Update battery level
        if (robot.status !== "charging") {
          robot.batteryLevel = Math.max(0, robot.batteryLevel - deltaTime * 0.00001) // Much slower drain
        } else {
          robot.batteryLevel = Math.min(1, robot.batteryLevel + deltaTime * 0.0001) // Slower charge
        }
      } catch (error) {
        console.error('Error updating robot:', robot.id, error)
        // Reset robot to safe state
        robot.status = "idle"
        robot.currentMission = null
        robot.currentStep = 0
      }
    }
  }

  private moveRobot(robot: SimulationRobot, deltaTime: number) {
    // Check for collisions first
    this.checkForCollisions(robot)

    // If paused, don't move
    if (robot.isPaused) {
      return
    }

    if (robot.reachedDestination || robot.path.length === 0) {
      return
    }

    if (robot.pathIndex >= robot.path.length) {
      robot.reachedDestination = true
      // Only transition to working if we have a valid mission
      if (robot.currentMission && robot.currentMission.steps && robot.currentMission.steps.length > 0) {
        robot.status = "working"
      } else {
        // If no valid mission, go back to idle
        robot.status = "idle"
        console.warn('Robot reached target but has no valid mission, setting to idle:', robot.id)
      }
      return
    }

    const target = robot.path[robot.pathIndex]
    const direction = subtractVectors(target, robot.position)
    const distance = calculateDistance(robot.position, target)

    // Convert speed from pixels per second to pixels per frame
    const moveDistance = (robot.speed * deltaTime) / 1000

    if (distance < moveDistance) {
      // Close enough to the target point, move to next point
      robot.position = { ...target }
      robot.pathIndex++
      console.log(`Robot ${robot.id} reached waypoint ${robot.pathIndex - 1}, moving to next`)
    } else {
      // Move towards the target
      const normalizedDirection = normalizeVector(direction)
      const moveVector = multiplyVector(normalizedDirection, moveDistance)
      const previousPosition = { ...robot.position }
      robot.position = addVectors(robot.position, moveVector)
      
      // Track distance traveled
      robot.totalDistance += calculateDistance(previousPosition, robot.position)
      
      // Debug every 60 frames (about once per second)
      if (Math.random() < 0.016) {
        console.log(`Robot ${robot.id} moving: pos=${JSON.stringify(robot.position)}, target=${JSON.stringify(target)}, distance=${distance.toFixed(2)}`)
      }
    }
  }

  private updateWorkingRobot(robot: SimulationRobot, deltaTime: number) {
    if (!robot.currentMission || !robot.currentMission.steps) return

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
        if (nextStep && nextStep.stationId) {
          const nextStation = this.scenario.stations.find((s) => s.id === nextStep.stationId)

          if (nextStation) {
            robot.targetPosition = {
              x: nextStation.position.x * 50 + 100,
              y: nextStation.position.y * 50 + 100,
            }
            
            // Calculate new path using pathfinding
            const obstacles = this.getObstacles()
            robot.path = findPath(robot.position, robot.targetPosition, obstacles)
            robot.pathIndex = 0
            robot.reachedDestination = false
            robot.status = "moving"
          }
        }
      }
    }, currentStep.duration * 10) // Accelerated time
  }

  private checkForCollisions(robot: SimulationRobot) {
    for (let otherRobot of this.state.robots) {
      if (otherRobot.id === robot.id) continue // Skip self
      
      const distance = calculateDistance(robot.position, otherRobot.position)
      const collisionRadius = robot.radius + otherRobot.radius + 20 // 20px buffer
      
      if (distance < collisionRadius) {
        // Collision detected - robot with higher ID pauses
        if (robot.id > otherRobot.id && !robot.isPaused) {
          robot.isPaused = true
          robot.pauseTimer = Date.now()
          
          // Resume after 1 second
          setTimeout(() => {
            robot.isPaused = false
          }, 1000)
        }
      }
    }
  }

  private getObstacles(): Obstacle[] {
    // Convert stations to obstacles for pathfinding
    return this.scenario.stations.map(station => ({
      x: station.position.x * 50 + 100 - 15, // Convert to pixel coordinates and add padding
      y: station.position.y * 50 + 100 - 15,
      width: 30, // Station size
      height: 30
    }))
  }

  private calculatePath(from: { x: number; y: number }, to: { x: number; y: number }) {
    // This method is now replaced by the pathfinding algorithm
    // Keep for backward compatibility but use findPath instead
    const obstacles = this.getObstacles()
    return findPath(from, to, obstacles)
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
