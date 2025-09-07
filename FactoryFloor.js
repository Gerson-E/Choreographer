import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

const FactoryFloor = ({ simulation, addObstacle, stopSimulation, updateMetrics }) => {
  const canvasRef = useRef(null);
  const p5InstanceRef = useRef(null);

  useEffect(() => {
    const sketch = (p5) => {
      p5.setup = () => {
        const canvas = p5.createCanvas(800, 600);
        canvas.parent(canvasRef.current);
        p5.background(240);
      };

      p5.draw = () => {
        // Clear background
        p5.background(240);

        // Draw obstacles
        p5.fill(100, 100, 100);
        p5.stroke(80, 80, 80);
        p5.strokeWeight(2);
        simulation.obstacles.forEach(obstacle => {
          p5.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        // Draw mission start and end points for each robot
        if (simulation.state === 'stopped' || simulation.state === 'running') {
          simulation.robots.forEach((robot, index) => {
            // Draw start point
            p5.fill(0, 255, 0);
            p5.stroke(0, 200, 0);
            p5.strokeWeight(2);
            p5.ellipse(robot.mission.start.x, robot.mission.start.y, 16, 16);
            p5.fill(0);
            p5.textAlign(p5.CENTER);
            p5.text(`START ${robot.id}`, robot.mission.start.x, robot.mission.start.y + 20);

            // Draw end point
            p5.fill(255, 0, 0);
            p5.stroke(200, 0, 0);
            p5.strokeWeight(2);
            p5.ellipse(robot.mission.end.x, robot.mission.end.y, 16, 16);
            p5.fill(0);
            p5.textAlign(p5.CENTER);
            p5.text(`END ${robot.id}`, robot.mission.end.x, robot.mission.end.y + 20);
          });
        }

        // Update and draw robots
        if (simulation.state === 'running') {
          simulation.robots.forEach(robot => {
            // Pass all robots for collision detection
            robot.update(simulation.robots, simulation.obstacles, updateMetrics);
            robot.draw(p5);
          });

          // Check if all robots have reached their destination
          const allRobotsFinished = simulation.robots.every(robot => robot.hasReachedDestination());
          if (allRobotsFinished && simulation.robots.length > 0) {
            // Calculate final metrics
            const totalDistance = simulation.robots.reduce((sum, robot) => sum + robot.getDistanceTraveled(), 0);
            const missionTime = (Date.now() - simulation.startTime) / 1000; // Convert to seconds
            
            updateMetrics({
              time: missionTime.toFixed(2),
              distance: Math.round(totalDistance)
            });
            
            // Stop the simulation
            stopSimulation();
          }
        }

        // Draw robots even when simulation is stopped (for visualization)
        if (simulation.state === 'stopped' && simulation.robots.length > 0) {
          simulation.robots.forEach(robot => {
            robot.draw(p5);
          });
        }

        // Draw instructions
        if (simulation.state === 'running') {
          p5.fill(0, 0, 0, 150);
          p5.noStroke();
          p5.rect(10, 10, 200, 60);
          p5.fill(255);
          p5.textAlign(p5.LEFT);
          p5.textSize(12);
          p5.text('Click to add obstacles', 20, 30);
          p5.text('Robots will recalculate paths', 20, 45);
        }
      };

      // Mouse click handler for adding obstacles
      p5.mousePressed = () => {
        if (simulation.state === 'running') {
          addObstacle(p5.mouseX, p5.mouseY);
        }
      };
    };

    // Create p5 instance
    p5InstanceRef.current = new p5(sketch);

    // Cleanup function
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, [simulation, addObstacle, stopSimulation, updateMetrics]);

  return (
    <div className="factory-floor">
      <div ref={canvasRef}></div>
    </div>
  );
};

export default FactoryFloor;
