/**
 * AgriSensa Garden Studio — Agro-Knowledge Co-Pilot Drawer
 * RAG-powered interactive agricultural advisor (Firecrawl + Gemini AI).
 * Connects directly to active garden context, crops, and live weather.
 * Strictly zero emoji in UI (Lucide SVG icons only).
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGardenStore } from '@/store/gardenStore';
import { VEGETABLE_CATALOG } from '@/data/vegetable-catalog';
import { FACILITY_CATALOG } from '@/data/facility-catalog';
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

Saya adalah asisten agronomis Anda yang didukung oleh **RAG (Firecrawl Web Search & Riset Balitsa/BPTP)** dan **Google Gemini Flash**. Saya membaca kondisi riil kebun Anda secara langsung untuk memberikan rekomendasi pencegahan hama, nutrisi organik, dan teknik budidaya presisi.

Silakan pilih topik cepat di atas atau ajukan pertanyaan seputar tanaman Anda.`,
      timestamp: 'Baru saja',
      followUpQuestions: [
        'Cegah hama thrips & kutu kebul di kebun saya',
        'Rekomendasi companion planting',
        'Formula nutrisi organik',
      ],
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

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
        aiModel: data.aiModel,
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

type SuggestedActionItem = NonNullable<Message['suggestedActions']>[number];

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

      // Add feedback message
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* ── Top Header ── */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
            <Bot size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-white">Agro-Knowledge Co-Pilot</h2>
              <span className="flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live RAG
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Firecrawl Web Knowledge Retrieval + Gemini AI
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
      <div className="px-4 py-2.5 bg-slate-900/80 border-b border-white/5 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] text-gray-400 font-medium">Konteks Lahan:</span>
        <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-gray-300 text-[11px]">
          {garden.plot.widthM}m × {garden.plot.depthM}m ({areaM2} m²)
        </span>
        <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-gray-300 text-[11px]">
          {garden.objects.length} Komponen
        </span>
        {activeCropList.length > 0 ? (
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1">
            <Sprout size={12} />
            {activeCropList.map(c => c.nameId).slice(0, 3).join(', ')}
            {activeCropList.length > 3 ? ` +${activeCropList.length - 3}` : ''}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
            Belum ada tanaman
          </span>
        )}
      </div>

      {/* ── Preset Questions Slider ── */}
      <div className="px-4 py-2.5 bg-black/20 border-b border-white/5 overflow-x-auto no-scrollbar flex items-center gap-2">
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/40 text-[11px] text-gray-300 hover:text-emerald-300 transition-all flex items-center gap-1.5"
          >
            <HelpCircle size={11} className="text-emerald-400" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* ── Message Thread ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600/90 text-white shadow-md rounded-br-none'
                  : 'bg-slate-900/90 border border-white/10 text-gray-200 shadow-lg rounded-bl-none'
              }`}
            >
              {/* Message Content */}
              <div className="prose prose-invert prose-xs max-w-none space-y-2">
                {m.content.split('\n\n').map((paragraph, pIdx) => {
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h4 key={pIdx} className="font-semibold text-emerald-400 text-sm mt-2 mb-1">
                        {paragraph.replace('### ', '')}
                      </h4>
                    );
                  }
                  if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
                    const lines = paragraph.split('\n');
                    return (
                      <ul key={pIdx} className="list-disc pl-4 space-y-1 text-gray-300">
                        {lines.map((line, lIdx) => (
                          <li key={lIdx}>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: line.replace(/^[0-9]+\.\s+|^-\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>'),
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p
                      key={pIdx}
                      dangerouslySetInnerHTML={{
                        __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>'),
                      }}
                    />
                  );
                })}
              </div>

              {/* Key Takeaways Callout */}
              {m.keyTakeaways && m.keyTakeaways.length > 0 && (
                <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
                    Poin Penting Agronomis:
                  </span>
                  <ul className="space-y-1 text-[11px] text-gray-200">
                    {m.keyTakeaways.map((point, kIdx) => (
                      <li key={kIdx} className="flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* RAG Citations */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-gray-400 flex items-center gap-1">
                    <BookOpen size={11} className="text-emerald-400" />
                    Referensi Riset Terverifikasi (RAG):
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {m.citations.map((c, cIdx) => (
                      <a
                        key={cIdx}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded bg-black/40 hover:bg-white/5 border border-white/5 text-[11px] text-gray-300 hover:text-emerald-300 transition-colors flex items-center justify-between group"
                      >
                        <div className="truncate pr-2">
                          <span className="font-medium text-emerald-400 block truncate">
                            {c.title}
                          </span>
                          <span className="text-[10px] text-gray-400 line-clamp-1">
                            {c.snippet}
                          </span>
                        </div>
                        <ExternalLink size={12} className="text-gray-500 group-hover:text-emerald-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Actions (Add Companion / Irrigation) */}
              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide block">
                    Aksi Cepat untuk Kebun Anda:
                  </span>
                  <div className="space-y-1.5">
                    {m.suggestedActions.map((act, aIdx) => (
                      <div
                        key={aIdx}
                        className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-medium text-emerald-300 block text-[11px]">
                            {act.label}
                          </span>
                          <span className="text-[10px] text-gray-300 block">
                            {act.description}
                          </span>
                        </div>
                        <button
                          onClick={() => handleApplySuggestedAction(act)}
                          className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-[11px] transition-colors shrink-0 flex items-center gap-1 shadow-sm"
                        >
                          <Plus size={12} />
                          <span>Terapkan</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Question Chips */}
              {m.followUpQuestions && m.followUpQuestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] text-gray-400 block">
                    Pertanyaan Lanjutan:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.followUpQuestions.map((fq, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => handleSendMessage(fq)}
                        disabled={isLoading}
                        className="text-left px-2.5 py-1 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-[10px] text-gray-300 hover:text-emerald-300 transition-all flex items-center gap-1"
                      >
                        <span>{fq}</span>
                        <ChevronRight size={10} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span className="text-[10px] text-gray-500 mt-1 px-1">
              {m.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 text-xs text-gray-300 flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-emerald-400" />
              <span>Menghubungkan ke Firecrawl Web RAG & menyusun saran agronomis...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="p-4 border-t border-white/10 bg-black/40">
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
            className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-black/60 border border-white/10 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-md shrink-0"
            title="Kirim Pertanyaan"
          >
            <Send size={15} />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2 px-1">
          <span>Didukung Firecrawl Scraper & Google Gemini Flash</span>
          <span>Berdasarkan standar agronomi Balitsa Kementan</span>
        </div>
      </div>
    </div>
  );
}
