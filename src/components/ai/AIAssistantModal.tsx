/**
 * AgriSensa Garden Studio — AI Assistant Modal
 * Interactive modal to configure goals and generate optimized garden layouts powered by Gemini API.
 * No emojis used.
 */

'use client';

import React, { useState } from 'react';
import { useGardenStore } from '@/store/gardenStore';
import { generateAIGardenPlan, type AIPlanResponse } from '@/lib/ai/plannerService';
import { Sparkles, X, Check, ArrowRight, Calendar, KeyRound, Cpu } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const garden = useGardenStore(state => state.garden);
  const setAILoading = useGardenStore(state => state.setAILoading);
  const loadGarden = useGardenStore(state => state.loadGarden);
  const revalidate = useGardenStore(state => state.revalidate);

  const [goal, setGoal] = useState<'personal' | 'market'>('personal');
  const [systemType, setSystemType] = useState<'soil' | 'hydroponic' | 'mixed'>('mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AIPlanResponse | null>(null);

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
        goal,
      });
      setResult(res);
    } catch {
      // Error handling
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-xl glass-panel bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Garden Layout Generator</h3>
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
          {/* Engine Status Badge */}
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <Cpu size={14} className="text-emerald-400" />
              <span className="font-medium">Model: Google Gemini 2.5 Flash</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <KeyRound size={12} />
              <span>API Key Terhubung</span>
            </div>
          </div>

          {/* Goal Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-2">Tujuan Kebun</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGoal('personal')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  goal === 'personal'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-semibold">Konsumsi Keluarga</div>
                <div className="text-[10px] text-gray-400 mt-1">Variasi sayuran daun, bumbu dapur, dan tomat segar.</div>
              </button>

              <button
                type="button"
                onClick={() => setGoal('market')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  goal === 'market'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-semibold">Komersial / Pasar</div>
                <div className="text-[10px] text-gray-400 mt-1">Prioritas turnover cepat dan nilai jual tinggi (Selada, Pakcoy, Kale).</div>
              </button>
            </div>
          </div>

          {/* System Type Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-2">Sistem Budidaya</label>
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

          {/* Generate Action Button */}
          {!result && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full btn-primary py-3 text-sm justify-center"
            >
              <Sparkles size={16} />
              <span>{isGenerating ? 'Gemini Sedang Menganalisis Lahan...' : 'Rancang Tata Letak dengan Gemini AI'}</span>
            </button>
          )}

          {/* AI Result Card */}
          {result && (
            <div className="space-y-4 pt-3 border-t border-white/10">
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Check size={14} />
                    <span>Rekomendasi Siap ({result.suggestedObjects.length} Komponen Terpasang)</span>
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
                  <span>Panduan Perawatan Rutin dari AI</span>
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
                <button onClick={handleGenerate} disabled={isGenerating} className="btn-secondary flex-1 py-2 text-xs">
                  Generate Ulang
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
