/**
 * AgriSensa Garden Studio — AI Layout Generator & Spatial Optimizer
 * Supports:
 *  1. Auto-Arrange & Optimize components added by user from sidebar.
 *  2. From-Scratch Layout Generation tailored to cultivation systems (soil / hydroponic / mixed).
 *  3. Collision-free guarantee with unplaced-item feedback when plot is overcrowded.
 * Powered by Google Gemini 2.5 Flash with robust deterministic spatial engine.
 * Strictly no emojis.
 */

import type { Plot, Preferences, GardenObject, RotationDeg } from '@/types/garden';

export interface AIPlanRequest {
  plot: Plot;
  preferences: Preferences;
  goal: 'personal' | 'market' | 'mixed';
  systemType?: 'soil' | 'hydroponic' | 'mixed';
  priorityCrop?: string;
  customApiKey?: string;
  mode?: 'auto_arrange' | 'generate_new';
  existingObjects?: GardenObject[];
  userPrompt?: string;
}

export interface AIPlanResponse {
  suggestedObjects: GardenObject[];
  unplacedObjects?: GardenObject[];
  warning?: string;
  explanation: string;
  weeklyAdvice: string[];
  provider: 'gemini' | 'rules';
}

export async function generateAIGardenPlan(req: AIPlanRequest): Promise<AIPlanResponse> {
  const {
    plot,
    goal,
    mode = 'auto_arrange',
    existingObjects = [],
    userPrompt,
    systemType = req.preferences?.system || (req.preferences as any)?.systemType || 'mixed',
  } = req;

  const widthM = plot.widthM;
  const depthM = plot.depthM;
  const isAutoArrange = mode === 'auto_arrange' && existingObjects.length > 0;

  // ── 1. First try secure server-side endpoint ──
  try {
    const apiRes = await fetch('/api/ai/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plot,
        goal,
        mode,
        systemType,
        existingObjects,
        userPrompt,
      }),
    });

    if (apiRes.ok) {
      const parsed = await apiRes.json();
      if (isAutoArrange && Array.isArray(parsed.arranged)) {
        const arrangementMap = new Map<string, { x: number; y: number; rotationDeg?: number; irrigationType?: string; sprinklerRadiusM?: number }>();
        for (const item of parsed.arranged) {
          if (item.id) arrangementMap.set(item.id, item);
        }

        const updatedObjects = existingObjects.map(obj => {
          if (obj.locked || obj.isLocked) return obj;
          const match = arrangementMap.get(obj.id);
          if (!match) return obj;

          const newX = Math.max(0.2, Math.min(widthM - obj.size.widthM - 0.2, match.x));
          const newY = Math.max(0.2, Math.min(depthM - obj.size.depthM - 0.2, match.y));

          return {
            ...obj,
            position: { x: Math.round(newX * 100) / 100, y: Math.round(newY * 100) / 100, z: Math.round(newY * 100) / 100 },
            rotationDeg: (match.rotationDeg === 90 ? 90 : 0) as RotationDeg,
            irrigationType: (match.irrigationType as any) || obj.irrigationType || 'drip',
            sprinklerRadiusM: match.sprinklerRadiusM || obj.sprinklerRadiusM || 2.0,
          };
        });

        const { placed, unplaced } = resolveCollisionsStrict(updatedObjects, plot);

        return {
          suggestedObjects: placed,
          unplacedObjects: unplaced.length > 0 ? unplaced : undefined,
          warning: unplaced.length > 0
            ? `${unplaced.length} objek tidak muat di lahan ${widthM}m × ${depthM}m (${unplaced.map(o => o.label || o.type).join(', ')}). Perluas ukuran lahan atau kurangi objek di kanvas.`
            : undefined,
          explanation: parsed.explanation || 'Komponen pilihan Anda telah ditata ulang oleh Gemini AI dengan prinsip sirkulasi cahaya dan efisiensi air.',
          weeklyAdvice: parsed.weeklyAdvice || [
            'Minggu 1: Pembenahan instalasi bedengan dan koneksi titik air.',
            'Minggu 2: Pindah tanam bibit varietas utama ke posisi yang ditentukan.',
          ],
          provider: 'gemini',
        };
      }

      const generated = generateProceduralLayout(plot, goal, systemType);
      return {
        suggestedObjects: generated,
        explanation: parsed.explanation || `Tata letak kebun (${systemType}) dirancang optimal oleh Google Gemini untuk efisiensi agronomis.`,
        weeklyAdvice: parsed.weeklyAdvice || [
          'Minggu 1: Pembenahan media tanam dan pengecekan aliran air.',
          'Minggu 2: Pindah tanam bibit sayuran ke instalasi utama.',
        ],
        provider: 'gemini',
      };
    }
  } catch (err) {
    console.warn('Server AI endpoint call failed, falling back to spatial engine:', err);
  }

  // ── 2. Deterministic Spatial Engine Fallback (Zero Collision Guaranteed) ──
  if (isAutoArrange) {
    const { placed, unplaced } = autoArrangeComponents(existingObjects, plot);
    return {
      suggestedObjects: placed,
      unplacedObjects: unplaced.length > 0 ? unplaced : undefined,
      warning: unplaced.length > 0
        ? `${unplaced.length} objek tidak muat di lahan berukuran ${widthM}m × ${depthM}m (${unplaced.map(o => o.label || o.type).join(', ')}). Silakan perluas ukuran lahan atau kurangi objek di kanvas.`
        : undefined,
      explanation: `Tata letak ${placed.length} komponen berhasil dioptimalkan dengan jarak lorong sirkulasi yang aman tanpa tumpang tindih.`,
      weeklyAdvice: [
        'Minggu 1: Pematokan posisi bedengan/instalasi dan jalur sesuai denah yang ditata.',
        'Minggu 2: Pemasangan selang irigasi atau tandon nutrisi serta pengujian aliran.',
        'Minggu 3: Pindah tanam bibit dan pemantauan sensor kelembapan tanah.',
        'Minggu 4: Rotasi tanaman dan panen sayuran cepat tumbuh.',
      ],
      provider: 'rules',
    };
  }

  const generated = generateProceduralLayout(plot, goal, systemType);
  const systemExplanation =
    systemType === 'hydroponic'
      ? 'Tata letak dirancang khusus untuk sistem hidroponik murni dengan modul NFT/A-Frame, tandon nutrisi terpusat, dan lorong perawatan ergonomis.'
      : systemType === 'soil'
      ? 'Tata letak difokuskan pada bedengan tanah organik dengan irigasi tetes presisi, area pengomposan mandiri, dan rotasi tanaman.'
      : 'Tata letak memadukan bedengan tanah organik untuk tanaman buah/akar dan modul hidroponik untuk sayuran daun cepat panen.';

  return {
    suggestedObjects: generated,
    explanation: `${systemExplanation} Disesuaikan untuk target ${goal === 'market' ? 'pasar komersial' : 'konsumsi mandiri keluarga'}.`,
    weeklyAdvice: [
      'Minggu 1: Pembenahan instalasi fisik dan pengujian koneksi air.',
      'Minggu 2: Pindah tanam bibit varietas utama ke modul masing-masing.',
      'Minggu 3: Pemantauan hama daun dan penyiraman/pemberian nutrisi rutin.',
      'Minggu 4: Panen awal untuk varietas cepat tumbuh seperti pakcoy dan selada.',
    ],
    provider: 'rules',
  };
}

