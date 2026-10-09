/**
 * AgriSensa Garden Studio — Paste-a-Seed Smart Variety & Seed Importer Modal
 * Uses Firecrawl for live product page scraping + Google Gemini 2.5 Flash for agronomic extraction.
 * Strictly no emojis used.
 */

'use client';

import React, { useState } from 'react';
import { useGardenStore } from '@/store/gardenStore';
import { FACILITY_CATALOG } from '@/data/facility-catalog';
import type { VegetableEntry } from '@/data/vegetable-catalog';
import {
  Sprout,
  X,
  Sparkles,
  Link2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Sun,
  Ruler,
  Clock,
  Scale,
  Flame,
} from 'lucide-react';

interface SeedImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportResponse {
  success: boolean;
  crop: VegetableEntry;
  summary: string;
  scrapedVia: string;
  sourceUrl?: string;
}

export function SeedImporterModal({ isOpen, onClose }: SeedImporterModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [rawTextInput, setRawTextInput] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const addCustomCrop = useGardenStore(state => state.addCustomCrop);
  const addObject = useGardenStore(state => state.addObject);
  const selectObject = useGardenStore(state => state.selectObject);
  const updateObject = useGardenStore(state => state.updateObject);
  const selectedObjectId = useGardenStore(state => state.selectedObjectId);
  const garden = useGardenStore(state => state.garden);

  const plotW = garden.plot.widthM;
  const plotD = garden.plot.depthM;
  const selectedObj = garden.objects.find(o => o.id === selectedObjectId);
  const isSelectedBedOrHydro = Boolean(
    selectedObj && (
      selectedObj.type === 'raised_bed' ||
      selectedObj.type === 'hydroponic' ||
      selectedObj.facilityType === 'raised_bed' ||
      selectedObj.facilityType === 'hydroponic'
    )
  );

  if (!isOpen) return null;

  const handleImport = async (targetUrl?: string, targetText?: string) => {
    const url = targetUrl ?? urlInput;
    const text = targetText ?? rawTextInput;

    if (!url.trim() && !text.trim()) {
      setError('Harap masukkan URL produk benih atau deskripsi benih.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/seed/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim() || undefined,
          rawText: text.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengimpor benih dari sumber yang diberikan.');
      }

      setResult(data);
      // Automatically add to user custom catalog
      if (data.crop) {
        addCustomCrop(data.crop);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses benih.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToSelected = () => {
    if (!result?.crop || !selectedObj) return;
    updateObject(selectedObj.id, { plantSpeciesId: result.crop.id });
    onClose();
  };

  const handleSpawnNewBed = () => {
    if (!result?.crop) return;
    const crop = result.crop;
    const facility = FACILITY_CATALOG.find(f => f.type === 'raised_bed') || FACILITY_CATALOG[0];
    const currentCount = garden.objects.length;
    const spawnX = Math.min(plotW - facility.defaultSize.widthM, 1.0 + (currentCount % 4) * 1.5);
    const spawnY = Math.min(plotD - facility.defaultSize.depthM, 1.0 + Math.floor(currentCount / 4) * 2.5);

    const newBedId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    addObject({
      id: newBedId,
      label: `Bedengan ${crop.nameId} #${currentCount + 1}`,
      type: 'raised_bed',
      facilityType: 'raised_bed',
      position: { x: Math.max(0.2, spawnX), y: Math.max(0.2, spawnY), z: Math.max(0.2, spawnY) },
      size: { ...facility.defaultSize },
      rotationDeg: 0,
      locked: false,
      isLocked: false,
      required: false,
      cropAssignments: [],
      plantSpeciesId: crop.id,
    });

    selectObject(newBedId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-white/10 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Sprout className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Paste-a-Seed: Smart Variety Importer</span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Flame size={10} />
                  <span>Firecrawl + Gemini AI</span>
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Ekstrak otomatis spesifikasi agronomis, jarak tanam, dan potensi panen dari link benih.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* URL Input Form */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-mono uppercase text-gray-400 block mb-1.5">
              URL Produk Benih / Toko Pertanian
            </label>
            <div className="relative">
              <Link2 size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="Contoh: https://panahmerah.id/product/tomat-servo-f1..."
                disabled={isLoading}
                className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Quick Preset Samples */}
          <div>
            <div className="text-[10px] text-gray-400 font-mono mb-1.5 flex items-center justify-between">
              <span>UJI COBA INSTAN (CONTOH KATALOG RESMI):</span>
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                className="text-emerald-400 hover:underline flex items-center gap-1 text-[10px]"
              >
                <FileText size={10} />
                <span>{showRawText ? 'Sembunyikan Input Teks' : 'Input Teks Manual'}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setUrlInput('https://panahmerah.id/product/tomat-servo-f1');
                  handleImport('https://panahmerah.id/product/tomat-servo-f1');
                }}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
              >
                Tomat Servo F1 (Panah Merah)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrlInput('https://known-you.com/product/melon-golden-alisha');
                  handleImport('https://known-you.com/product/melon-golden-alisha');
                }}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
              >
                Melon Golden Alisha (Known-You)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrlInput('https://tunasagro.com/product/cabai-shypoon');
                  handleImport('https://tunasagro.com/product/cabai-shypoon');
                }}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
              >
                Cabai Rawit Shypoon (Tunas Agro)
              </button>
            </div>
          </div>

          {/* Optional Raw Text Textarea */}
          {showRawText && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <label className="text-[10px] text-gray-400 block font-mono">
                Tempel Deskripsi Kemasan / Brosur Benih:
              </label>
              <textarea
                rows={3}
                value={rawTextInput}
                onChange={e => setRawTextInput(e.target.value)}
                placeholder="Tempel teks spesifikasi benih dari deskripsi produk atau kemasan di sini..."
                className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none font-mono"
              />
            </div>
          )}

          {/* Action Trigger */}
          <button
            type="button"
            onClick={() => handleImport()}
            disabled={isLoading || (!urlInput.trim() && !rawTextInput.trim())}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/50"
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin text-white" />
                <span>Mengekstrak via Firecrawl & Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Impor & Analisis Varietas Benih</span>
              </>
            )}
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs">
            <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Extraction Result Preview Card */}
        {result?.crop && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 to-black/60 border border-emerald-500/30 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
              <div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <h3 className="text-xs font-bold text-white">{result.crop.nameId}</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono uppercase">
                    {result.crop.type}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 italic">
                  {result.crop.scientificName || result.crop.nameEn}
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                {result.scrapedVia === 'firecrawl_live' ? 'Firecrawl Scraped' : 'AI Extracted'}
              </span>
            </div>

            {/* Agronomic Parameter Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-gray-300">
              <div className="p-2 rounded bg-black/40 border border-white/5 space-y-0.5">
                <div className="text-gray-400 flex items-center gap-1">
                  <Clock size={10} className="text-amber-400" />
                  <span>MASA PANEN</span>
                </div>
                <div className="text-xs font-bold text-white">{result.crop.harvestDays} HST</div>
              </div>

              <div className="p-2 rounded bg-black/40 border border-white/5 space-y-0.5">
                <div className="text-gray-400 flex items-center gap-1">
                  <Ruler size={10} className="text-cyan-400" />
                  <span>JARAK TANAM</span>
                </div>
                <div className="text-xs font-bold text-white">{result.crop.spacingCm} cm</div>
              </div>

              <div className="p-2 rounded bg-black/40 border border-white/5 space-y-0.5">
                <div className="text-gray-400 flex items-center gap-1">
                  <Scale size={10} className="text-emerald-400" />
                  <span>EST. HASIL</span>
                </div>
                <div className="text-xs font-bold text-white">{result.crop.yieldSoilKgM2} kg/m²</div>
              </div>

              <div className="p-2 rounded bg-black/40 border border-white/5 space-y-0.5">
                <div className="text-gray-400 flex items-center gap-1">
                  <Sun size={10} className="text-yellow-400" />
                  <span>SINAR</span>
                </div>
                <div className="text-xs font-bold text-white uppercase">{result.crop.lightNeeds}</div>
              </div>
            </div>

            {/* Agronomic AI Summary & Climate Note */}
            <div className="text-xs text-gray-300 space-y-1 bg-black/30 p-2.5 rounded-lg border border-white/5">
              <p className="leading-relaxed text-[11px]">{result.summary}</p>
              {result.crop.climateNote && (
                <div className="text-[10px] text-gray-400 pt-1 border-t border-white/5">
                  <strong className="text-gray-300">Tips Budidaya:</strong> {result.crop.climateNote}
                </div>
              )}
            </div>

            {/* Action Buttons to plant */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {isSelectedBedOrHydro && selectedObj && (
                <button
                  type="button"
                  onClick={handleApplyToSelected}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sprout size={13} />
                  <span>Tanam di {selectedObj.label?.split('#')[0]?.trim() || 'Bedengan Ini'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSpawnNewBed}
                className="flex-1 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={13} className="text-emerald-400" />
                <span>+ Buat Bedengan Baru</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
