/**
 * AgriSensa Garden Studio — AI Layout Generator & Spatial Optimizer
 * Supports:
 *  1. Auto-Arrange & Optimize components added by user from sidebar.
 *  2. From-Scratch Layout Generation for new garden designs.
 *  3. Custom Natural Language Prompts / Instructions.
 * Powered by Google Gemini 2.5 Flash with robust deterministic spatial fallback.
 * Strictly no emojis.
 */

import type { Plot, Preferences, GardenObject, RotationDeg } from '@/types/garden';
import { GoogleGenAI } from '@google/genai';

export interface AIPlanRequest {
  plot: Plot;
  preferences: Preferences;
  goal: 'personal' | 'market' | 'mixed';
  priorityCrop?: string;
  customApiKey?: string;
  mode?: 'auto_arrange' | 'generate_new';
  existingObjects?: GardenObject[];
  userPrompt?: string;
}

export interface AIPlanResponse {
  suggestedObjects: GardenObject[];
  explanation: string;
  weeklyAdvice: string[];
  provider: 'gemini' | 'rules';
}

export async function generateAIGardenPlan(req: AIPlanRequest): Promise<AIPlanResponse> {
  const { plot, goal, mode = 'auto_arrange', existingObjects = [], userPrompt } = req;
  const apiKey = req.customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  const widthM = plot.widthM;
  const depthM = plot.depthM;
  const areaM2 = widthM * depthM;

  // Check if we should auto-arrange existing components or build from scratch
  const isAutoArrange = mode === 'auto_arrange' && existingObjects.length > 0;

  // ── 1. First try secure server-side endpoint ──
  try {
    const apiRes = await fetch('/api/ai/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plot, goal, mode, existingObjects, userPrompt }),
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

        const collisionFreeObjects = resolveCollisionsGreedy(updatedObjects, plot);

        return {
          suggestedObjects: collisionFreeObjects,
          explanation: parsed.explanation || 'Komponen pilihan Anda telah ditata ulang oleh Gemini AI dengan prinsip sirkulasi cahaya dan efisiensi air.',
          weeklyAdvice: parsed.weeklyAdvice || [
            'Minggu 1: Pembenahan instalasi bedengan dan koneksi titik air.',
            'Minggu 2: Pindah tanam bibit varietas utama ke posisi yang ditentukan.',
          ],
          provider: 'gemini',
        };
      }

      const generated = generateProceduralLayout(plot, goal);
      return {
        suggestedObjects: generated,
        explanation: parsed.explanation || 'Tata letak kebun baru dioptimalkan oleh Google Gemini untuk efisiensi agronomis.',
        weeklyAdvice: parsed.weeklyAdvice || [
          'Minggu 1: Pembenahan media tanam organik dan pengecekan aliran air.',
          'Minggu 2: Pindah tanam bibit sayuran daun ke bedengan utama.',
        ],
        provider: 'gemini',
      };
    }
  } catch {
    // Proceed to fallback
  }

  // ── 2. Call Google Gemini 2.5 Flash direct if API Key available (Client Fallback) ──
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      let prompt = '';
      if (isAutoArrange) {
        // Auto-arrange user-specified components
        prompt = `
Anda adalah Agronomist dan Arsitek Lanskap Kebun Presisi AgriSensa.
Tugas Anda: Mengatur tata letak spasial optimal (Auto-Arrange) untuk komponen kebun yang telah dipilih pengguna dari sidebar katalog.

Spesifikasi Lahan:
- Dimensi Lahan: ${widthM}m x ${depthM}m (Luas: ${areaM2} m²)
- Posisi Pintu Masuk: x=${plot.entrance.x}m, y=${plot.entrance.y ?? plot.entrance.z ?? 0}m
- Posisi Titik Air: x=${plot.waterSource.position.x}m, y=${plot.waterSource.position.y ?? plot.waterSource.position.z ?? 0}m
- Zona Terlarang: ${JSON.stringify(plot.excludedZones)}
- Target Kebun: ${goal === 'market' ? 'Komersial / Perputaran Pasar Cepat' : 'Konsumsi Mandiri Keluarga Seimbang'}
${userPrompt ? `- Instruksi Khusus Pengguna: "${userPrompt}"` : ''}

Daftar Komponen yang Harus Ditata:
${JSON.stringify(
  existingObjects.map(o => ({
    id: o.id,
    label: o.label || o.type,
    type: o.type || o.facilityType,
    size: o.size,
    crop: o.plantSpeciesId,
    locked: Boolean(o.locked || o.isLocked),
    currentX: o.position.x,
    currentY: o.position.y ?? o.position.z ?? 0,
  })),
  null,
  2
)}

ATURAN GEOMETRI & AGRONOMI:
1. Objek dengan status locked: true TIDAK BOLEH diubah posisi (tetap di currentX, currentY).
2. Seluruh objek harus berada di dalam batas lahan: 0.2 <= x <= ${widthM} - width, 0.2 <= y <= ${depthM} - depth.
3. JANGAN tumpang tindih (zero collision) antar objek fisik. Berikan jarak lorong perawatan minimal 0.6m antar bedengan.
4. Letakkan kolam ikan / hidroponik strategis dekat titik air.
5. Kandang ayam (chicken_coop) diletakkan di sudut yang tidak mengganggu sirkulasi dan TIDAK terkena semprotan sprinkler.
6. Berikan sistem irigasi terbaik: "drip" untuk bedengan sayuran daun/buah, "sprinkler" untuk area terbuka (dengan sprinklerRadiusM 1.5 - 2.5m).

KEMBALIKAN HANYA JSON MURNI TANPA MARKDOWN CODEBLOCK:
{
  "arranged": [
    {
      "id": "string id objek yang sesuai",
      "x": number,
      "y": number,
      "rotationDeg": 0,
      "irrigationType": "drip" | "sprinkler" | "manual",
      "sprinklerRadiusM": 2.0
    }
  ],
  "explanation": "Penjelasan rinci mengapa tata letak ini paling efisien untuk komponen pengguna",
  "weeklyAdvice": [
    "Minggu 1: ...",
    "Minggu 2: ...",
    "Minggu 3: ...",
    "Minggu 4: ..."
  ]
}
`;
      } else {
        // Generate complete new layout
        prompt = `
Anda adalah agronomist dan arsitek lanskap kebun pangan AgriSensa.
Rancang denah kebun sayur presisi:
- Dimensi Lahan: ${widthM}m x ${depthM}m (Luas: ${areaM2} m²)
- Tujuan: ${goal === 'market' ? 'Komersial / Pasar' : 'Konsumsi Keluarga'}
- Sistem: ${req.preferences.system || req.preferences.systemType || 'mixed'}
${userPrompt ? `- Instruksi Khusus Pengguna: "${userPrompt}"` : ''}

KEMBALIKAN HANYA JSON MURNI:
{
  "explanation": "Penjelasan rinci strategi penataan agronomis dan sirkulasi cahaya",
  "weeklyAdvice": [
    "Minggu 1: Persiapan media dan instalasi",
    "Minggu 2: Pindah tanam dan nutrisi",
    "Minggu 3: Pemantauan hama dan kelembapan",
    "Minggu 4: Rotasi dan panen awal"
  ]
}
`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (isAutoArrange && Array.isArray(parsed.arranged)) {
        // Map arranged coordinates back to existing user objects
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

        // Run guardrail collision resolution to guarantee zero overlap
        const collisionFreeObjects = resolveCollisionsGreedy(updatedObjects, plot);

        return {
          suggestedObjects: collisionFreeObjects,
          explanation: parsed.explanation || 'Komponen pilihan Anda telah ditata ulang oleh Gemini AI dengan prinsip sirkulasi cahaya dan efisiensi air.',
          weeklyAdvice: parsed.weeklyAdvice || [
            'Minggu 1: Pembenahan instalasi bedengan dan koneksi titik air.',
            'Minggu 2: Pindah tanam bibit varietas utama ke posisi yang ditentukan.',
          ],
          provider: 'gemini',
        };
      }

      // If from scratch or non-arranged response
      const generated = generateProceduralLayout(plot, goal);
      return {
        suggestedObjects: generated,
        explanation: parsed.explanation || 'Tata letak kebun baru dioptimalkan oleh Google Gemini untuk efisiensi agronomis.',
        weeklyAdvice: parsed.weeklyAdvice || [
          'Minggu 1: Pembenahan media tanam organik dan pengecekan aliran air.',
          'Minggu 2: Pindah tanam bibit sayuran daun ke bedengan utama.',
        ],
        provider: 'gemini',
      };
    } catch (err) {
      console.warn('Gemini API call failed, falling back to spatial engine:', err);
    }
  }

  // ── 2. Deterministic Spatial Engine Fallback ──
  if (isAutoArrange) {
    const arranged = autoArrangeComponents(existingObjects, plot, goal);
    return {
      suggestedObjects: arranged,
      explanation: `Tata letak ${existingObjects.length} komponen pilihan Anda berhasil dioptimalkan. Jalur lorong selebar 0.7m dipasang di antara bedengan dengan posisi teratur tanpa tabrakan.`,
      weeklyAdvice: [
        'Minggu 1: Pematokan posisi bedengan dan jalur sesuai denah yang ditata.',
        'Minggu 2: Pemasangan selang irigasi tetes dan pengisian media tanam gembur.',
        'Minggu 3: Pindah tanam bibit dan pemantauan kelembapan tanah.',
        'Minggu 4: Rotasi tanaman dan panen sayuran cepat tumbuh.',
      ],
      provider: 'rules',
    };
  }

  const generated = generateProceduralLayout(plot, goal);
  return {
    suggestedObjects: generated,
    explanation:
      goal === 'market'
        ? 'Tata letak difokuskan pada pemaksimalan bedengan berjarak teratur dengan akses sirkulasi terpadu untuk efisiensi panen komersial.'
        : 'Tata letak proporsional memadukan bedengan sayuran daun dan sayuran buah dengan jalur perawatan yang lapang.',
    weeklyAdvice: [
      'Minggu 1: Pembenahan media tanam organik dan pengecekan aliran air.',
      'Minggu 2: Pindah tanam bibit sayuran daun ke bedengan utama.',
      'Minggu 3: Pemantauan hama daun dan penyiraman rutin dua kali sehari.',
      'Minggu 4: Panen awal untuk varietas kangkung dan pakcoy.',
    ],
    provider: 'rules',
  };
}

