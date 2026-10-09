/**
 * AgriSensa Garden Studio — Agro-Knowledge RAG Engine for Gemini Co-Pilot
 * Combines:
 *  1. Live Web Search via Firecrawl Search API (Balitsa, BPTP, Litbang Pertanian, Jurnal Agronomi)
 *  2. Real-Time Spatial & Microclimate Garden Context (Lahan, Tanaman, Cuaca, Komoditas)
 *  3. Curated Indonesian Agronomic Knowledge Base (PHT, Companion Matrix, AB-Mix PPM, Organik)
 *  4. Google Gemini Multi-Model Cascade (gemini-3.8-flash, gemini-3.7-flash, gemini-flash-latest)
 * Strictly zero emoji in logic and schema.
 */

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface CropContext {
  id: string;
  nameId: string;
  type?: string;
  count?: number;
}

interface CopilotRequestBody {
  message: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  gardenContext?: {
    plotWidthM?: number;
    plotDepthM?: number;
    areaM2?: number;
    objectCount?: number;
    activeCrops?: CropContext[];
    facilities?: string[];
    hasWater?: boolean;
    weather?: {
      tempC?: number;
      condition?: string;
      humidity?: number;
      city?: string;
    };
  };
}

interface RagCitation {
  title: string;
  url: string;
  snippet: string;
  sourceType: 'firecrawl_live' | 'curated_balitsa' | 'pht_kementan';
}

interface SuggestedAction {
  type: 'add_companion' | 'adjust_irrigation' | 'fertilizer_tip';
  label: string;
  plantSpeciesId?: string;
  description: string;
}

// Curated Indonesian High-Density Agronomic Reference Base
const CURATED_AGRO_KNOWLEDGE = [
  {
    topic: 'PHT Kutu Kebul (Bemisia tabaci) & Gemini Virus',
    crop: 'tomat cabai',
    content: 'Pengendalian hama kutu kebul vektor gemini virus: Pasang perangkap lekat kuning (yellow sticky trap) 40 buah/ha. Aplikasi pestisida nabati ekstrak daun mimba atau umbi bawang putih + cabai. Tanam tanaman barrier jagung atau marigold di sekeliling bedengan.',
    source: 'Balai Penelitian Tanaman Sayuran (Balitsa) Lembang',
    url: 'https://balitsa.litbang.pertanian.go.id/',
  },
  {
    topic: 'Pengendalian Thrips & Tungau Merah',
    crop: 'cabai tomat terong',
    content: 'Thrips menyebabkan daun keriting ke atas dan perak mengilap. Gunakan mulsa plastik perak-hitam untuk memantulkan sinar matahari. Gunakan bio-pestisida Bacillus thuringiensis atau ekstrak tembakau. Jaga kelembapan mikro tidak terlalu kering.',
    source: 'Panduan PHT Cabai Kementan RI',
    url: 'https://pertanian.go.id/',
  },
  {
    topic: 'Companion Planting Sayuran Daun & Buah',
    crop: 'umum',
    content: 'Tomat bersinergi sangat baik dengan Kemangi (meningkatkan aroma & mengusir lalat buah) dan Bunga Marigold (menghasilkan alfa-tertienil penangkal nematoda akar & kutu kebul). Cabai bersinergi dengan Bawang Merah. Selada sangat baik berdampingan dengan Seledri dan Daun Bawang.',
    source: 'Manual Companion Planting Pertanian Organik IPB',
    url: 'https://ipb.ac.id/',
  },
  {
    topic: 'Manajemen Nutrisi AB-Mix & Organik Urban Farming',
    crop: 'hidroponik',
    content: 'Sayuran daun (Pakcoy, Selada, Bayam, Kangkung): PPM 800 - 1200, pH 5.5 - 6.5. Sayuran buah fase vegetatif: PPM 1000 - 1400. Sayuran buah fase generatif/pembungaan: PPM 1800 - 2200, tingkatkan Kalium (K) dan Fosfor (P). Untuk sistem organik tanah, berikan POC bonggol pisang dan kalsium cangkang telur untuk mencegah busuk pantat buah (Blossom End Rot).',
    source: 'Standar Teknis Hidroponik & Nutrisi Tanaman Balitsa',
    url: 'https://balitsa.litbang.pertanian.go.id/',
  },
  {
    topic: 'Manajemen Suhu Panas Ekstrem (>30°C)',
    crop: 'umum',
    content: 'Saat cuaca panas terik di perkotaan: Pasang paranet/shading net 50-65% untuk mereduksi radiasi berlebih. Berikan mulsa jerami padi setebal 3-5 cm untuk menjaga kelembapan rizosfer tanah. Irigasi tetes di pagi hari pukul 06.00-08.00 dan sore hari pukul 16.30. Jangan siram di siang terik untuk menghindari thermal shock pada perakaran.',
    source: 'Pedoman Adaptasi Perubahan Iklim Hortikultura Kementan',
    url: 'https://hortikultura.pertanian.go.id/',
  },
];