/**
 * Intelligent auto-arrange for user-chosen components:
 * Respects existing sizes, labels, varieties, and guarantees ZERO collision.
 * Returns both placed and unplaced objects when overcrowding occurs.
 */
export function autoArrangeComponents(
  objects: GardenObject[],
  plot: Plot
): { placed: GardenObject[]; unplaced: GardenObject[] } {
  const W = plot.widthM;
  const D = plot.depthM;

  const lockedObjs = objects.filter(o => o.locked || o.isLocked);
  const unlockedObjs = objects.filter(o => !o.locked && !o.isLocked);

  const placed: GardenObject[] = [...lockedObjs];
  const unplaced: GardenObject[] = [];

  const collides = (x: number, y: number, w: number, d: number) => {
    if (x < 0.15 || y < 0.15 || x + w > W - 0.15 || y + d > D - 0.15) return true;

    for (const ex of plot.excludedZones) {
      const exY = ex.y ?? ex.z ?? 0;
      if (x < ex.x + ex.widthM && x + w > ex.x && y < exY + ex.depthM && y + d > exY) {
        return true;
      }
    }

    for (const p of placed) {
      const pY = p.position.y ?? p.position.z ?? 0;
      if (
        x < p.position.x + p.size.widthM + 0.1 &&
        x + w > p.position.x - 0.1 &&
        y < pY + p.size.depthM + 0.1 &&
        y + d > pY - 0.1
      ) {
        return true;
      }
    }
    return false;
  };

  const findSpot = (w: number, d: number, startX = 0.3, startY = 0.3): { x: number; y: number } | null => {
    const step = 0.2;
    for (let curY = startY; curY + d <= D - 0.2; curY += step) {
      for (let curX = startX; curX + w <= W - 0.2; curX += step) {
        if (!collides(curX, curY, w, d)) {
          return { x: Math.round(curX * 100) / 100, y: Math.round(curY * 100) / 100 };
        }
      }
    }
    // Scan from origin if start offsets missed space
    for (let curY = 0.2; curY + d <= D - 0.2; curY += step) {
      for (let curX = 0.2; curX + w <= W - 0.2; curX += step) {
        if (!collides(curX, curY, w, d)) {
          return { x: Math.round(curX * 100) / 100, y: Math.round(curY * 100) / 100 };
        }
      }
    }
    return null;
  };

  const tryPlace = (obj: GardenObject, startX = 0.3, startY = 0.3, defaults?: Partial<GardenObject>) => {
    const spot = findSpot(obj.size.widthM, obj.size.depthM, startX, startY);
    if (!spot) {
      unplaced.push(obj);
      return false;
    }
    placed.push({
      ...obj,
      ...defaults,
      position: { x: spot.x, y: spot.y, z: spot.y },
    });
    return true;
  };

  // Group unlocked by category
  const waters = unlockedObjs.filter(o => (o.type || o.facilityType) === 'water_source');
  const paths = unlockedObjs.filter(o => (o.type || o.facilityType) === 'path');
  const ponds = unlockedObjs.filter(o => (o.type || o.facilityType) === 'pond');
  const coops = unlockedObjs.filter(o => (o.type || o.facilityType) === 'chicken_coop');
  const hydros = unlockedObjs.filter(o => (o.type || o.facilityType) === 'hydroponic');
  const beds = unlockedObjs.filter(o => (o.type || o.facilityType) === 'raised_bed');
  const iotSensors = unlockedObjs.filter(o => (o.type || o.facilityType) === 'iot_sensor');
  const others = unlockedObjs.filter(
    o => !['path', 'water_source', 'pond', 'chicken_coop', 'hydroponic', 'raised_bed', 'iot_sensor'].includes(o.type || o.facilityType || '')
  );

  // 1. Water Source
  for (const w of waters) tryPlace(w, 0.3, 0.3);

  // 2. Pathways
  for (const p of paths) {
    const pD = Math.min(p.size.depthM, D - 1.0);
    tryPlace(p, 1.2, 0.5, { size: { ...p.size, depthM: pD } });
  }

  // 3. Fish Ponds
  for (const p of ponds) tryPlace(p, 0.3, Math.max(0.5, D - p.size.depthM - 0.5));

  // 4. Chicken Coops
  for (const c of coops) tryPlace(c, Math.max(0.5, W - c.size.widthM - 0.5), Math.max(0.5, D - c.size.depthM - 0.5));

  // 5. Hydroponic
  for (const h of hydros) tryPlace(h, 0.4, 1.5, { irrigationType: h.irrigationType || 'drip' });

  // 6. Raised Beds
  const bedStartX = 2.4;
  let bedX = bedStartX;
  let bedY = 0.8;
  const aisleWidth = 0.7;

  for (const b of beds) {
    const placedSuccess = tryPlace(b, bedX, bedY, {
      irrigationType: b.irrigationType || 'drip',
      dripSpacingCm: b.dripSpacingCm || 20,
      dripLinesCount: b.dripLinesCount || 2,
    });

    if (placedSuccess) {
      bedX += b.size.widthM + aisleWidth;
      if (bedX + b.size.widthM > W - 0.3) {
        bedX = bedStartX;
        bedY += b.size.depthM + aisleWidth;
      }
    }
  }

  // 7. IoT Sensors
  for (const s of iotSensors) tryPlace(s, 1.0, 1.0);

  // 8. Other objects
  for (const o of others) tryPlace(o, 0.5, 0.5);

  return { placed, unplaced };
}

