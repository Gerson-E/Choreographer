import React, { useState, useRef } from 'react';
import p5 from 'p5';
import FactoryFloor from './components/FactoryFloor';
import Controls from './components/Controls';
import Robot from './simulation/Robot';
import { findPath } from './simulation/pathfinding';
import './App.css';

function App() {
  // Advanced state management
  const [simulation, setSimulation] = useState({
    state: 'stopped', // 'stopped', 'running', 'finished'
    robots: [],
    obstacles: [
      { x: 200, y: 150, width: 100, height: 80 },
      { x: 400, y: 300, width: 120, height: 60 },
      { x: 150, y: 400, width: 80, height: 100 },
      { x: 500, y: 100, width: 60, height: 120 }
    ],
    startTime: 0,
    finishTime: 0
  });

  const [metrics, setMetrics] = useState({
    time: 0,
    distance: 0,
    collisionsAvoided: 0
  });

  const p5InstanceRef = useRef(null);

  // Initialize p5 instance for pathfinding calculations
  React.useEffect(() => {
    // Create a proper p5 instance with a dummy sketch
    p5InstanceRef.current = new p5((p) => {
      p.setup = () => {
        // Dummy setup - we don't need a canvas for pathfinding
      };
      p.draw = () => {
        // Dummy draw - we don't need animation for pathfinding
      };
    });
  }, []);

  const startSimulation = () => {
    if (simulation.state === 'running') return;

    // Reset metrics
    setMetrics({ time: 0, distance: 0, collisionsAvoided: 0 });

    // Create two robots with different missions
    const robot1 = new Robot(
      1, 
      { start: { x: 50, y: 50 }, end: { x: 750, y: 550 } }, 
      simulation.obstacles, 
      p5InstanceRef.current
    );
    
    const robot2 = new Robot(
      2, 
      { start: { x: 750, y: 50 }, end: { x: 50, y: 550 } }, 
      simulation.obstacles, 
      p5InstanceRef.current
    );

    // Update simulation state
    setSimulation({
      ...simulation,
      state: 'running',
      robots: [robot1, robot2],
      startTime: Date.now()
    });
  };

  const stopSimulation = () => {
    const finishTime = Date.now();
    setSimulation(prev => ({
      ...prev,
      state: 'finished',
      finishTime: finishTime
    }));
  };

  const resetSimulation = () => {
    setSimulation({
      state: 'stopped',
      robots: [],
      obstacles: [
        { x: 200, y: 150, width: 100, height: 80 },
        { x: 400, y: 300, width: 120, height: 60 },
        { x: 150, y: 400, width: 80, height: 100 },
        { x: 500, y: 100, width: 60, height: 120 }
      ],
      startTime: 0,
      finishTime: 0
    });
    setMetrics({ time: 0, distance: 0, collisionsAvoided: 0 });
  };

  const addObstacle = (x, y) => {
    const newObstacle = { x: x - 25, y: y - 25, width: 50, height: 50 };
    
    setSimulation(prev => {
      const updatedObstacles = [...prev.obstacles, newObstacle];
      const updatedRobots = prev.robots.map(robot => {
        robot.recalculatePath(updatedObstacles, p5InstanceRef.current);
        return robot;
      });
      
      return {
        ...prev,
        obstacles: updatedObstacles,
        robots: updatedRobots
      };
    });
  };

  const updateMetrics = (newMetrics) => {
    setMetrics(prev => ({ ...prev, ...newMetrics }));
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Choreographer - AMR Simulation</h1>
        <p>Interactive Multi-Robot Factory Floor Simulation</p>
      </header>
      
      <main className="app-main">
        <Controls
          startSimulation={startSimulation}
          stopSimulation={stopSimulation}
          resetSimulation={resetSimulation}
          simulationState={simulation.state}
          metrics={metrics}
        />
        
        <FactoryFloor
          simulation={simulation}
          addObstacle={addObstacle}
          stopSimulation={stopSimulation}
          updateMetrics={updateMetrics}
        />
      </main>
    </div>
  );
}

export default App;