export async function POST(req: Request) {
  try {
    const body: CopilotRequestBody = await req.json();
    const { message, conversationHistory = [], gardenContext } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'INVALID_QUERY', message: 'Pertanyaan atau pesan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const query = message.trim();
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    const citations: RagCitation[] = [];

    // ── 1. Live Web Retrieval via Firecrawl Search API ──
    if (firecrawlApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5500); // 5.5s timeout

        const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firecrawlApiKey}`,
          },
          body: JSON.stringify({
            query: `${query} pertanian sayuran hortikultura balitsa kementan`,
            limit: 3,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          if (Array.isArray(searchJson?.data)) {
            for (const item of searchJson.data.slice(0, 3)) {
              if (item.url) {
                citations.push({
                  title: item.title || 'Publikasi Agronomi & Riset Tanaman',
                  url: item.url,
                  snippet: (item.description || item.content || '').slice(0, 250),
                  sourceType: 'firecrawl_live',
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Firecrawl Search RAG timeout or error, falling back to curated knowledge:', err);
      }
    }

    // ── 2. Curated RAG Knowledge Ingestion ──
    const lowerQuery = query.toLowerCase();
    for (const item of CURATED_AGRO_KNOWLEDGE) {
      if (
        item.crop.split(' ').some(c => lowerQuery.includes(c)) ||
        lowerQuery.includes('hama') ||
        lowerQuery.includes('pupuk') ||
        lowerQuery.includes('nutrisi') ||
        lowerQuery.includes('cuaca') ||
        lowerQuery.includes('pendamping') ||
        lowerQuery.includes('companion')
      ) {
        citations.push({
          title: item.topic,
          url: item.url,
          snippet: item.content,
          sourceType: 'curated_balitsa',
        });
        if (citations.length >= 4) break;
      }
    }

    // Context formatting
    const cropsList = gardenContext?.activeCrops?.map(c => c.nameId).join(', ') || 'Belum ada tanaman di bedengan';
    const weatherInfo = gardenContext?.weather
      ? `${gardenContext.weather.tempC}°C, ${gardenContext.weather.condition}, Kelembapan ${gardenContext.weather.humidity}% di ${gardenContext.weather.city || 'Lokasi Kebun'}`
      : 'Suhu tropis 28-31°C';

    const ragContextSummary = citations
      .map((c, i) => `[RAG-${i + 1}] Sumber: ${c.title} (${c.url})\nKutipan Riset: "${c.snippet}"`)
      .join('\n\n');

    // ── 3. Gemini Multi-Model Cascade Synthesis ──
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

    const systemPrompt = `
Anda adalah "Agro-Knowledge Co-Pilot", Konsultan Ahli Agronomi dan Urban Farming Presisi di platform AgriSensa Garden Studio.
Gaya Komunikasi: Profesional, praktis, ramah, berbasis sains pertanian Indonesia, dan langsung memberikan solusi yang bisa dieksekusi pekebun.
PENTING: Jangan gunakan emoji apa pun dalam teks respon.

KONDISI AKTIF KEBUN PENGGUNA SAAT INI:
- Dimensi Lahan: ${gardenContext?.plotWidthM || 8}m x ${gardenContext?.plotDepthM || 6}m (Luas: ${gardenContext?.areaM2 || 48} m²)
- Tanaman Terpasang: ${cropsList}
- Komponen Fisik: ${gardenContext?.facilities?.join(', ') || 'Bedengan tanah, sumber air'}
- Cuaca & Iklim Lokal: ${weatherInfo}

REFERENSI DOKUMEN RAG (FIRECRAWL WEB SEARCH & RISET BALITSA KEMENTAN):
${ragContextSummary || 'Gunakan basis pengetahuan agronomis terstandar BPTP dan Balitsa.'}

RIWAYAT PERCAKAPAN SINGKAT:
${conversationHistory.slice(-4).map(h => `${h.role}: ${h.content}`).join('\n')}

PERTANYAAN PENGGUNA TERBARU:
"${query}"

INSTRUKSI FORMATTING KELUARAN (SANGAT PENTING):
1. Mulai dengan 1-2 kalimat ringkasan eksekutif yang ramah dan langsung menjawab inti pertanyaan.
2. Bagi solusi ke dalam 3-4 langkah terstruktur dengan judul bagian: "### 1. [Judul Langkah]", "### 2. [Judul Langkah]", dst.
3. Di dalam setiap langkah, gunakan poin-poin terpisah dengan format: "- **[Nama Tindakan]:** [Penjelasan ringkas, takaran spesifik, dosis, atau cara kerja]".
4. Sebutkan angka takaran praktis (cth: PPM nutrisi, dosis ml/liter air, jarak cm, jumlah perangkap) yang langsung bisa dipraktikkan.
5. Hindari teks paragraf tebal yang monoton. Buat tulisan rapi, berjarak, dan mudah dipahami dalam sekali lihat.
6. Cantumkan 1-2 aksi kebun konkrit (suggestedActions) dan 2 pertanyaan lanjutan yang relevan.

KEMBALIKAN HANYA JSON MURNI TANPA CODEBLOCK:
{
  "replyMarkdown": "Teks jawaban lengkap terstruktur sesuai panduan di atas...",
  "keyTakeaways": ["Poin ringkas 1", "Poin ringkas 2"],
  "suggestedActions": [
    {
      "type": "add_companion",
      "label": "Tanam Marigold (Tagetes)",
      "plantSpeciesId": "marigold",
      "description": "Mengusir nematoda akar dan kutu kebul di sekitar tanaman buah"
    }
  ],
  "followUpQuestions": [
    "Pertanyaan lanjutan 1...",
    "Pertanyaan lanjutan 2..."
  ]
}
`;

    let parsedResult: any = null;
    let successfulModel = '';

    if (geminiApiKey && geminiApiKey.trim().length > 0) {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey.trim() });

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: systemPrompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const rawText = response.text || '';
          parsedResult = parseJsonSafely(rawText);

          if (parsedResult && parsedResult.replyMarkdown) {
            successfulModel = modelName;
            break;
          }
        } catch (genErr) {
          console.warn(`Co-Pilot model ${modelName} error:`, genErr);
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
    }

    // Heuristic Fallback if Gemini is down/overloaded
    if (!parsedResult || !parsedResult.replyMarkdown) {
      console.info('Utilizing agronomic heuristic fallback for Co-Pilot response.');
      parsedResult = generateHeuristicAgroAdvice(query, cropsList, weatherInfo);
    }

    return NextResponse.json({
      success: true,
      answer: parsedResult.replyMarkdown,
      keyTakeaways: parsedResult.keyTakeaways || [],
      suggestedActions: parsedResult.suggestedActions || [],
      followUpQuestions: parsedResult.followUpQuestions || [
        'Bagaimana jadwal pemupukan yang ideal untuk tanaman ini?',
        'Berapa kebutuhan air harian pada suhu saat ini?',
      ],
      citations,
      aiModel: successfulModel || 'agronomic_rule_engine',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Agro-Knowledge Co-Pilot Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error during Co-Pilot processing';
    return NextResponse.json(
      { error: 'COPILOT_FAILED', message },
      { status: 500 }
    );
  }
}

function parseJsonSafely(raw: string): any {
  if (!raw || typeof raw !== 'string') return null;
  let cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  cleaned = cleaned.replace(/\/\/.*$/gm, '');
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        let snippet = match[0].replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(snippet);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function generateHeuristicAgroAdvice(query: string, crops: string, weather: string) {
  const lower = query.toLowerCase();

  let advice = '';
  const actions: SuggestedAction[] = [];

  if (lower.includes('hama') || lower.includes('kutu') || lower.includes('thrips') || lower.includes('ulat')) {
    advice = `### Protokol Pengendalian Hama Terpadu (PHT) AgriSensa

Berdasarkan tanaman aktif di kebun Anda (**${crops}**) dan kondisi iklim (**${weather}**), berikut adalah panduan penanganan hama:

1. **Sanitasi & Perangkap Mekanis**:
   - Pasang perangkap lekat kuning (*Yellow Sticky Trap*) setinggi tajuk tanaman untuk memonitor populasi kutu kebul dan thrips.
   - Pangkas dan musnahkan daun bagian bawah yang sudah terserang parah untuk memutus siklus bertelur hama.

2. **Pestisida Nabati Organik (Ramah Tanaman Pangan)**:
   - **Formula Bawang Putih & Cabai**: Haluskan 5 siung bawang putih dan 3 cabai rawit, campur dengan 1 liter air dan 1 sendok teh sabun cair kelapa (perekat alami). Semprotkan di bawah permukaan daun pada sore hari.
   - **Ekstrak Daun Mimba**: Sangat ampuh mengacaukan hormon pertumbuhan nimfa hama tanpa meninggalkan residu kimia berbahaya.

3. **Tanaman Pendamping Penghalau (Companion Planting)**:
   - Tanam tanaman penolak serangga seperti **Kemangi** atau **Marigold** di samping bedengan sayuran Anda.`;

    actions.push({
      type: 'add_companion',
      label: 'Tanam Kemangi (Pengusir Hama)',
      plantSpeciesId: 'kemangi',
      description: 'Aroma minyak atsiri kemangi mengacaukan sensor penciuman kutu kebul dan lalat buah.',
    });
  } else if (lower.includes('pupuk') || lower.includes('nutrisi') || lower.includes('ab mix') || lower.includes('ppm')) {
    advice = `### Panduan Manajemen Nutrisi & Pemupukan Presisi

Untuk mengoptimalkan pertumbuhan tanaman di kebun Anda (**${crops}**):

1. **Fase Vegetatif (Daun & Pembesaran Batang)**:
   - Berikan unsur Nitrogen (N) tinggi seperti POC urin kelinci fermentasi atau pupuk kompos matang.
   - Jika menggunakan hidroponik: Jaga kepekatan nutrisi di kisaran **800 - 1.200 PPM** dengan pH ideal **5.8 - 6.5**.

2. **Fase Generatif (Bunga & Pembentukan Buah)**:
   - Tingkatkan asupan Kalium (K) dan Kalsium (Ca) untuk mencegah rontok bunga dan busuk ujung buah (*Blossom End Rot*).
   - Target nutrisi sayuran buah: **1.600 - 2.000 PPM**. Berikan pupuk organik cangkang telur mikronisasi atau kalium organik.

3. **Waktu Aplikasi Ideal**:
   - Lakukan pemupukan kocor atau penyemprotan daun pada pagi hari sebelum pukul 09.00 saat stomata terbuka sempurna.`;
  } else {
    advice = `### Rekomendasi Agronomis Kebun AgriSensa

Melihat spesifikasi kebun Anda saat ini dengan tanaman **${crops}** di bawah kondisi cuaca **${weather}**:

1. **Manajemen Irigasi & Kelembapan**:
   - Pastikan media tanam memiliki drainase yang baik untuk mencegah genangan air yang memicu jamur akar (*Fusarium*).
   - Gunakan sistem irigasi tetes (*drip irrigation*) untuk efisiensi air dan mencegah daun basah berlebih.

2. **Kesehatan Tanah & Mulsa**:
   - Berikan mulsa organik (jerami atau serpihan kayu) setebal 3 cm untuk menstabilkan suhu perakaran dan menekan gulma.
   - Tambahkan mikroba hayati (*Trichoderma sp.*) sebulan sekali untuk melindungi akar dari patogen tular tanah.

3. **Rotasi & Diversifikasi**:
   - Jangan menanam tanaman dari famili yang sama (*Solanaceae*: tomat, cabai, terong) secara berturut-turut di bedengan yang sama untuk menjaga keseimbangan hara tanah.`;
  }

  return {
    replyMarkdown: advice,
    keyTakeaways: [
      'Prioritaskan metode pencegahan fisik dan pestisida nabati.',
      'Jaga kelembapan tanah stabil dengan mulsa dan irigasi teratur.',
    ],
    suggestedActions: actions,
    followUpQuestions: [
      'Bagaimana cara membuat pupuk organik cair sendiri?',
      'Berapa takaran penyiraman yang tepat di cuaca panas?',
    ],
  };
}