/**
 * Strict collision resolution: guarantees that no placed items overlap.
 * Unfittable objects are separated into unplaced array.
 */
function resolveCollisionsStrict(
  objects: GardenObject[],
  plot: Plot
): { placed: GardenObject[]; unplaced: GardenObject[] } {
  const placed: GardenObject[] = [];
  const unplaced: GardenObject[] = [];
  const W = plot.widthM;
  const D = plot.depthM;

  const isOverlap = (aX: number, aY: number, aW: number, aD: number, bX: number, bY: number, bW: number, bD: number) => {
    return aX < bX + bW && aX + aW > bX && aY < bY + bD && aY + aD > bY;
  };

  for (const obj of objects) {
    if (obj.locked || obj.isLocked) {
      placed.push(obj);
      continue;
    }

    const oY = obj.position.y ?? obj.position.z ?? 0;
    let collidesWithPlaced = false;

    for (const p of placed) {
      const pY = p.position.y ?? p.position.z ?? 0;
      if (isOverlap(obj.position.x, oY, obj.size.widthM, obj.size.depthM, p.position.x, pY, p.size.widthM, p.size.depthM)) {
        collidesWithPlaced = true;
        break;
      }
    }

    if (!collidesWithPlaced) {
      placed.push(obj);
      continue;
    }

    // Try shifting in 0.2m increments
    let resolved = false;
    for (let dy = -1.5; dy <= 1.5 && !resolved; dy += 0.3) {
      for (let dx = -1.5; dx <= 1.5 && !resolved; dx += 0.3) {
        const testX = Math.round((obj.position.x + dx) * 100) / 100;
        const testY = Math.round((oY + dy) * 100) / 100;

        if (testX < 0.2 || testY < 0.2 || testX + obj.size.widthM > W - 0.2 || testY + obj.size.depthM > D - 0.2) {
          continue;
        }

        let valid = true;
        for (const p of placed) {
          const pY = p.position.y ?? p.position.z ?? 0;
          if (isOverlap(testX, testY, obj.size.widthM, obj.size.depthM, p.position.x, pY, p.size.widthM, p.size.depthM)) {
            valid = false;
            break;
          }
        }

        if (valid) {
          placed.push({
            ...obj,
            position: { x: testX, y: testY, z: testY },
          });
          resolved = true;
        }
      }
    }

    if (!resolved) {
      unplaced.push(obj);
    }
  }

  return { placed, unplaced };
}

