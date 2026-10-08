/**
 * AgriSensa Garden Studio — Area Calculations
 *
 * Blueprint §8.4:
 *   - Used area = union footprint (not sum — avoids double counting overlaps)
 *   - Show breakdown: excluded / facilities / paths / remaining
 *   - "Remaining" ≠ plantable; shape and access still matter
 */

import type { GardenObject, Plot, AreaBreakdown } from '@/types/garden';
import { objectToAABB } from './types';

const RASTER_RESOLUTION = 0.05; // 5cm cells for union area calculation

/**
 * Rasterizes a set of AABBs onto a grid and counts occupied cells.
 * Returns the union area in m².
 *
 * Approach: grid-based rasterization — avoids complex polygon boolean math.
 * Documented limitation: resolution-dependent accuracy (±resolution² per object edge).
 */
function rasterUnionArea(
  objects: GardenObject[],
  plotWidthM: number,
  plotDepthM: number,
  resolution = RASTER_RESOLUTION
): number {
  const cols = Math.ceil(plotWidthM / resolution);
  const rows = Math.ceil(plotDepthM / resolution);
  const grid = new Uint8Array(cols * rows); // 0 = empty, 1 = occupied

  for (const obj of objects) {
    const aabb = objectToAABB(obj);
    const c0 = Math.max(0, Math.floor(aabb.minX / resolution));
    const c1 = Math.min(cols - 1, Math.ceil(aabb.maxX / resolution) - 1);
    const r0 = Math.max(0, Math.floor(aabb.minZ / resolution));
    const r1 = Math.min(rows - 1, Math.ceil(aabb.maxZ / resolution) - 1);

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        grid[r * cols + c] = 1;
      }
    }
  }

  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]) count++;
  }

  return count * resolution * resolution;
}

/**
 * Computes the union area (m²) of a list of garden objects.
 */
export function computeUnionArea(objects: GardenObject[], plot: Plot): number {
  if (objects.length === 0) return 0;
  return rasterUnionArea(objects, plot.widthM, plot.depthM);
}

/**
 * Returns a full breakdown of how the plot area is allocated.
 * Uses rasterization for union areas to avoid double-counting.
 */
export function breakdownAreas(objects: GardenObject[], plot: Plot): AreaBreakdown {
  const plotTotal = plot.widthM * plot.depthM;

  // Excluded zones (simple sum — zones should not overlap each other)
  const excluded = plot.excludedZones.reduce(
    (sum, z) => sum + z.widthM * z.depthM,
    0
  );

  // Facilities (physical objects except paths)
  const facilityObjects = objects.filter(o => o.type !== 'path');
  const facilities = rasterUnionArea(facilityObjects, plot.widthM, plot.depthM);

  // Paths
  const pathObjects = objects.filter(o => o.type === 'path');
  const paths = rasterUnionArea(pathObjects, plot.widthM, plot.depthM);

  // All occupied (union of everything)
  const allOccupied = rasterUnionArea(objects, plot.widthM, plot.depthM);

  const remaining = Math.max(0, plotTotal - excluded - allOccupied);

  return {
    plotTotal: round2(plotTotal),
    excluded: round2(excluded),
    facilities: round2(facilities),
    paths: round2(paths),
    remaining: round2(remaining),
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
