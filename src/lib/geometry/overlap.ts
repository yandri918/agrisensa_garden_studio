/**
 * AgriSensa Garden Studio — Overlap Detection
 *
 * Layer rule (from blueprint §8.2):
 *   - Plants INSIDE a bed = not a physical conflict (different layer)
 *   - Pipes on utility layer = not a conflict with physical objects
 *   - Only PHYSICAL objects can conflict with each other
 *
 * Touching edges (shared boundary) is NOT considered overlap.
 */

import type { GardenObject, FacilityType, Conflict } from '@/types/garden';
import { objectToAABB, type AABB } from './types';

// Physical layer types — these CAN conflict with each other
const PHYSICAL_TYPES: FacilityType[] = [
  'raised_bed',
  'hydroponic',
  'pond',
  'chicken_coop',
  'path',
  'water_source',
  'compost',
  'decorative',
  'fixed_object',
];

/**
 * Returns true if two AABBs physically overlap (not just touch).
 * Touching edges (e.g. maxX of A === minX of B) is allowed.
 */
export function doAABBsOverlap(a: AABB, b: AABB): boolean {
  return (
    a.maxX > b.minX &&
    a.minX < b.maxX &&
    a.maxZ > b.minZ &&
    a.minZ < b.maxZ
  );
}

/**
 * Check if a single candidate AABB overlaps any existing object AABBs.
 * Excludes the object with `excludeId` (for checking against itself during drag).
 */
export function overlapsAny(
  candidate: AABB,
  objects: GardenObject[],
  excludeId?: string
): boolean {
  const physicals = objects.filter(
    o => PHYSICAL_TYPES.includes(o.type || o.facilityType || 'raised_bed') && o.id !== excludeId
  );
  return physicals.some(o => doAABBsOverlap(candidate, objectToAABB(o)));
}

/**
 * Returns all pairwise overlap conflicts among physical objects.
 * O(n²) — acceptable for garden-scale (< 100 objects).
 */
export function getOverlapConflicts(objects: GardenObject[]): Conflict[] {
  const physicals = objects.filter(o => PHYSICAL_TYPES.includes(o.type || o.facilityType || 'raised_bed'));
  const conflicts: Conflict[] = [];

  for (let i = 0; i < physicals.length; i++) {
    for (let j = i + 1; j < physicals.length; j++) {
      const a = physicals[i];
      const b = physicals[j];
      if (doAABBsOverlap(objectToAABB(a), objectToAABB(b))) {
        conflicts.push({
          id: `conflict_${a.id}_${b.id}`,
          type: 'OVERLAP',
          ids: [a.id, b.id],
          objectId: a.id,
          message: `"${a.label ?? a.type}" bertabrakan dengan "${b.label ?? b.type}"`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Returns overlap conflicts involving a specific object ID.
 * Useful for highlighting just the selected object's conflicts.
 */
export function getConflictsForObject(
  objectId: string,
  objects: GardenObject[]
): Conflict[] {
  return getOverlapConflicts(objects).filter(c => c.ids?.includes(objectId) || c.objectId === objectId);
}
