/**
 * AgriSensa Garden Studio — Geometry Primitives & Types
 * Foundation for all spatial calculations.
 * All units in meters (m).
 */

import type { GardenObject, RotationDeg } from '@/types/garden';

// ─── Axis-Aligned Bounding Box ────────────────────────────────────────────────

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Converts a GardenObject to its footprint AABB on the ground plane.
 * Handles 0/90/180/270° rotation — swaps width↔depth on 90°/270°.
 * Position is the center of the object (or top-left if configured).
 */
export function objectToAABB(obj: GardenObject): AABB {
  const isTransposed = obj.rotationDeg === 90 || obj.rotationDeg === 270;
  const w = isTransposed ? obj.size.depthM : obj.size.widthM;
  const d = isTransposed ? obj.size.widthM : obj.size.depthM;

  const posX = obj.position.x;
  const posZ = obj.position.z !== undefined ? obj.position.z : (obj.position.y ?? 0);

  return {
    minX: posX,
    maxX: posX + w,
    minZ: posZ,
    maxZ: posZ + d,
  };
}

/**
 * Returns the effective [width, depth] of an object after rotation.
 */
export function getEffectiveSize(
  size: { widthM: number; depthM: number },
  rotation: RotationDeg
): { widthM: number; depthM: number } {
  const transposed = rotation === 90 || rotation === 270;
  return transposed
    ? { widthM: size.depthM, depthM: size.widthM }
    : { widthM: size.widthM, depthM: size.depthM };
}

/**
 * Converts an AABB to a simple Rect-like object (top-left origin, width/depth).
 */
export function aabbToRect(aabb: AABB): { x: number; z: number; widthM: number; depthM: number } {
  return {
    x: aabb.minX,
    z: aabb.minZ,
    widthM: aabb.maxX - aabb.minX,
    depthM: aabb.maxZ - aabb.minZ,
  };
}

/**
 * Snap a value to a grid resolution (e.g. 0.1m).
 */
export function snapToGrid(value: number, resolution = 0.1): number {
  return Math.round(value / resolution) * resolution;
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
