/**
 * AgriSensa Garden Studio — Secure Server-Side AI Planner Route
 * Keeps GEMINI_API_KEY protected on server runtime.
 * Never exposes credentials to client-side bundles.
 */

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { Plot, GardenObject, RotationDeg } from '@/types/garden';

interface RequestBody {
  plot: Plot;
  goal: 'personal' | 'market' | 'mixed';
  mode?: 'auto_arrange' | 'generate_new';
  existingObjects?: GardenObject[];
  userPrompt?: string;
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { plot, goal, mode = 'auto_arrange', existingObjects = [], userPrompt } = body;

    // Secure server-side API Key retrieval
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: 'API_KEY_MISSING', message: 'GEMINI_API_KEY belum dikonfigurasi di server.' },
        { status: 401 }
      );
    }

    const widthM = plot.widthM;
    const depthM = plot.depthM;
    const areaM2 = widthM * depthM;
    const isAutoArrange = mode === 'auto_arrange' && existingObjects.length > 0;

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    let prompt = '';
    if (isAutoArrange) {
      prompt = `
Anda adalah Agronomist dan Arsitek Lanskap Kebun Presisi AgriSensa.
Tugas Anda: Mengatur tata letak spasial optimal (Auto-Arrange) untuk komponen kebun yang telah dipilih pengguna dari sidebar katalog.

Spesifikasi Lahan:
- Dimensi Lahan: ${widthM}m x ${depthM}m (Luas: ${areaM2} m²)
- Posisi Pintu Masuk: x=${plot.entrance.x}m, y=${plot.entrance.y ?? plot.entrance.z ?? 0}m
- Posisi Titik Air: x=${plot.waterSource.position.x}m, y=${plot.waterSource.position.y ?? plot.waterSource.position.z ?? 0}m
- Zona Terlarang: ${JSON.stringify(plot.excludedZones)}
- Target Kebun: ${goal === 'market' ? 'Komersial / Perputaran Pasar Cepat' : 'Konsumsi Mandiri Keluarga Seimbang'}
${userPrompt ? `- Instruksi Khusus Pengguna: "${userPrompt.slice(0, 300)}"` : ''}

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
1. Objek dengan status locked: true TIDAK BOLEH diubah posisi.
2. Seluruh objek harus berada di dalam batas lahan: 0.2 <= x <= ${widthM} - width, 0.2 <= y <= ${depthM} - depth.
3. JANGAN tumpang tindih (zero collision) antar objek fisik. Berikan jarak lorong perawatan minimal 0.6m antar bedengan.
4. Letakkan kolam ikan / hidroponik strategis dekat titik air.
5. Kandang ayam diletakkan di sudut aman yang tidak terkena semprotan sprinkler.
6. Berikan sistem irigasi terbaik: "drip" untuk sayuran daun/buah, "sprinkler" untuk area terbuka.

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
      prompt = `
Anda adalah agronomist dan arsitek lanskap kebun pangan AgriSensa.
Rancang denah kebun sayur presisi:
- Dimensi Lahan: ${widthM}m x ${depthM}m (Luas: ${areaM2} m²)
- Tujuan: ${goal === 'market' ? 'Komersial / Pasar' : 'Konsumsi Keluarga'}
${userPrompt ? `- Instruksi Khusus Pengguna: "${userPrompt.slice(0, 300)}"` : ''}

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

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Server AI Error:', error);
    return NextResponse.json(
      { error: 'AI_EXECUTION_FAILED', message: String(error) },
      { status: 500 }
    );
  }
}
