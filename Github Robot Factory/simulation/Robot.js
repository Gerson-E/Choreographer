import { findPath } from './pathfinding';

class Robot {
  constructor(id, mission, obstacles, p5) {
    this.id = id;
    this.mission = mission;
    this.position = p5.createVector(mission.start.x, mission.start.y);
    this.path = [];
    this.speed = 2;
    this.pathIndex = 0;
    this.totalDistance = 0;
    this.radius = 8;
    this.reachedDestination = false;
    this.isPaused = false;
    this.pauseTimer = 0;
    this.p5 = p5;
    
    // Calculate initial path
    this.path = findPath(mission.start, mission.end, obstacles, p5);
  }

  findPath(start, end, obstacles) {
    return findPath(start, end, obstacles, this.p5);
  }

  update(allRobots, obstacles, updateMetrics) {
    if (this.reachedDestination || this.path.length === 0) {
      return;
    }

    // Check for collisions first
    this.checkForCollisions(allRobots, updateMetrics);

    // If paused, don't move
    if (this.isPaused) {
      return;
    }

    if (this.pathIndex >= this.path.length) {
      this.reachedDestination = true;
      return;
    }

    const target = this.path[this.pathIndex];
    const direction = this.p5.Vector.sub(target, this.position);
    const distance = direction.mag();

    if (distance < this.speed) {
      // Close enough to the target point, move to next point
      this.position.set(target);
      this.pathIndex++;
    } else {
      // Move towards the target
      direction.normalize();
      direction.mult(this.speed);
      const previousPosition = this.position.copy();
      this.position.add(direction);
      
      // Track distance traveled
      this.totalDistance += this.p5.Vector.dist(previousPosition, this.position);
    }
  }

  checkForCollisions(allRobots, updateMetrics) {
    for (let otherRobot of allRobots) {
      if (otherRobot.id === this.id) continue; // Skip self
      
      const distance = this.p5.Vector.dist(this.position, otherRobot.position);
      const collisionRadius = this.radius + otherRobot.radius + 20; // 20px buffer
      
      if (distance < collisionRadius) {
        // Collision detected - robot with higher ID pauses
        if (this.id > otherRobot.id && !this.isPaused) {
          this.isPaused = true;
          this.pauseTimer = Date.now();
          
          // Update collision metrics
          updateMetrics({ collisionsAvoided: 1 });
          
          // Resume after 1 second
          setTimeout(() => {
            this.isPaused = false;
          }, 1000);
        }
      }
    }
  }

  recalculatePath(obstacles, p5Instance) {
    // Recalculate path from current position
    this.path = this.findPath(this.position, this.mission.end, obstacles);
    this.pathIndex = 0; // Start following new path from beginning
  }

  draw(p5) {
    // Draw the path as a faint line
    if (this.path.length > 1) {
      p5.stroke(100, 100, 255, 100);
      p5.strokeWeight(2);
      p5.noFill();
      p5.beginShape();
      p5.vertex(this.position.x, this.position.y);
      for (let i = this.pathIndex; i < this.path.length; i++) {
        p5.vertex(this.path[i].x, this.path[i].y);
      }
      p5.endShape();
    }

    // Draw collision detection radius when paused
    if (this.isPaused) {
      p5.fill(255, 100, 100, 50);
      p5.noStroke();
      p5.ellipse(this.position.x, this.position.y, (this.radius + 20) * 2, (this.radius + 20) * 2);
    }

    // Draw the robot with different colors based on state
    if (this.isPaused) {
      p5.fill(255, 100, 100); // Red when paused
    } else if (this.reachedDestination) {
      p5.fill(0, 255, 0); // Green when finished
    } else {
      p5.fill(0, 100, 255); // Blue when moving
    }
    
    p5.stroke(0, 50, 150);
    p5.strokeWeight(2);
    p5.ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);

    // Draw robot ID
    p5.fill(255);
    p5.textAlign(p5.CENTER);
    p5.textSize(10);
    p5.text(this.id, this.position.x, this.position.y + 3);

    // Draw direction indicator (only if not paused and not finished)
    if (!this.isPaused && !this.reachedDestination && this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const direction = p5.Vector.sub(target, this.position);
      if (direction.mag() > 0) {
        direction.normalize();
        direction.mult(this.radius + 5);
        const arrowEnd = p5.Vector.add(this.position, direction);
        
        p5.stroke(255, 255, 0);
        p5.strokeWeight(3);
        p5.line(this.position.x, this.position.y, arrowEnd.x, arrowEnd.y);
      }
    }

    // Draw pause indicator
    if (this.isPaused) {
      p5.fill(255, 0, 0);
      p5.textAlign(p5.CENTER);
      p5.textSize(8);
      p5.text('PAUSED', this.position.x, this.position.y - this.radius - 10);
    }
  }

  hasReachedDestination() {
    return this.reachedDestination;
  }

  getDistanceTraveled() {
    return this.totalDistance;
  }
}

export default Robot;