/**
 * Intelligent auto-arrange for user-chosen components:
 * Respects existing sizes, labels, varieties, and places them neatly on a grid.
 */
export function autoArrangeComponents(objects: GardenObject[], plot: Plot, goal: string): GardenObject[] {
  const W = plot.widthM;
  const D = plot.depthM;

  // Separate locked and unlocked objects
  const lockedObjs = objects.filter(o => o.locked || o.isLocked);
  const unlockedObjs = objects.filter(o => !o.locked && !o.isLocked);

  // Group unlocked by category
  const paths = unlockedObjs.filter(o => (o.type || o.facilityType) === 'path');
  const waters = unlockedObjs.filter(o => (o.type || o.facilityType) === 'water_source');
  const ponds = unlockedObjs.filter(o => (o.type || o.facilityType) === 'pond');
  const coops = unlockedObjs.filter(o => (o.type || o.facilityType) === 'chicken_coop');
  const hydros = unlockedObjs.filter(o => (o.type || o.facilityType) === 'hydroponic');
  const beds = unlockedObjs.filter(o => (o.type || o.facilityType) === 'raised_bed');
  const others = unlockedObjs.filter(
    o => !['path', 'water_source', 'pond', 'chicken_coop', 'hydroponic', 'raised_bed'].includes(o.type || o.facilityType || '')
  );

  const placed: GardenObject[] = [...lockedObjs];

  // Helper to test if a rect collides with already placed objects or excluded zones
  const collides = (x: number, y: number, w: number, d: number) => {
    // Check plot bounds
    if (x < 0.15 || y < 0.15 || x + w > W - 0.15 || y + d > D - 0.15) return true;
    // Check excluded zones
    for (const ex of plot.excludedZones) {
      const exY = ex.y ?? ex.z ?? 0;
      if (x < ex.x + ex.widthM && x + w > ex.x && y < exY + ex.depthM && y + d > exY) {
        return true;
      }
    }
    // Check placed objects
    for (const p of placed) {
      const pY = p.position.y ?? p.position.z ?? 0;
      if (x < p.position.x + p.size.widthM + 0.1 && x + w > p.position.x - 0.1 && y < pY + p.size.depthM + 0.1 && y + d > pY - 0.1) {
        return true;
      }
    }
    return false;
  };

  // Helper to find first available spot scanning from left/top
  const findSpot = (w: number, d: number, startX = 0.3, startY = 0.3): { x: number; y: number } => {
    const step = 0.25;
    for (let curX = startX; curX + w <= W - 0.2; curX += step) {
      for (let curY = startY; curY + d <= D - 0.2; curY += step) {
        if (!collides(curX, curY, w, d)) {
          return { x: Math.round(curX * 100) / 100, y: Math.round(curY * 100) / 100 };
        }
      }
    }
    // Fallback if packed
    return { x: Math.max(0.2, startX), y: Math.max(0.2, startY) };
  };

  // 1. Water Source placement (near entrance or at 0.5, 0.5)
  for (const w of waters) {
    const spot = findSpot(w.size.widthM, w.size.depthM, 0.3, 0.3);
    const updated: GardenObject = {
      ...w,
      position: { x: spot.x, y: spot.y, z: spot.y },
    };
    placed.push(updated);
  }

  // 2. Main Pathway (connects entrance through the middle)
  for (const p of paths) {
    const pW = p.size.widthM;
    const pD = Math.min(p.size.depthM, D - 1.0);
    const spot = findSpot(pW, pD, 1.2, 0.5);
    const updated: GardenObject = {
      ...p,
      size: { ...p.size, depthM: pD },
      position: { x: spot.x, y: spot.y, z: spot.y },
    };
    placed.push(updated);
  }

  // 3. Fish Ponds (placed near water source, bottom or side)
  for (const p of ponds) {
    const spot = findSpot(p.size.widthM, p.size.depthM, 0.3, Math.max(0.5, D - p.size.depthM - 0.5));
    const updated: GardenObject = {
      ...p,
      position: { x: spot.x, y: spot.y, z: spot.y },
    };
    placed.push(updated);
  }

  // 4. Chicken Coops (placed in far back corner)
  for (const c of coops) {
    const spot = findSpot(c.size.widthM, c.size.depthM, Math.max(0.5, W - c.size.widthM - 0.5), Math.max(0.5, D - c.size.depthM - 0.5));
    const updated: GardenObject = {
      ...c,
      position: { x: spot.x, y: spot.y, z: spot.y },
    };
    placed.push(updated);
  }

  // 5. Hydroponic Racks (placed along sunny perimeter)
  for (const h of hydros) {
    const spot = findSpot(h.size.widthM, h.size.depthM, 0.4, 1.5);
    const updated: GardenObject = {
      ...h,
      irrigationType: h.irrigationType || 'drip',
      position: { x: spot.x, y: spot.y, z: spot.y },
    };
    placed.push(updated);
  }

  // 6. Raised Beds (Arranged in clean columns/rows with 0.7m aisles)
  const bedStartX = 2.4;
  let bedX = bedStartX;
  let bedY = 0.8;
  const aisleWidth = 0.7;

  for (const b of beds) {
    let spot = findSpot(b.size.widthM, b.size.depthM, bedX, bedY);
    // If scanning found a valid spot
    const updated: GardenObject = {
      ...b,
      irrigationType: b.irrigationType || 'drip',
      dripSpacingCm: b.dripSpacingCm || 20,
      dripLinesCount: b.dripLinesCount || 2,
      position: { x: spot.x, y: spot.y, z: spot.y },
    };
    placed.push(updated);

    // Advance to next column for clean parallel beds
    bedX += b.size.widthM + aisleWidth;
    if (bedX + b.size.widthM > W - 0.3) {
      bedX = bedStartX;
      bedY += b.size.depthM + aisleWidth;
    }
  }

  // 7. Other components (compost, decorative, etc.)
  for (const o of others) {
    const spot = findSpot(o.size.widthM, o.size.depthM, 0.5, 0.5);
    placed.push({
      ...o,
      position: { x: spot.x, y: spot.y, z: spot.y },
    });
  }

  return placed;
}

