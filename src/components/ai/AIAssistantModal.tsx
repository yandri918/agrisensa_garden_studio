/**
 * AgriSensa Garden Studio — AI Assistant Modal
 * Configures goals, cultivation systems, and invokes Gemini AI layout generator.
 * Features:
 *  - Dynamic server AI health check (Gemini Cloud vs Rule-Based Engine).
 *  - Strict collision checking with unplaced-item alerts when plot is overcrowded.
 *  - System-specific planning (soil, hydroponic, mixed).
 * Strictly no emojis.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useGardenStore } from '@/store/gardenStore';
import { generateAIGardenPlan, type AIPlanResponse } from '@/lib/ai/plannerService';
import {
  Sparkles,
  X,
  Check,
  ArrowRight,
  Calendar,
  KeyRound,
  Cpu,
  Layers,
  Wand2,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AIStatusState {
  configured: boolean;
  model: string;
  mode: string;
  providerName: string;
}

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const garden = useGardenStore(state => state.garden);
  const setAILoading = useGardenStore(state => state.setAILoading);
  const loadGarden = useGardenStore(state => state.loadGarden);
  const revalidate = useGardenStore(state => state.revalidate);

  const existingCount = garden.objects.length;

  const [mode, setMode] = useState<'auto_arrange' | 'generate_new'>(
    existingCount > 0 ? 'auto_arrange' : 'generate_new'
  );
  const [goal, setGoal] = useState<'personal' | 'market'>('personal');
  const [systemType, setSystemType] = useState<'soil' | 'hydroponic' | 'mixed'>('mixed');
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AIPlanResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatusState | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetch('/api/ai/status')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setAiStatus(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAiStatus({
            configured: false,
            model: 'rules-engine',
            mode: 'deterministic_rules',
            providerName: 'Rule-Based Spatial Engine (Offline)',
          });
        }
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAILoading(true);
    try {
      const res = await generateAIGardenPlan({
        plot: garden.plot,
        preferences: {
          ...garden.preferences,
          system: systemType,
          systemType,
        },
        systemType,
        goal,
        mode,
        existingObjects: garden.objects,
        userPrompt: userPrompt.trim() || undefined,
      });
      setResult(res);
    } catch (err) {
      console.error('AI Generation failed:', err);
    } finally {
      setIsGenerating(false);
      setAILoading(false);
    }
  };

  const handleApplyLayout = () => {
    if (!result) return;
    loadGarden({
      ...garden,
      objects: result.suggestedObjects,
    });
    revalidate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-xl glass-panel bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Spatial Layout & Agronomic Co-Pilot</h3>
              <p className="text-[11px] text-gray-400">
                Didukung Google Gemini 2.5 Flash untuk lahan {garden.plot.widthM}m × {garden.plot.depthM}m
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Dynamic Engine Status Badge */}
          <div
            className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
              aiStatus?.configured
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              <Cpu size={14} className={aiStatus?.configured ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="font-medium">
                {aiStatus?.configured ? 'Model: Google Gemini 2.5 Flash' : 'Mesin: Rule-Based Spatial Engine'}
              </span>
            </div>
            <div
              className={`flex items-center gap-1.5 text-[11px] font-mono ${
                aiStatus?.configured ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <KeyRound size={12} />
              <span>{aiStatus?.configured ? 'Gemini AI Aktif (Cloud)' : 'Mode Lokal Deterministik'}</span>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-2">Metode Penataan AI</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('auto_arrange')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  mode === 'auto_arrange'
                    ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-sm shadow-emerald-500/10'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-400">
                    <Layers size={14} />
                    <span>Tata Ulang Komponen Saya</span>
                  </div>
                  {existingCount > 0 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                      {existingCount} di Kanvas
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400">
                  AI menata posisi terbaik untuk komponen yang sudah Anda tambahkan dari sidebar tanpa tumpang tindih.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('generate_new')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  mode === 'generate_new'
                    ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-sm shadow-emerald-500/10'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-cyan-400 mb-1">
                  <Wand2 size={14} />
                  <span>Rancang Baru dari Nol</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  AI merancang kebun lengkap baru (sesuai sistem budidaya tanah/hidroponik) presisi ukuran lahan.
                </div>
              </button>
            </div>
          </div>

          {/* Custom Instruction Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <MessageSquare size={13} className="text-emerald-400" />
                <span>Instruksi Khusus untuk AI (Opsional)</span>
              </label>
              <span className="text-[10px] text-gray-500">Natural Language</span>
            </div>
            <textarea
              rows={2}
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              placeholder="Contoh: Taruh kolam dekat pintu masuk, bedengan sayur sejajar ke arah timur, pasang irigasi tetes di semua bedengan..."
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none placeholder:text-gray-600"
            />
          </div>

          {/* Goal Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-2">Tujuan Kebun</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGoal('personal')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  goal === 'personal'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-semibold">Konsumsi Keluarga</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Variasi sayuran daun, bumbu dapur, dan tomat segar.</div>
              </button>

              <button
                type="button"
                onClick={() => setGoal('market')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  goal === 'market'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-semibold">Komersial / Pasar</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Prioritas turnover cepat & hasil jual tinggi (Selada, Pakcoy).</div>
              </button>
            </div>
          </div>

          {/* System Type Selector (only for generate_new) */}
          {mode === 'generate_new' && (
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-2">Sistem Budidaya Utama</label>
              <div className="grid grid-cols-3 gap-2">
                {(['soil', 'hydroponic', 'mixed'] as const).map(sys => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setSystemType(sys)}
                    className={`py-2 px-3 rounded-md text-xs font-medium border text-center transition-all ${
                      systemType === sys
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-semibold'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {sys === 'soil' ? 'Tanah / Bedengan' : sys === 'hydroponic' ? 'Hidroponik' : 'Kombinasi'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate Action Button */}
          {!result && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full btn-primary py-3 text-sm justify-center"
            >
              <Sparkles size={16} />
              <span>
                {isGenerating
                  ? 'Sedang Menganalisis Lahan & Geometri Spasial...'
                  : mode === 'auto_arrange'
                  ? `Optimalkan Posisi ${existingCount} Komponen Bebas Tabrakan`
                  : `Rancang Kebun Baru (${systemType === 'soil' ? 'Tanah' : systemType === 'hydroponic' ? 'Hidroponik' : 'Kombinasi'})`}
              </span>
            </button>
          )}

          {/* AI Result Card */}
          {result && (
            <div className="space-y-4 pt-3 border-t border-white/10">
              {/* Overcrowding Warning if any */}
              {result.warning && (
                <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <AlertTriangle size={15} />
                    <span>Peringatan Kapasitas Spasial Lahan</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">{result.warning}</p>
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Check size={14} />
                    <span>Skema Siap ({result.suggestedObjects.length} Komponen Terpasang)</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {result.provider === 'gemini' ? 'Google Gemini 2.5 Flash' : 'Spatial Engine'}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{result.explanation}</p>
              </div>

              {/* Weekly tasks preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                  <Calendar size={14} className="text-emerald-400" />
                  <span>Panduan Tindakan Lapangan (Touch Grass Weekly Plan)</span>
                </div>
                <div className="space-y-1.5">
                  {result.weeklyAdvice.map((advice, idx) => (
                    <div key={idx} className="p-2 rounded bg-white/5 text-[11px] text-gray-300 border border-white/5">
                      {advice}
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply / Re-generate actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setResult(null)}
                  disabled={isGenerating}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  Ubah Parameter
                </button>
                <button onClick={handleApplyLayout} className="btn-primary flex-1 py-2 text-xs">
                  <span>Terapkan ke Canvas</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
