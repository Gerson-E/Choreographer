// Simple pathfinding utility for AMR simulation
export function findPath(start, end, obstacles, p5Instance) {
  // Create vectors for start and end points
  const startVec = p5Instance.createVector(start.x, start.y);
  const endVec = p5Instance.createVector(end.x, end.y);
  
  // Check if direct path is clear
  if (isPathClear(startVec, endVec, obstacles, p5Instance)) {
    return [startVec, endVec];
  }
  
  // If direct path is blocked, create a simple detour
  return createDetourPath(startVec, endVec, obstacles, p5Instance);
}

// Check if a straight line path is clear of obstacles
function isPathClear(start, end, obstacles, p5Instance) {
  for (let obstacle of obstacles) {
    if (lineIntersectsRect(start, end, obstacle, p5Instance)) {
      return false;
    }
  }
  return true;
}

// Check if a line intersects with a rectangle
function lineIntersectsRect(start, end, rect, p5Instance) {
  const { x, y, width, height } = rect;
  
  // Check if line intersects with any of the rectangle's edges
  const edges = [
    { start: p5Instance.createVector(x, y), end: p5Instance.createVector(x + width, y) }, // top
    { start: p5Instance.createVector(x + width, y), end: p5Instance.createVector(x + width, y + height) }, // right
    { start: p5Instance.createVector(x + width, y + height), end: p5Instance.createVector(x, y + height) }, // bottom
    { start: p5Instance.createVector(x, y + height), end: p5Instance.createVector(x, y) } // left
  ];
  
  for (let edge of edges) {
    if (lineIntersectsLine(start, end, edge.start, edge.end)) {
      return true;
    }
  }
  
  return false;
}

// Check if two line segments intersect
function lineIntersectsLine(p1, p2, p3, p4) {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 0.0001) return false; // Lines are parallel
  
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;
  
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// Create a simple detour path around obstacles
function createDetourPath(start, end, obstacles, p5Instance) {
  // Find the first obstacle that blocks the path
  let blockingObstacle = null;
  for (let obstacle of obstacles) {
    if (lineIntersectsRect(start, end, obstacle, p5Instance)) {
      blockingObstacle = obstacle;
      break;
    }
  }
  
  if (!blockingObstacle) {
    return [start, end];
  }
  
  // Create a simple two-turn path around the obstacle
  const { x, y, width, height } = blockingObstacle;
  const margin = 20; // Extra space around obstacle
  
  // Determine which side to go around based on start position
  const goRight = start.x < x;
  const goDown = start.y < y;
  
  let waypoint1, waypoint2;
  
  if (goRight) {
    // Go right around the obstacle
    waypoint1 = p5Instance.createVector(x + width + margin, start.y);
    waypoint2 = p5Instance.createVector(x + width + margin, end.y);
  } else {
    // Go left around the obstacle
    waypoint1 = p5Instance.createVector(x - margin, start.y);
    waypoint2 = p5Instance.createVector(x - margin, end.y);
  }
  
  // Check if the detour path is clear
  if (isPathClear(start, waypoint1, obstacles, p5Instance) && 
      isPathClear(waypoint1, waypoint2, obstacles, p5Instance) && 
      isPathClear(waypoint2, end, obstacles, p5Instance)) {
    return [start, waypoint1, waypoint2, end];
  }
  
  // If detour is still blocked, try a more complex path
  return createComplexDetour(start, end, obstacles, p5Instance);
}

// Create a more complex detour if simple detour fails
function createComplexDetour(start, end, obstacles, p5Instance) {
  // For now, just return a basic path that goes around all obstacles
  // This is a simplified approach - in a real implementation, you'd use A* or similar
  
  const waypoints = [start];
  
  // Add waypoints that avoid all obstacles
  for (let obstacle of obstacles) {
    const { x, y, width, height } = obstacle;
    const margin = 30;
    
    // Add waypoints around each obstacle
    waypoints.push(p5Instance.createVector(x - margin, y - margin));
    waypoints.push(p5Instance.createVector(x + width + margin, y - margin));
    waypoints.push(p5Instance.createVector(x + width + margin, y + height + margin));
    waypoints.push(p5Instance.createVector(x - margin, y + height + margin));
  }
  
  waypoints.push(end);
  
  // Filter out waypoints that are too close to obstacles
  const filteredWaypoints = waypoints.filter(waypoint => {
    for (let obstacle of obstacles) {
      const { x, y, width, height } = obstacle;
      if (waypoint.x >= x - 10 && waypoint.x <= x + width + 10 &&
          waypoint.y >= y - 10 && waypoint.y <= y + height + 10) {
        return false;
      }
    }
    return true;
  });
  
  return filteredWaypoints;
}