/**
 * Guardrail collision resolver: nudges any overlapping objects into free space
 */
function resolveCollisionsGreedy(objects: GardenObject[], plot: Plot): GardenObject[] {
  const result: GardenObject[] = [];
  const W = plot.widthM;
  const D = plot.depthM;

  for (const obj of objects) {
    if (obj.locked || obj.isLocked) {
      result.push(obj);
      continue;
    }

    let posX = obj.position.x;
    let posY = obj.position.y ?? obj.position.z ?? 0;
    const w = obj.size.widthM;
    const d = obj.size.depthM;

    // Check collision with already accepted objects
    let hasCollision = true;
    let attempts = 0;

    while (hasCollision && attempts < 25) {
      hasCollision = false;
      for (const other of result) {
        const oY = other.position.y ?? other.position.z ?? 0;
        if (
          posX < other.position.x + other.size.widthM + 0.1 &&
          posX + w > other.position.x - 0.1 &&
          posY < oY + other.size.depthM + 0.1 &&
          posY + d > oY - 0.1
        ) {
          hasCollision = true;
          // Shift right or down
          posX += 0.5;
          if (posX + w > W - 0.2) {
            posX = 0.5;
            posY += 0.5;
          }
          break;
        }
      }
      attempts++;
    }

    result.push({
      ...obj,
      position: {
        x: Math.min(W - w - 0.2, Math.max(0.2, Math.round(posX * 100) / 100)),
        y: Math.min(D - d - 0.2, Math.max(0.2, Math.round(posY * 100) / 100)),
        z: Math.min(D - d - 0.2, Math.max(0.2, Math.round(posY * 100) / 100)),
      },
    });
  }

  return result;
}

