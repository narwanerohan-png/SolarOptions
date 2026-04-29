export interface Point {
  x: number;
  y: number;
}

export interface PanelConfig {
  width: number;
  height: number;
  spacing: number;
  wattage: number;
}

export function getPolygonArea(points: Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function calculatePanelPlacements(polygon: Point[], config: PanelConfig, margin: number = 0): Point[] {
  if (polygon.length < 3) return [];

  // Simple grid placement for now
  // Get bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  polygon.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  const placements: Point[] = [];
  const stepX = config.width + config.spacing;
  const stepY = config.height + config.spacing;
  const walkwayWidth = 0.6; // 600mm walkway

  let rowIndex = 0;
  for (let y = minY + config.height / 2 + margin; y <= maxY - margin; y += stepY) {
    // Add walkway every 3 rows
    if (rowIndex > 0 && rowIndex % 3 === 0) {
      y += walkwayWidth;
    }
    
    let colIndex = 0;
    for (let x = minX + config.width / 2 + margin; x <= maxX - margin; x += stepX) {
      // Add walkway every 5 panels
      if (colIndex > 0 && colIndex % 5 === 0) {
        x += walkwayWidth;
      }

      if (isPointInPolygon({ x, y }, polygon)) {
        placements.push({ x, y });
      }
      colIndex++;
    }
    rowIndex++;
  }

  return placements;
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
