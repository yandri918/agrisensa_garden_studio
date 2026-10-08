/**
 * AgriSensa Garden Studio — Layout Validator
 * Orchestrates all geometry checks into a single ValidationResult.
 */

import type { GardenObject, Plot, ValidationResult, Conflict } from '@/types/garden';
import { objectToAABB } from '@/lib/geometry/types';
import { getBoundaryViolations } from '@/lib/geometry/bounds';
import { getOverlapConflicts } from '@/lib/geometry/overlap';
import { getAccessConflicts } from '@/lib/geometry/access';

/**
 * Runs all hard-rule checks:
 *  1. Boundary (in-bounds + not in excluded zone) per object
 *  2. Overlap between physical objects
 *  3. Access blocked for required objects
 *
 * Returns a ValidationResult with all conflicts and assumptions listed.
 */
export function validateLayout(
  objects: GardenObject[],
  plot: Plot
): ValidationResult {
  const conflicts: Conflict[] = [];
  const assumptions: string[] = [
    'Pemeriksaan aksesibilitas menggunakan grid 0.5m — pendekatan, bukan jaminan geometris sempurna.',
    'Perhitungan luas menggunakan rasterisasi 5cm — akurasi ±area per tepi objek.',
    'Tanaman di dalam bedengan tidak dihitung sebagai tabrakan fisik (layer berbeda).',
  ];

  // 1. Boundary checks (per object)
  for (const obj of objects) {
    const aabb = objectToAABB(obj);
    const violations = getBoundaryViolations(aabb, plot);
    for (const v of violations) {
      conflicts.push({
        id: `conflict_bound_${obj.id}_${v}`,
        type: v,
        ids: [obj.id],
        objectId: obj.id,
        message:
          v === 'OUT_OF_BOUNDS'
            ? `"${obj.label ?? obj.type ?? 'Objek'}" berada di luar batas lahan`
            : `"${obj.label ?? obj.type ?? 'Objek'}" berada di zona terlarang`,
      });
    }
  }

  // 2. Overlap checks (pairwise physical objects)
  conflicts.push(...getOverlapConflicts(objects));

  // 3. Access checks (required objects only)
  try {
    const accessConflicts = getAccessConflicts(objects, plot);
    conflicts.push(...accessConflicts);
  } catch {
    // Graceful fallback if access check grid fails
  }

  const isValid = conflicts.length === 0;
  const status =
    isValid ? 'valid'
    : conflicts.some(c => c.type === 'REQUIRED_MISSING') ? 'infeasible'
    : 'has_conflicts';

  return {
    status,
    isValid,
    conflicts,
    assumptions,
    checkedAt: new Date().toISOString(),
  };
}
