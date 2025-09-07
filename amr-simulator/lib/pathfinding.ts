// Pathfinding utility for AMR simulation
// Adapted from GitHub Robot Factory project

export interface Point {
  x: number;
  y: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function findPath(start: Point, end: Point, obstacles: Obstacle[]): Point[] {
  // Create points for start and end
  const startPoint: Point = { x: start.x, y: start.y };
  const endPoint: Point = { x: end.x, y: end.y };
  
  // Check if direct path is clear
  if (isPathClear(startPoint, endPoint, obstacles)) {
    return [startPoint, endPoint];
  }
  
  // If direct path is blocked, create a simple detour
  return createDetourPath(startPoint, endPoint, obstacles);
}

// Check if a straight line path is clear of obstacles
function isPathClear(start: Point, end: Point, obstacles: Obstacle[]): boolean {
  for (let obstacle of obstacles) {
    if (lineIntersectsRect(start, end, obstacle)) {
      return false;
    }
  }
  return true;
}

// Check if a line intersects with a rectangle
function lineIntersectsRect(start: Point, end: Point, rect: Obstacle): boolean {
  const { x, y, width, height } = rect;
  
  // Check if line intersects with any of the rectangle's edges
  const edges = [
    { start: { x, y }, end: { x: x + width, y } }, // top
    { start: { x: x + width, y }, end: { x: x + width, y: y + height } }, // right
    { start: { x: x + width, y: y + height }, end: { x, y: y + height } }, // bottom
    { start: { x, y: y + height }, end: { x, y } } // left
  ];
  
  for (let edge of edges) {
    if (lineIntersectsLine(start, end, edge.start, edge.end)) {
      return true;
    }
  }
  
  return false;
}

// Check if two line segments intersect
function lineIntersectsLine(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 0.0001) return false; // Lines are parallel
  
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;
  
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// Create a simple detour path around obstacles
function createDetourPath(start: Point, end: Point, obstacles: Obstacle[]): Point[] {
  // Find the first obstacle that blocks the path
  let blockingObstacle: Obstacle | null = null;
  for (let obstacle of obstacles) {
    if (lineIntersectsRect(start, end, obstacle)) {
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
  
  let waypoint1: Point, waypoint2: Point;
  
  if (goRight) {
    // Go right around the obstacle
    waypoint1 = { x: x + width + margin, y: start.y };
    waypoint2 = { x: x + width + margin, y: end.y };
  } else {
    // Go left around the obstacle
    waypoint1 = { x: x - margin, y: start.y };
    waypoint2 = { x: x - margin, y: end.y };
  }
  
  // Check if the detour path is clear
  if (isPathClear(start, waypoint1, obstacles) && 
      isPathClear(waypoint1, waypoint2, obstacles) && 
      isPathClear(waypoint2, end, obstacles)) {
    return [start, waypoint1, waypoint2, end];
  }
  
  // If detour is still blocked, try a more complex path
  return createComplexDetour(start, end, obstacles);
}

// Create a more complex detour if simple detour fails
function createComplexDetour(start: Point, end: Point, obstacles: Obstacle[]): Point[] {
  // For now, just return a basic path that goes around all obstacles
  // This is a simplified approach - in a real implementation, you'd use A* or similar
  
  const waypoints: Point[] = [start];
  
  // Add waypoints that avoid all obstacles
  for (let obstacle of obstacles) {
    const { x, y, width, height } = obstacle;
    const margin = 30;
    
    // Add waypoints around each obstacle
    waypoints.push({ x: x - margin, y: y - margin });
    waypoints.push({ x: x + width + margin, y: y - margin });
    waypoints.push({ x: x + width + margin, y: y + height + margin });
    waypoints.push({ x: x - margin, y: y + height + margin });
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

// Calculate distance between two points
export function calculateDistance(point1: Point, point2: Point): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Normalize a vector (convert to unit vector)
export function normalizeVector(point: Point): Point {
  const magnitude = Math.sqrt(point.x * point.x + point.y * point.y);
  if (magnitude === 0) return { x: 0, y: 0 };
  return { x: point.x / magnitude, y: point.y / magnitude };
}

// Multiply a vector by a scalar
export function multiplyVector(point: Point, scalar: number): Point {
  return { x: point.x * scalar, y: point.y * scalar };
}

// Add two vectors
export function addVectors(point1: Point, point2: Point): Point {
  return { x: point1.x + point2.x, y: point1.y + point2.y };
}

// Subtract two vectors
export function subtractVectors(point1: Point, point2: Point): Point {
  return { x: point1.x - point2.x, y: point1.y - point2.y };
}
