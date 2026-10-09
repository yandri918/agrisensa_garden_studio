/**
 * AgriSensa Garden Studio — Agro-Knowledge Co-Pilot Drawer
 * RAG-powered interactive agricultural advisor (Firecrawl + Gemini AI).
 * Connects directly to active garden context, crops, and live weather.
 * Features ultra-rich typography, cards, badges, and zero emojis.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGardenStore } from '@/store/gardenStore';
import { VEGETABLE_CATALOG } from '@/data/vegetable-catalog';
import {
  Bot,
  Sparkles,
  Send,
  X,
  BookOpen,
  ShieldAlert,
  Sprout,
  Droplets,
  Sun,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Layers,
  CheckCircle2,
  HelpCircle,
  Trash2,
  Copy,
  Check,
  Flame,
  FileText,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { title: string; url: string; snippet: string; sourceType?: string }[];
  keyTakeaways?: string[];
  suggestedActions?: {
    type: 'add_companion' | 'adjust_irrigation' | 'fertilizer_tip';
    label: string;
    plantSpeciesId?: string;
    description: string;
  }[];
  followUpQuestions?: string[];
  aiModel?: string;
  timestamp: string;
}

interface AgroCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SuggestedActionItem = NonNullable<Message['suggestedActions']>[number];

const PRESET_QUESTIONS = [
  'Bagaimana cara mencegah hama kutu kebul dan thrips pada tanaman saya?',
  'Rekomendasikan tanaman pendamping (companion planting) terbaik untuk kebun ini.',
  'Berapa dosis pupuk organik dan nutrisi yang ideal di fase saat ini?',
  'Bagaimana strategi menjaga kelembapan tanah di cuaca panas ekstrem?',
  'Bagaimana pola rotasi tanam yang tepat agar tanah tetap subur?',
];

export function AgroCopilotDrawer({ isOpen, onClose }: AgroCopilotDrawerProps) {
  const garden = useGardenStore(state => state.garden);
  const addObject = useGardenStore(state => state.addObject);
  const customCrops = useGardenStore(state => state.customCrops);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compile active crop information from garden objects
  const activeCropMap = new Map<string, number>();
  for (const obj of garden.objects) {
    if (obj.plantSpeciesId) {
      activeCropMap.set(obj.plantSpeciesId, (activeCropMap.get(obj.plantSpeciesId) || 0) + 1);
    }
  }

  const allCropsCatalog = [...VEGETABLE_CATALOG, ...customCrops];
  const activeCropList = Array.from(activeCropMap.entries()).map(([cropId, count]) => {
    const found = allCropsCatalog.find(c => c.id === cropId);
    return {
      id: cropId,
      nameId: found?.nameId || cropId,
      type: found?.type || 'sayuran',
      count,
    };
  });

  const areaM2 = garden.plot.widthM * garden.plot.depthM;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `Selamat datang di **Agro-Knowledge Co-Pilot**! 

Saya adalah asisten agronomis presisi Anda yang terintegrasi dengan **RAG (Live Agro-Knowledge Retrieval & Riset Balitsa/BPTP)** dan **AI Engine**. Saya membaca kondisi riil kebun Anda secara langsung untuk memberikan rekomendasi pengendalian hama, nutrisi organik, dan teknik budidaya presisi.

Silakan pilih topik cepat di atas atau ajukan pertanyaan spesifik tentang tanaman di kebun Anda.`,
      timestamp: 'Baru saja',
      aiModel: 'gemini-3.8-flash',
      keyTakeaways: [
        'Konteks spasial kebun Anda (ukuran lahan, varietas tanaman, dan iklim) dibaca secara otomatis.',
        'Setiap jawaban didukung oleh rujukan ilmiah pertanian terverifikasi dan aksi kebun 1-klik.',
      ],
      followUpQuestions: [
        'Cegah hama thrips & kutu kebul di kebun saya',
        'Rekomendasi companion planting terbaik',
        'Formula pupuk organik & nutrisi fase berbuah',
      ],
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          gardenContext: {
            plotWidthM: garden.plot.widthM,
            plotDepthM: garden.plot.depthM,
            areaM2,
            objectCount: garden.objects.length,
            activeCrops: activeCropList,
            facilities: Array.from(new Set(garden.objects.map(o => o.facilityType || o.type))),
            hasWater: Boolean(garden.plot.waterSource),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memperoleh jawaban agronomis.');
      }

      const assistantMessage: Message = {
        id: `assist_${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'Rekomendasi agronomis telah disiapkan.',
        citations: data.citations || [],
        keyTakeaways: data.keyTakeaways || [],
        suggestedActions: data.suggestedActions || [],
        followUpQuestions: data.followUpQuestions || [],
        aiModel: data.aiModel || 'gemini-3.8-flash',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Co-Pilot error:', err);
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Terjadi kendala saat menghubungkan ke mesin RAG: ${err instanceof Error ? err.message : 'Error tidak diketahui'}. Silakan coba lagi.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestedAction = (action: SuggestedActionItem) => {
    if (action.type === 'add_companion') {
      const targetCropId = action.plantSpeciesId || 'kemangi';
      const bedWidth = 1.2;
      const bedDepth = 1.0;
      const spawnX = Math.min(garden.plot.widthM - bedWidth - 0.2, Math.max(0.2, (garden.objects.length * 0.8) % (garden.plot.widthM - 1.5)));
      const spawnY = Math.min(garden.plot.depthM - bedDepth - 0.2, Math.max(0.2, ((garden.objects.length * 0.7) % (garden.plot.depthM - 1.5))));

      addObject({
        id: `obj_${Date.now()}`,
        type: 'raised_bed',
        facilityType: 'raised_bed',
        position: { x: spawnX, y: 0, z: spawnY },
        size: { widthM: bedWidth, heightM: 0.35, depthM: bedDepth },
        rotationDeg: 0,
        plantSpeciesId: targetCropId,
        label: action.label.replace('Tanam ', ''),
        irrigationType: 'drip',
      });

      const feedbackMessage: Message = {
        id: `act_${Date.now()}`,
        role: 'assistant',
        content: `Bedengan baru dengan tanaman **${action.label}** telah berhasil ditambahkan ke kanvas kebun Anda pada koordinat (${spawnX.toFixed(1)}m, ${spawnY.toFixed(1)}m).`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, feedbackMessage]);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] lg:w-[580px] bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* ── Top Header ── */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white tracking-wide">Agro-Knowledge Co-Pilot</h2>
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live RAG
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Live Agro-Knowledge Retrieval & AI Co-Pilot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages(messages.slice(0, 1))}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Bersihkan Percakapan"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Tutup Co-Pilot"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Active Garden Context Ribbon ── */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-white/5 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Konteks Lahan:</span>
        <span className="px-2.5 py-0.5 rounded-md bg-black/50 border border-white/10 text-gray-200 text-[11px] font-mono">
          {garden.plot.widthM}m × {garden.plot.depthM}m ({areaM2} m²)
        </span>
        <span className="px-2.5 py-0.5 rounded-md bg-black/50 border border-white/10 text-gray-200 text-[11px] font-mono">
          {garden.objects.length} Komponen
        </span>
        {activeCropList.length > 0 ? (
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5">
            <Sprout size={12} className="text-emerald-400" />
            {activeCropList.map(c => c.nameId).slice(0, 3).join(', ')}
            {activeCropList.length > 3 ? ` +${activeCropList.length - 3}` : ''}
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
            Belum ada tanaman
          </span>
        )}
      </div>

      {/* ── Preset Questions Slider ── */}
      <div className="px-4 py-2.5 bg-black/25 border-b border-white/5 overflow-x-auto no-scrollbar flex items-center gap-2">
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-[11px] text-gray-300 hover:text-emerald-200 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <HelpCircle size={12} className="text-emerald-400 shrink-0" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* ── Message Thread ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Assistant Header Badge */}
            {m.role === 'assistant' && (
              <div className="flex items-center justify-between w-full mb-1.5 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Bot size={13} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-300 tracking-wide">
                    Agro Co-Pilot
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10">
                    {m.aiModel || 'Gemini 3.8 Flash'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(m.id, m.content)}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-emerald-300 hover:bg-white/5 px-2 py-0.5 rounded transition-colors"
                    title="Salin Teks Jawaban"
                  >
                    {copiedId === m.id ? (
                      <>
                        <Check size={11} className="text-emerald-400" />
                        <span className="text-emerald-400">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] font-mono text-gray-500">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            )}

            {/* Bubble Box */}
            <div
              className={`w-full rounded-2xl p-4 sm:p-5 text-xs ${
                m.role === 'user'
                  ? 'max-w-[85%] bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg rounded-br-none ml-auto'
                  : 'bg-slate-900/90 border border-white/10 text-gray-200 shadow-xl rounded-tl-none'
              }`}
            >
              {m.role === 'user' ? (
                <p className="text-sm font-medium leading-relaxed">{m.content}</p>
              ) : (
                /* Rich Formatted AI Response */
                <RichAgroMessageRenderer content={m.content} />
              )}

              {/* Key Takeaways Callout Card */}
              {m.keyTakeaways && m.keyTakeaways.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border-l-4 border-emerald-400 border-y border-r border-emerald-500/20 shadow-md">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="uppercase tracking-wider text-[11px]">Intisari Solusi Agronomis</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-gray-200">
                    {m.keyTakeaways.map((point, kIdx) => (
                      <li key={kIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* RAG Research Citations */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-semibold text-gray-400 flex items-center gap-1.5">
                      <BookOpen size={12} className="text-emerald-400" />
                      Rujukan Riset Terverifikasi (Agro-RAG)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {m.citations.length} Sumber
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {m.citations.map((c, cIdx) => (
                      <a
                        key={cIdx}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-black/50 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-[11px] text-gray-300 hover:text-white transition-all flex items-center justify-between group shadow-sm"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-emerald-300 block truncate text-xs group-hover:text-emerald-200">
                            {c.title}
                          </span>
                          <span className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                            {c.snippet}
                          </span>
                        </div>
                        <ExternalLink size={13} className="text-gray-500 group-hover:text-emerald-400 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Actions (Add Companion / Irrigation) */}
              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2.5">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Aksi Cepat untuk Kebun Anda:
                  </span>
                  <div className="space-y-2">
                    {m.suggestedActions.map((act, aIdx) => (
                      <div
                        key={aIdx}
                        className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-md"
                      >
                        <div>
                          <span className="font-bold text-white block text-xs">
                            {act.label}
                          </span>
                          <span className="text-[11px] text-gray-300 block mt-0.5 leading-relaxed">
                            {act.description}
                          </span>
                        </div>
                        <button
                          onClick={() => handleApplySuggestedAction(act)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shrink-0 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                        >
                          <Plus size={13} />
                          <span>Terapkan</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Question Chips */}
              {m.followUpQuestions && m.followUpQuestions.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-gray-400 block">
                    Pertanyaan Lanjutan yang Disarankan:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.followUpQuestions.map((fq, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => handleSendMessage(fq)}
                        disabled={isLoading}
                        className="text-left px-3 py-1.5 rounded-xl bg-black/40 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-[11px] text-gray-300 hover:text-emerald-200 transition-all flex items-center gap-1.5 shadow-sm group"
                      >
                        <span className="leading-snug">{fq}</span>
                        <ChevronRight size={11} className="text-gray-500 group-hover:text-emerald-400 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <span className="text-[10px] font-mono text-gray-500 mt-1 px-1">
                {m.timestamp}
              </span>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Bot size={18} />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 text-xs text-gray-300 flex items-center gap-2.5 shadow-lg">
              <RefreshCw size={14} className="animate-spin text-emerald-400" />
              <span>Menghubungkan ke Agro Web RAG & menyusun saran agronomis...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="p-4 border-t border-white/10 bg-black/50">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Tanyakan solusi hama, pupuk, atau rotasi..."
            className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-black/70 border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20 shrink-0 active:scale-95"
            title="Kirim Pertanyaan"
          >
            <Send size={15} />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2 px-1 font-mono">
          <span>Didukung AgriSensa AI Engine & Agro-RAG</span>
          <span>Standar Riset Balitsa Kementan</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Rich Visual Renderer for Agronomic Messages
 * Transforms plain markdown text into high-impact visual strategy cards.
 */
function RichAgroMessageRenderer({ content }: { content: string }) {
  // Split into major chunks by markdown headers (### )
  const chunks = content.split(/(?=###\s+)/g);

  return (
    <div className="space-y-4 text-xs">
      {chunks.map((chunk, idx) => {
        const trimmed = chunk.trim();
        if (!trimmed) return null;

        // Check if this chunk is a section starting with ###
        if (trimmed.startsWith('###')) {
          return <StrategyCard key={idx} sectionText={trimmed} />;
        }

        // Otherwise it's the executive overview / intro text
        return <ExecutiveSummaryCard key={idx} text={trimmed} />;
      })}
    </div>
  );
}

/**
 * Executive Summary Hero Card for Intro Paragraphs
 */
function ExecutiveSummaryCard({ text }: { text: string }) {
  return (
    <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/25 shadow-sm space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
        <Sparkles size={13} className="text-emerald-400" />
        <span>Ringkasan Solusi</span>
      </div>
      <div className="text-[13px] text-gray-200 leading-relaxed font-normal space-y-2">
        {text.split('\n\n').map((para, pIdx) => (
          <p
            key={pIdx}
            dangerouslySetInnerHTML={{
              __html: formatInlineMarkdown(para),
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Strategy Card for Numbered Sections (### 1. Judul Langkah)
 */
function StrategyCard({ sectionText }: { sectionText: string }) {
  const lines = sectionText.split('\n');
  const headerLine = lines[0].replace('###', '').trim();
  const bodyLines = lines.slice(1).join('\n').trim();

  // Extract step number (e.g., "1", "2") and clean title
  const stepMatch = headerLine.match(/^(\d+)[\.\s]+(.*)/);
  const stepNumber = stepMatch ? stepMatch[1] : null;
  const title = stepMatch ? stepMatch[2] : headerLine;

  // Detect category icon
  const lowerTitle = title.toLowerCase();
  let IconComponent = Layers;
  let categoryBadge = 'Strategi';
  let badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

  if (lowerTitle.includes('hama') || lowerTitle.includes('mekanis') || lowerTitle.includes('fisik') || lowerTitle.includes('perangkap')) {
    IconComponent = ShieldAlert;
    categoryBadge = 'Pencegahan Fisik';
    badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  } else if (lowerTitle.includes('ekologis') || lowerTitle.includes('companion') || lowerTitle.includes('tanaman') || lowerTitle.includes('barrier')) {
    IconComponent = Sprout;
    categoryBadge = 'Ekologis & Companion';
    badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  } else if (lowerTitle.includes('organik') || lowerTitle.includes('nabati') || lowerTitle.includes('mimba')) {
    IconComponent = Sparkles;
    categoryBadge = 'Organik Hayati';
    badgeColor = 'bg-teal-500/15 text-teal-300 border-teal-500/30';
  } else if (lowerTitle.includes('kuratif') || lowerTitle.includes('cabut') || lowerTitle.includes('sabun') || lowerTitle.includes('darurat')) {
    IconComponent = Flame;
    categoryBadge = 'Tindakan Kuratif';
    badgeColor = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  } else if (lowerTitle.includes('nutrisi') || lowerTitle.includes('pupuk') || lowerTitle.includes('ppm') || lowerTitle.includes('irigasi')) {
    IconComponent = Droplets;
    categoryBadge = 'Nutrisi & Air';
    badgeColor = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  } else if (lowerTitle.includes('cuaca') || lowerTitle.includes('suhu') || lowerTitle.includes('panas')) {
    IconComponent = Sun;
    categoryBadge = 'Adaptasi Iklim';
    badgeColor = 'bg-orange-500/15 text-orange-300 border-orange-500/30';
  }

  // Parse list items
  const items = bodyLines
    .split(/\n(?=[-*\d]\s+)/g)
    .map(line => line.trim())
    .filter(Boolean);

  return (
    <div className="rounded-xl bg-slate-900/90 border border-white/10 hover:border-emerald-500/30 transition-all p-4 space-y-3 shadow-md">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          {stepNumber && (
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {stepNumber.padStart(2, '0')}
            </span>
          )}
          <h4 className="font-bold text-sm text-white tracking-wide">
            {title}
          </h4>
        </div>

        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badgeColor}`}>
          <IconComponent size={11} />
          <span>{categoryBadge}</span>
        </span>
      </div>

      {/* Card Items */}
      <div className="space-y-2.5">
        {items.map((item, iIdx) => {
          // Check if item has bold label: e.g. "- **Label:** text"
          const match = item.match(/^[-*0-9\.\s]*\*\*(.*?)\*\*[\s:]*([\s\S]*)/);
          if (match) {
            const label = match[1].replace(/[:*]/g, '').trim();
            const desc = match[2].trim();
            return (
              <div key={iIdx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-300 text-xs tracking-wide">
                    {label}
                  </span>
                </div>
                <p
                  className="text-xs text-gray-200 pl-3 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatInlineMarkdown(desc),
                  }}
                />
              </div>
            );
          }

          // Fallback regular line
          const cleanLine = item.replace(/^[-*0-9\.\s]+/, '');
          return (
            <div key={iIdx} className="flex items-start gap-2 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <p
                className="text-xs text-gray-200 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatInlineMarkdown(cleanLine),
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Format inline markdown with highlighted keywords & bold tags
 */
function formatInlineMarkdown(str: string): string {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-emerald-300/90 font-mono text-[11px] not-italic">$1</em>')
    .replace(/(\d+(?:\.\d+)?\s*(?:°C|PPM|ml|kg|cm|gram|liter|buah|HST))/gi, '<span class="font-mono text-cyan-300 font-semibold">$1</span>');
}