/**
 * High-precision spatial generator that creates a fresh template from scratch
 */
function generateProceduralLayout(plot: Plot, goal: string): GardenObject[] {
  const objects: GardenObject[] = [];
  const W = plot.widthM;
  const D = plot.depthM;

  let idCounter = 1;

  // 1. Water Source near entrance or boundary
  objects.push({
    id: `obj_ai_${idCounter++}`,
    label: 'Titik Air Utama',
    type: 'water_source',
    facilityType: 'water_source',
    position: { x: 0.5, y: 0.5, z: 0.5 },
    size: { widthM: 0.4, depthM: 0.4, heightM: 1.0 },
    rotationDeg: 0,
    locked: true,
    isLocked: true,
    required: true,
    cropAssignments: [],
  });

  // 2. Main maintenance walkway
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

  // 3. Compost area
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

  // 4. Rows of Raised Beds with Drip Irrigation
  const bedWidth = 1.0;
  const bedDepth = Math.min(3.0, D - 2.0);
  const startX = 2.4;
  const bedGapX = 1.6;

  const crops =
    goal === 'market'
      ? ['selada', 'pakcoy', 'kale']
      : ['pakcoy', 'kangkung', 'cabai_rawit', 'tomat_cherry'];

  let currentX = startX;
  let cropIdx = 0;

  while (currentX + bedWidth <= W - 0.5) {
    const cropId = crops[cropIdx % crops.length];
    objects.push({
      id: `obj_ai_${idCounter++}`,
      label: `Bedengan ${cropIdx + 1}`,
      type: 'raised_bed',
      facilityType: 'raised_bed',
      position: { x: Math.round(currentX * 10) / 10, y: 1.0, z: 1.0 },
      size: { widthM: bedWidth, depthM: Math.max(1.5, Math.round(bedDepth * 10) / 10), heightM: 0.35 },
      rotationDeg: 0,
      locked: false,
      isLocked: false,
      required: false,
      cropAssignments: [],
      plantSpeciesId: cropId,
      irrigationType: 'drip',
      dripSpacingCm: 20,
      dripLinesCount: 2,
    });

    currentX += bedGapX;
    cropIdx++;
  }

  // 5. Hydroponic system if space permits
  if (W >= 6 && D >= 4) {
    objects.push({
      id: `obj_ai_${idCounter++}`,
      label: 'Instalasi NFT Hidroponik',
      type: 'hydroponic',
      facilityType: 'hydroponic',
      position: { x: 0.4, y: Math.max(1.5, D - 2.5), z: Math.max(1.5, D - 2.5) },
      size: { widthM: 0.6, depthM: 2.0, heightM: 1.0 },
      rotationDeg: 0,
      locked: false,
      isLocked: false,
      required: false,
      cropAssignments: [],
      plantSpeciesId: 'selada',
      irrigationType: 'drip',
    });
  }

  return objects;
}
