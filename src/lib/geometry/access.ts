/**
 * AgriSensa Garden Studio — Accessibility Check
 *
 * Blueprint §8.2: "Jalur akses yang ditentukan harus tetap tersambung
 * dari pintu ke area layanan komponen wajib."
 *
 * Implementation: BFS on a 2D grid (ground plane).
 * A cell is walkable if it is:
 *   - Inside plot boundaries
 *   - Outside excluded zones
 *   - Not occupied by a blocking physical object (paths are walkable; beds, coops, ponds are not)
 *
 * An object is "accessible" if at least one walkable cell is adjacent to its footprint.
 * Only checked for objects with `required: true`.
 * Grid resolution: 0.5m (fast, sufficient for garden paths which are ≥0.6m).
 */

import type { GardenObject, Plot, Conflict, FacilityType } from '@/types/garden';
import { objectToAABB } from './types';

const GRID_RES = 0.5; // meters per grid cell

// Physical types that block walking
const BLOCKING_TYPES: FacilityType[] = [
  'raised_bed',
  'hydroponic',
  'pond',
  'chicken_coop',
  'water_source',
  'compost',
  'fixed_object',
];

interface Grid {
  cols: number;
  rows: number;
  walkable: Uint8Array; // 1 = walkable, 0 = blocked
}

function buildGrid(plot: Plot, objects: GardenObject[]): Grid {
  const cols = Math.ceil(plot.widthM / GRID_RES);
  const rows = Math.ceil(plot.depthM / GRID_RES);
  const walkable = new Uint8Array(cols * rows).fill(1);

  // Mark excluded zones as blocked
  for (const zone of plot.excludedZones) {
    const zoneZ = zone.z !== undefined ? zone.z : (zone.y ?? 0);
    const c0 = Math.floor(zone.x / GRID_RES);
    const c1 = Math.ceil((zone.x + zone.widthM) / GRID_RES);
    const r0 = Math.floor(zoneZ / GRID_RES);
    const r1 = Math.ceil((zoneZ + zone.depthM) / GRID_RES);
    for (let r = r0; r < r1 && r < rows; r++) {
      for (let c = c0; c < c1 && c < cols; c++) {
        walkable[r * cols + c] = 0;
      }
    }
  }

  // Mark blocking objects
  const blockers = objects.filter(o => BLOCKING_TYPES.includes(o.type || o.facilityType || 'raised_bed'));
  for (const obj of blockers) {
    const aabb = objectToAABB(obj);
    const c0 = Math.max(0, Math.floor(aabb.minX / GRID_RES));
    const c1 = Math.min(cols, Math.ceil(aabb.maxX / GRID_RES));
    const r0 = Math.max(0, Math.floor(aabb.minZ / GRID_RES));
    const r1 = Math.min(rows, Math.ceil(aabb.maxZ / GRID_RES));
    for (let r = r0; r < r1; r++) {
      for (let c = c0; c < c1; c++) {
        walkable[r * cols + c] = 0;
      }
    }
  }

  return { cols, rows, walkable };
}

/**
 * BFS from entrance cell. Returns a Set of reachable "r,c" cell keys.
 */
function bfsReachable(grid: Grid, entranceX: number, entranceZ: number): Set<number> {
  const startC = Math.min(grid.cols - 1, Math.max(0, Math.floor(entranceX / GRID_RES)));
  const startR = Math.min(grid.rows - 1, Math.max(0, Math.floor(entranceZ / GRID_RES)));

  const visited = new Set<number>();
  const queue: number[] = [];

  const startIdx = startR * grid.cols + startC;
  visited.add(startIdx);
  queue.push(startIdx);

  const neighbors = [-1, 1, -grid.cols, grid.cols]; // left, right, up, down

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currC = curr % grid.cols;

    for (const offset of neighbors) {
      const next = curr + offset;
      if (next < 0 || next >= grid.walkable.length) continue;

      // Prevent horizontal wrap-around
      const nextC = next % grid.cols;
      if (Math.abs(nextC - currC) > 1) continue;

      if (grid.walkable[next] === 1 && !visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return visited;
}

/**
 * Returns true if at least one cell adjacent to the object's footprint is reachable.
 */
function isObjectReachable(
  obj: GardenObject,
  grid: Grid,
  reachable: Set<number>
): boolean {
  const aabb = objectToAABB(obj);
  // Dilate by 1 cell in every direction to find adjacent cells
  const c0 = Math.max(0, Math.floor((aabb.minX - GRID_RES) / GRID_RES));
  const c1 = Math.min(grid.cols - 1, Math.ceil((aabb.maxX + GRID_RES) / GRID_RES));
  const r0 = Math.max(0, Math.floor((aabb.minZ - GRID_RES) / GRID_RES));
  const r1 = Math.min(grid.rows - 1, Math.ceil((aabb.maxZ + GRID_RES) / GRID_RES));

  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const idx = r * grid.cols + c;
      if (reachable.has(idx)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns accessibility conflicts for any required objects that cannot be reached.
 */
export function getAccessConflicts(
  objects: GardenObject[],
  plot: Plot
): Conflict[] {
  const requiredAccessObjects = objects.filter(o => o.required);
  if (requiredAccessObjects.length === 0) return [];

  const entranceZ = plot.entrance.z !== undefined ? plot.entrance.z : (plot.entrance.y ?? 0);
  const grid = buildGrid(plot, objects);
  const reachable = bfsReachable(grid, plot.entrance.x, entranceZ);

  const conflicts: Conflict[] = [];
  for (const obj of requiredAccessObjects) {
    if (!isObjectReachable(obj, grid, reachable)) {
      conflicts.push({
        id: `conflict_access_${obj.id}`,
        type: 'ACCESS_BLOCKED',
        ids: [obj.id],
        objectId: obj.id,
        message: `"${obj.label ?? obj.type}" tidak dapat dijangkau dari pintu masuk (resolusi grid: ${GRID_RES}m)`,
      });
    }
  }
  return conflicts;
}
