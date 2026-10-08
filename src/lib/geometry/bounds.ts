/**
 * AgriSensa Garden Studio — Boundary Validation
 * Hard rule: every object's footprint must be INSIDE the plot
 * and OUTSIDE all excluded zones.
 */

import type { Plot, Rect } from '@/types/garden';
import { type AABB } from './types';

/**
 * Returns true if the AABB is fully within the plot boundaries.
 * Plot origin is (0,0), extends to (widthM, depthM).
 */
export function isInsidePlot(aabb: AABB, plot: Plot): boolean {
  return (
    aabb.minX >= 0 &&
    aabb.maxX <= plot.widthM &&
    aabb.minZ >= 0 &&
    aabb.maxZ <= plot.depthM
  );
}

/**
 * Returns true if the AABB overlaps with an excluded zone rect.
 * (Touching edges is NOT considered overlap — objects may be placed
 * directly adjacent to excluded zones.)
 */
export function isInsideExcluded(aabb: AABB, zone: Rect): boolean {
  const zoneZ = zone.z !== undefined ? zone.z : (zone.y ?? 0);
  return !(
    aabb.maxX <= zone.x ||
    aabb.minX >= zone.x + zone.widthM ||
    aabb.maxZ <= zoneZ ||
    aabb.minZ >= zoneZ + zone.depthM
  );
}

/**
 * Returns true if the AABB is fully within the plot
 * and does not intersect any excluded zone.
 */
export function isPlaceable(aabb: AABB, plot: Plot): boolean {
  if (!isInsidePlot(aabb, plot)) return false;
  for (const zone of plot.excludedZones) {
    if (isInsideExcluded(aabb, zone)) return false;
  }
  return true;
}

/**
 * Returns a list of violated boundary rules for a given AABB.
 */
export function getBoundaryViolations(
  aabb: AABB,
  plot: Plot
): Array<'OUT_OF_BOUNDS' | 'IN_EXCLUDED_ZONE'> {
  const violations: Array<'OUT_OF_BOUNDS' | 'IN_EXCLUDED_ZONE'> = [];
  if (!isInsidePlot(aabb, plot)) violations.push('OUT_OF_BOUNDS');
  for (const zone of plot.excludedZones) {
    if (isInsideExcluded(aabb, zone)) {
      violations.push('IN_EXCLUDED_ZONE');
      break; // one report per object is enough
    }
  }
  return violations;
}

/**
 * Clamps an AABB to stay within plot boundaries.
 * Use this when snapping a dragged object back within bounds.
 */
export function clampAABBToPlot(
  aabb: AABB,
  plot: Plot
): AABB {
  const w = aabb.maxX - aabb.minX;
  const d = aabb.maxZ - aabb.minZ;

  const minX = Math.max(0, Math.min(aabb.minX, plot.widthM - w));
  const minZ = Math.max(0, Math.min(aabb.minZ, plot.depthM - d));

  return {
    minX,
    maxX: minX + w,
    minZ,
    maxZ: minZ + d,
  };
}
