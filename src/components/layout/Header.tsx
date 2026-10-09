/**
 * AgriSensa Garden Studio — Application Header
 * View toggle, undo/redo, validation status, AI trigger, export.
 * No emojis used.
 */

'use client';

import React from 'react';
import { useGardenStore } from '@/store/gardenStore';
import {
  Undo2,
  Redo2,
  Layers,
  Box,
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Scan,
  Sprout,
  Bot,
} from 'lucide-react';
import { WeatherWidget } from '@/components/weather/WeatherWidget';

interface HeaderProps {
  onOpenAI: () => void;
  onOpenExport: () => void;
  onOpenVision?: () => void;
  onOpenSeedImporter?: () => void;
  onOpenCopilot?: () => void;
}

export function Header({
  onOpenAI,
  onOpenExport,
  onOpenVision,
  onOpenSeedImporter,
  onOpenCopilot,
}: HeaderProps) {
  const garden = useGardenStore(state => state.garden);
  const viewMode = useGardenStore(state => state.viewMode);
  const setViewMode = useGardenStore(state => state.setViewMode);
  const undo = useGardenStore(state => state.undo);
  const redo = useGardenStore(state => state.redo);
  const canUndo = useGardenStore(state => state.canUndo);
  const canRedo = useGardenStore(state => state.canRedo);
  const resetGarden = useGardenStore(state => state.resetGarden);
  const setGardenName = useGardenStore(state => state.setGardenName);
  const isAILoading = useGardenStore(state => state.isAILoading);

  const isValid = garden.validation.status === 'valid' || Boolean(garden.validation.isValid);
  const conflictCount = garden.validation.conflicts.length;

  return (
    <header className="h-14 w-full flex items-center justify-between px-5 glass-toolbar z-40 border-b border-white/10 select-none">
      {/* Brand & Garden Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
          <Layers className="text-emerald-400" size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide text-white">
              AgriSensa
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Garden Studio
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <input
              type="text"
              value={garden.name}
              onChange={e => setGardenName(e.target.value)}
              className="bg-transparent hover:bg-white/5 focus:bg-black/50 border border-transparent hover:border-white/10 focus:border-emerald-500 rounded px-1.5 py-0.5 text-[11px] text-gray-200 focus:outline-none transition-all w-48"
              title="Klik untuk mengubah nama kebun"
            />
            <span className="text-gray-500 font-mono">
              ({garden.plot.widthM}m × {garden.plot.depthM}m)
            </span>
          </div>
        </div>
      </div>

      {/* Center: View Switcher & History Controls */}
      <div className="flex items-center gap-2">
        {/* 2D / 3D Mode Toggle */}
        <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
          <button
            onClick={() => setViewMode('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === '2d'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>2D Blueprint</span>
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === '3d'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box size={14} />
            <span>3D Scene</span>
          </button>
        </div>

        <div className="h-6 w-[1px] bg-white/10 mx-1" />

        {/* Undo / Redo */}
        <button
          className="btn-icon"
          onClick={undo}
          disabled={!canUndo}
          title="Urungkan (Undo)"
        >
          <Undo2 size={16} />
        </button>
        <button
          className="btn-icon"
          onClick={redo}
          disabled={!canRedo}
          title="Ulangi (Redo)"
        >
          <Redo2 size={16} />
        </button>
        <button
          className="btn-icon text-gray-400 hover:text-red-400"
          onClick={() => {
            if (confirm('Reset kebun ke template awal? Perubahan saat ini akan dibersihkan.')) {
              resetGarden();
            }
          }}
          title="Reset Kebun"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Right: Validation Status, AI, Export */}
      <div className="flex items-center gap-3">
        {/* Validation Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
            isValid
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          {isValid ? (
            <>
              <CheckCircle2 size={13} />
              <span>Tata Letak Valid</span>
            </>
          ) : (
            <>
              <AlertTriangle size={13} />
              <span>{conflictCount} Masalah Spasial</span>
            </>
          )}
        </div>

        {/* Live Weather & Microclimate Telemetry Widget */}
        <WeatherWidget onOpenVisionScanner={onOpenVision} />

        {/* AI Vision Scanner Modal Trigger */}
        {onOpenVision && (
          <button
            onClick={onOpenVision}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition-all shadow-sm"
            title="Pindai Hama & Penyakit Tanaman dengan Roboflow Vision"
          >
            <Scan size={14} className="text-emerald-400" />
            <span>AI Vision</span>
          </button>
        )}

        {/* Paste-a-Seed Importer Modal Trigger */}
        {onOpenSeedImporter && (
          <button
            onClick={onOpenSeedImporter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-all shadow-sm"
            title="Paste-a-Seed: Impor Varietas Benih dari Web"
          >
            <Sprout size={14} className="text-amber-400" />
            <span>Impor Benih</span>
          </button>
        )}

        {/* Agro-Knowledge RAG Co-Pilot Drawer Trigger */}
        {onOpenCopilot && (
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-all shadow-sm group"
            title="Agro-Knowledge RAG Co-Pilot: Konsultasi Pertanian Cerdas Berbasis Riset & AI"
          >
            <Bot size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Agro Co-Pilot</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-200">
              RAG
            </span>
          </button>
        )}

        {/* AI Planner Modal Trigger */}
        <button
          onClick={onOpenAI}
          disabled={isAILoading}
          className="btn-primary"
        >
          <Sparkles size={14} />
          <span>{isAILoading ? 'Menghitung...' : 'AI Planner'}</span>
        </button>

        {/* Export / Print */}
        <button
          onClick={onOpenExport}
          className="btn-secondary"
        >
          <Download size={14} />
          <span>Ekspor</span>
        </button>
      </div>
    </header>
  );
}