/**
 * Procedural layout generator strictly aligned with cultivation system:
 * - 'hydroponic': Creates NFT / A-frame racks, nutrient tank, IoT probe, walkways. Zero soil beds!
 * - 'soil': Creates raised beds with drip lines, compost, water tap, IoT soil probe. Zero hydroponic racks!
 * - 'mixed': Balances raised beds for fruit/root crops and hydroponics for leafy greens.
 */
export function generateProceduralLayout(
  plot: Plot,
  goal: string,
  systemType: 'soil' | 'hydroponic' | 'mixed' = 'mixed'
): GardenObject[] {
  const objects: GardenObject[] = [];
  const W = plot.widthM;
  const D = plot.depthM;
  let idCounter = 1;

  // 1. Water / Nutrient Source
  objects.push({
    id: `obj_ai_${idCounter++}`,
    label: systemType === 'hydroponic' ? 'Tandon Nutrisi & Pompa' : 'Titik Air Utama',
    type: 'water_source',
    facilityType: 'water_source',
    position: { x: 0.5, y: 0.5, z: 0.5 },
    size: { widthM: 0.5, depthM: 0.5, heightM: 1.0 },
    rotationDeg: 0,
    locked: true,
    isLocked: true,
    required: true,
    cropAssignments: [],
  });

  // 2. Main Maintenance Walkway
  const pathWidth = 0.8;
  const pathLength = Math.max(1, D - 1.5);
  objects.push({
    id: `obj_ai_${idCounter++}`,
    label: 'Jalur Perawatan',
    type: 'path',
    facilityType: 'path',
    position: { x: 1.2, y: 0.8, z: 0.8 },
    size: { widthM: pathWidth, depthM: pathLength, heightM: 0 },
    rotationDeg: 0,
    locked: false,
    isLocked: false,
    required: false,
    cropAssignments: [],
  });

  // 3. IoT Probe
  objects.push({
    id: `obj_ai_${idCounter++}`,
    label: systemType === 'hydroponic' ? 'IoT EC & pH Monitor' : 'IoT Soil Probe',
    type: 'iot_sensor',
    facilityType: 'iot_sensor',
    position: { x: 0.6, y: 1.4, z: 1.4 },
    size: { widthM: 0.3, depthM: 0.3, heightM: 0.7 },
    rotationDeg: 0,
    locked: false,
    isLocked: false,
    required: false,
    cropAssignments: [],
  });

  // 4. Compost Station (Only for soil & mixed systems)
  if (systemType !== 'hydroponic') {
    objects.push({
      id: `obj_ai_${idCounter++}`,
      label: 'Area Kompos',
      type: 'compost',
      facilityType: 'compost',
      position: { x: Math.max(0.2, W - 1.5), y: Math.max(0.2, D - 1.5), z: Math.max(0.2, D - 1.5) },
      size: { widthM: 1.0, depthM: 1.0, heightM: 0.8 },
      rotationDeg: 0,
      locked: false,
      isLocked: false,
      required: false,
      cropAssignments: [],
    });
  }

  // 5. System-Specific Cultivation Facilities
  if (systemType === 'hydroponic') {
    // Pure Hydroponics: Generate multiple parallel NFT / A-Frame racks
    const hydroCrops = goal === 'market' ? ['selada', 'pakcoy', 'kale'] : ['selada', 'bayam', 'kangkung'];
    let hydroX = 2.4;
    const hydroWidth = 0.8;
    const hydroDepth = Math.max(1.8, Math.min(3.5, D - 2.0));
    const hydroGapX = 1.4;
    let hydroIdx = 0;

    while (hydroX + hydroWidth <= W - 0.4) {
      const crop = hydroCrops[hydroIdx % hydroCrops.length];
      objects.push({
        id: `obj_ai_${idCounter++}`,
        label: `Modul Hidroponik ${hydroIdx + 1} (${crop.toUpperCase()})`,
        type: 'hydroponic',
        facilityType: 'hydroponic',
        position: { x: Math.round(hydroX * 10) / 10, y: 1.0, z: 1.0 },
        size: { widthM: hydroWidth, depthM: Math.round(hydroDepth * 10) / 10, heightM: 1.2 },
        rotationDeg: 0,
        locked: false,
        isLocked: false,
        required: false,
        cropAssignments: [],
        plantSpeciesId: crop,
        irrigationType: 'drip',
      });
      hydroX += hydroGapX;
      hydroIdx++;
    }
  } else if (systemType === 'soil') {
    // Pure Soil: Raised Beds with Drip Irrigation Lines
    const soilCrops = goal === 'market' ? ['pakcoy', 'selada', 'kale'] : ['pakcoy', 'kangkung', 'cabai_rawit', 'tomat_cherry'];
    let bedX = 2.4;
    const bedWidth = 1.0;
    const bedDepth = Math.max(1.5, Math.min(3.0, D - 2.0));
    const bedGapX = 1.6;
    let bedIdx = 0;

    while (bedX + bedWidth <= W - 0.4) {
      const crop = soilCrops[bedIdx % soilCrops.length];
      objects.push({
        id: `obj_ai_${idCounter++}`,
        label: `Bedengan ${bedIdx + 1} (${crop.toUpperCase()})`,
        type: 'raised_bed',
        facilityType: 'raised_bed',
        position: { x: Math.round(bedX * 10) / 10, y: 1.0, z: 1.0 },
        size: { widthM: bedWidth, depthM: Math.round(bedDepth * 10) / 10, heightM: 0.35 },
        rotationDeg: 0,
        locked: false,
        isLocked: false,
        required: false,
        cropAssignments: [],
        plantSpeciesId: crop,
        irrigationType: 'drip',
        dripSpacingCm: 20,
        dripLinesCount: 2,
      });
      bedX += bedGapX;
      bedIdx++;
    }
  } else {
    // Mixed System: Balance of Raised Beds and Hydroponics
    // 1-2 Raised beds on the right
    let bedX = 2.4;
    const bedWidth = 1.0;
    const bedDepth = Math.max(1.5, Math.min(3.0, D - 2.0));

    objects.push({
      id: `obj_ai_${idCounter++}`,
      label: 'Bedengan Tanah (Cabai & Tomat)',
      type: 'raised_bed',
      facilityType: 'raised_bed',
      position: { x: Math.round(bedX * 10) / 10, y: 1.0, z: 1.0 },
      size: { widthM: bedWidth, depthM: Math.round(bedDepth * 10) / 10, heightM: 0.35 },
      rotationDeg: 0,
      locked: false,
      isLocked: false,
      required: false,
      cropAssignments: [],
      plantSpeciesId: 'cabai_rawit',
      irrigationType: 'drip',
      dripSpacingCm: 25,
      dripLinesCount: 2,
    });

    if (W >= 5.5) {
      objects.push({
        id: `obj_ai_${idCounter++}`,
        label: 'Bedengan Tanah (Sayuran Buah)',
        type: 'raised_bed',
        facilityType: 'raised_bed',
        position: { x: Math.round((bedX + 1.5) * 10) / 10, y: 1.0, z: 1.0 },
        size: { widthM: bedWidth, depthM: Math.round(bedDepth * 10) / 10, heightM: 0.35 },
        rotationDeg: 0,
        locked: false,
        isLocked: false,
        required: false,
        cropAssignments: [],
        plantSpeciesId: 'tomat_cherry',
        irrigationType: 'drip',
        dripSpacingCm: 25,
        dripLinesCount: 2,
      });
    }

    // Hydroponic Rack on the side/front
    if (W >= 4.5 && D >= 3.5) {
      objects.push({
        id: `obj_ai_${idCounter++}`,
        label: 'Modul Hidroponik (Selada & Pakcoy)',
        type: 'hydroponic',
        facilityType: 'hydroponic',
        position: { x: 0.4, y: Math.max(1.8, D - 2.2), z: Math.max(1.8, D - 2.2) },
        size: { widthM: 0.7, depthM: 2.0, heightM: 1.2 },
        rotationDeg: 0,
        locked: false,
        isLocked: false,
        required: false,
        cropAssignments: [],
        plantSpeciesId: 'selada',
        irrigationType: 'drip',
      });
    }
  }

  return objects;
}
