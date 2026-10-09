/**
 * AgriSensa Garden Studio — Right Inspection & Analytics Panel
 * Tabs: Properties (selected object), Audit (Validation engine), Metrics (Crop Yield & Revenue)
 * Strictly no emojis.
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useGardenStore } from '@/store/gardenStore';
import { FACILITY_CATALOG } from '@/data/facility-catalog';
import { VEGETABLE_CATALOG } from '@/data/vegetable-catalog';
import { calculateGardenMetrics } from '@/lib/calculator/cropCalculator';
import {
  Sliders,
  ShieldAlert,
  TrendingUp,
  RotateCw,
  Lock,
  Unlock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Droplets,
  Coins,
  Scale,
  Footprints,
  Scan,
  Radio,
  Sparkles,
  RefreshCw,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface RightPanelProps {
  onOpenVision?: () => void;
}

export function RightPanel({ onOpenVision }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<'inspect' | 'audit' | 'metrics'>('inspect');

  const garden = useGardenStore(state => state.garden);
  const selectedObjectId = useGardenStore(state => state.selectedObjectId);
  const updateObject = useGardenStore(state => state.updateObject);
  const rotateObject = useGardenStore(state => state.rotateObject);
  const lockObject = useGardenStore(state => state.lockObject);
  const removeObject = useGardenStore(state => state.removeObject);
  const selectObject = useGardenStore(state => state.selectObject);

  const marketPrices = useGardenStore(state => state.marketPrices);
  const useLivePrices = useGardenStore(state => state.useLivePrices);
  const isSyncingMarket = useGardenStore(state => state.isSyncingMarket);
  const marketSource = useGardenStore(state => state.marketSource);
  const marketLastSync = useGardenStore(state => state.marketLastSync);
  const marketScrapedVia = useGardenStore(state => state.marketScrapedVia);
  const fetchMarketPrices = useGardenStore(state => state.fetchMarketPrices);
  const toggleUseLivePrices = useGardenStore(state => state.toggleUseLivePrices);

  useEffect(() => {
    if (Object.keys(marketPrices).length === 0) {
      fetchMarketPrices();
    }
  }, [marketPrices, fetchMarketPrices]);

  const livePriceMap = useMemo(() => {
    if (!useLivePrices) return undefined;
    const map: Record<string, number> = {};
    for (const [k, v] of Object.entries(marketPrices)) {
      map[k] = v.currentPriceIdr;
    }
    return map;
  }, [useLivePrices, marketPrices]);

  const selectedObj = garden.objects.find(o => o.id === selectedObjectId);
  const objType = selectedObj ? (selectedObj.type || selectedObj.facilityType || 'raised_bed') : null;
  const facility = objType ? FACILITY_CATALOG.find(f => f.type === objType) : null;
  const isLocked = Boolean(selectedObj?.locked || selectedObj?.isLocked);
  const posY = selectedObj ? (selectedObj.position.y ?? selectedObj.position.z ?? 0) : 0;

  // Real-time calculation of crop yield & production metrics
  const metrics = useMemo(() => calculateGardenMetrics(garden.objects, livePriceMap), [garden.objects, livePriceMap]);

  const conflicts = garden.validation.conflicts;
  const isValid = garden.validation.status === 'valid' || garden.validation.isValid;

  return (
    <aside className="w-84 h-full glass-panel flex flex-col border-l border-white/10 select-none overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-white/10 bg-black/30">
        <button
          onClick={() => setActiveTab('inspect')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'inspect'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sliders size={14} />
          <span>Properti</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'audit'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ShieldAlert size={14} />
          <span>Validasi</span>
          {conflicts.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
              {conflicts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'metrics'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp size={14} />
          <span>Panen & ROI</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── TAB 1: INSPECT SELECTED OBJECT ── */}
        {activeTab === 'inspect' && (
          <div>
            {selectedObj ? (
              <div className="space-y-4">
                {/* Object Header & Rename */}
                <div className="pb-3 border-b border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-emerald-400">
                      {facility?.nameId || selectedObj.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn-icon"
                        onClick={() => rotateObject(selectedObj.id)}
                        title="Putar 90 Derajat"
                      >
                        <RotateCw size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => lockObject(selectedObj.id, !isLocked)}
                        title={isLocked ? 'Buka Kunci' : 'Kunci Posisi'}
                      >
                        {isLocked ? <Lock size={14} className="text-amber-400" /> : <Unlock size={14} />}
                      </button>
                      <button
                        className="btn-icon hover:text-rose-400"
                        onClick={() => removeObject(selectedObj.id)}
                        title="Hapus Objek"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Nama / Label Objek</label>
                    <input
                      type="text"
                      value={selectedObj.label || ''}
                      onChange={e => updateObject(selectedObj.id, { label: e.target.value })}
                      placeholder="Beri nama objek..."
                      className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Spatial Coordinates */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-gray-400">Posisi (Meter)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">X (Jarak dari Kiri)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedObj.position.x}
                        onChange={e =>
                          updateObject(selectedObj.id, {
                            position: { ...selectedObj.position, x: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Y (Jarak dari Atas)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={posY}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          updateObject(selectedObj.id, {
                            position: { ...selectedObj.position, y: val, z: val },
                          });
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-gray-400">Dimensi Footprint</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Lebar (W)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.3"
                        value={selectedObj.size.widthM}
                        onChange={e =>
                          updateObject(selectedObj.id, {
                            size: { ...selectedObj.size, widthM: parseFloat(e.target.value) || 0.5 },
                          })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Panjang (D)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.3"
                        value={selectedObj.size.depthM}
                        onChange={e =>
                          updateObject(selectedObj.id, {
                            size: { ...selectedObj.size, depthM: parseFloat(e.target.value) || 0.5 },
                          })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Tinggi (H)</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.0"
                        value={selectedObj.size.heightM || 0.3}
                        onChange={e =>
                          updateObject(selectedObj.id, {
                            size: { ...selectedObj.size, heightM: parseFloat(e.target.value) || 0.3 },
                          })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono text-right flex flex-col justify-end">
                      Luas: {(selectedObj.size.widthM * selectedObj.size.depthM).toFixed(2)} m²
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 block">Catatan Khusus</label>
                  <textarea
                    rows={2}
                    value={selectedObj.notes || ''}
                    onChange={e => updateObject(selectedObj.id, { notes: e.target.value })}
                    placeholder="Contoh: Perlu naungan tambahan, pasang mulsa..."
                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Crop Assignment (if raised bed or hydroponic) */}
                {(objType === 'raised_bed' || objType === 'hydroponic') && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="text-[11px] font-mono uppercase text-gray-400">
                      Varietas Tanaman
                    </div>
                    <select
                      value={selectedObj.plantSpeciesId || 'pakcoy'}
                      onChange={e => updateObject(selectedObj.id, { plantSpeciesId: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    >
                      {VEGETABLE_CATALOG.map(crop => (
                        <option key={crop.id} value={crop.id} className="bg-slate-900 text-white">
                          {crop.nameId} ({crop.harvestDays} hari panen)
                        </option>
                      ))}
                    </select>

                    {/* Plant Health & Roboflow Vision Diagnostics */}
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-gray-400">
                          <Scan size={13} className="text-emerald-400" />
                          <span>Status Kesehatan</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${
                            selectedObj.healthStatus === 'critical'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : selectedObj.healthStatus === 'warning'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : selectedObj.healthStatus === 'healthy'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-white/5 text-gray-400 border-white/10'
                          }`}
                        >
                          {selectedObj.healthStatus === 'critical'
                            ? 'Bahaya Hama'
                            : selectedObj.healthStatus === 'warning'
                            ? 'Waspada'
                            : selectedObj.healthStatus === 'healthy'
                            ? 'Sehat'
                            : 'Belum Pindai'}
                        </span>
                      </div>

                      {selectedObj.pestAlert && (
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center justify-between">
                          <span className="truncate pr-1">Peringatan: {selectedObj.pestAlert}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateObject(selectedObj.id, {
                                healthStatus: 'healthy',
                                pestAlert: undefined,
                                detectedIssues: [],
                              })
                            }
                            className="text-[10px] text-gray-400 hover:text-white underline shrink-0"
                          >
                            Reset
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={onOpenVision}
                        className="w-full py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5 transition-colors"
                        title="Pindai daun bedengan ini menggunakan Computer Vision Roboflow"
                      >
                        <Scan size={13} className="text-emerald-400" />
                        <span>Inspeksi Daun (Roboflow Vision)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── IoT Sensor Telemetry & Microclimate Node ── */}
                {objType === 'iot_sensor' && (
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-gray-400">
                        <Radio size={13} className="text-cyan-400" />
                        <span>Node Telemetri Tanah IoT</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Online (LoRa)
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2.5 text-xs">
                      {/* Soil Moisture */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-gray-400">Kelembaban Tanah (Moisture)</span>
                          <span className="text-cyan-300 font-mono font-bold">48% (Optimal)</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-cyan-500 h-full rounded-full" style={{ width: '48%' }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-0.5">
                          <span>Kering (&lt;30%)</span>
                          <span>Ideal (40-60%)</span>
                          <span>Jenuh (&gt;70%)</span>
                        </div>
                      </div>

                      {/* Soil EC & pH */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                        <div className="p-2 rounded-lg bg-white/5 text-center">
                          <div className="text-[10px] text-gray-400">EC Nutrisi</div>
                          <div className="text-sm font-bold text-emerald-300 font-mono">1.8 <span className="text-[9px]">mS/cm</span></div>
                          <div className="text-[9px] text-gray-500">Subur / Siap Serap</div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 text-center">
                          <div className="text-[10px] text-gray-400">pH Tanah</div>
                          <div className="text-sm font-bold text-amber-300 font-mono">6.4</div>
                          <div className="text-[9px] text-gray-500">Netral Ideal</div>
                        </div>
                      </div>

                      {/* Soil Temperature */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5 text-gray-300">
                        <span>Suhu Zona Perakaran:</span>
                        <span className="font-mono text-white font-semibold">24.8°C</span>
                      </div>
                    </div>

                    {/* Smart Synergy with Weather Advisory */}
                    <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200/90 space-y-1">
                      <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        <span>Sinergi Cuaca & Sensor Titik Pin Ini</span>
                      </div>
                      <p className="text-[10px] opacity-80 leading-relaxed">
                        Data sensor tanah disinkronkan dengan data cuaca Open-Meteo pada koordinat pin lahan ini. Jika kelembaban tanah cukup dan cuaca memprediksi hujan, jadwal irigasi otomatis tertunda (*Smart Rain Delay*).
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Irrigation Configuration ── */}
                {(objType === 'raised_bed' || objType === 'hydroponic' || objType === 'decorative') && (
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-gray-400">
                        <Droplets size={13} className="text-cyan-400" />
                        <span>Sistem Irigasi</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        {selectedObj.irrigationType === 'drip'
                          ? 'Tetes Presisi'
                          : selectedObj.irrigationType === 'sprinkler'
                          ? 'Sprinkler'
                          : selectedObj.irrigationType === 'manual'
                          ? 'Manual'
                          : 'Belum Diatur'}
                      </span>
                    </div>

                    {/* Mode Selector Buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateObject(selectedObj.id, {
                            irrigationType: 'drip',
                            dripSpacingCm: selectedObj.dripSpacingCm || 20,
                            dripLinesCount: selectedObj.dripLinesCount || 2,
                          })
                        }
                        className={`py-2 px-1 text-center rounded border text-[11px] font-medium transition-all ${
                          selectedObj.irrigationType === 'drip'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
                            : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="font-semibold">Tetes (Drip)</div>
                        <div className="text-[9px] opacity-75">Hemat Air</div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateObject(selectedObj.id, {
                            irrigationType: 'sprinkler',
                            sprinklerRadiusM: selectedObj.sprinklerRadiusM || 2.0,
                          })
                        }
                        className={`py-2 px-1 text-center rounded border text-[11px] font-medium transition-all ${
                          selectedObj.irrigationType === 'sprinkler'
                            ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-sm shadow-blue-500/20'
                            : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="font-semibold">Sprinkler</div>
                        <div className="text-[9px] opacity-75">Semprot Mikro</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateObject(selectedObj.id, { irrigationType: 'manual' })}
                        className={`py-2 px-1 text-center rounded border text-[11px] font-medium transition-all ${
                          selectedObj.irrigationType === 'manual'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="font-semibold">Manual</div>
                        <div className="text-[9px] opacity-75">Gembor/Selang</div>
                      </button>
                    </div>

                    {/* Drip Details */}
                    {selectedObj.irrigationType === 'drip' && (
                      <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 space-y-2.5 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Jarak Lubang (Emitter)</label>
                            <select
                              value={selectedObj.dripSpacingCm || 20}
                              onChange={e =>
                                updateObject(selectedObj.id, { dripSpacingCm: parseInt(e.target.value) || 20 })
                              }
                              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value={15}>15 cm (Rapat - Selada/Pakcoy)</option>
                              <option value={20}>20 cm (Standar)</option>
                              <option value={30}>30 cm (Lebar - Cabai/Tomat)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Jumlah Lajur Selang</label>
                            <select
                              value={selectedObj.dripLinesCount || 2}
                              onChange={e =>
                                updateObject(selectedObj.id, { dripLinesCount: parseInt(e.target.value) || 2 })
                              }
                              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value={1}>1 Lajur (Bedengan &lt; 0.6m)</option>
                              <option value={2}>2 Lajur (Standar 0.8-1.2m)</option>
                              <option value={3}>3 Lajur (Bedengan Lebar)</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-cyan-200/90 pt-1 border-t border-cyan-500/10 font-mono">
                          <span>Titik Tetes: ~{Math.floor((selectedObj.size.depthM / ((selectedObj.dripSpacingCm || 20) / 100)) * (selectedObj.dripLinesCount || 2))} emitter</span>
                          <span>Durasi: ~15-20 mnt/hr</span>
                        </div>
                      </div>
                    )}

                    {/* Sprinkler Details */}
                    {selectedObj.irrigationType === 'sprinkler' && (
                      <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/20 space-y-2.5 text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-gray-400">Radius Semprot (Jangkauan)</span>
                            <span className="text-blue-300 font-mono font-semibold">
                              {(selectedObj.sprinklerRadiusM || 2.0).toFixed(1)} meter
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="4.0"
                            step="0.25"
                            value={selectedObj.sprinklerRadiusM || 2.0}
                            onChange={e =>
                              updateObject(selectedObj.id, { sprinklerRadiusM: parseFloat(e.target.value) || 2.0 })
                            }
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                            <span>1.0m (Mikro)</span>
                            <span>Diameter: {((selectedObj.sprinklerRadiusM || 2.0) * 2).toFixed(1)}m</span>
                            <span>4.0m (Taman Luas)</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-blue-200/90 pt-1 border-t border-blue-500/10 font-mono flex justify-between">
                          <span>Cakupan: {(Math.PI * Math.pow(selectedObj.sprinklerRadiusM || 2.0, 2)).toFixed(1)} m²</span>
                          <span>Durasi: ~10 mnt/hr</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Apply to all similar beds */}
                    <button
                      type="button"
                      onClick={() => {
                        const targetType = selectedObj.type || selectedObj.facilityType;
                        const it = selectedObj.irrigationType || 'drip';
                        const radius = selectedObj.sprinklerRadiusM || 2.0;
                        const spacing = selectedObj.dripSpacingCm || 20;
                        const lines = selectedObj.dripLinesCount || 2;

                        garden.objects.forEach(o => {
                          if ((o.type || o.facilityType) === targetType) {
                            updateObject(o.id, {
                              irrigationType: it,
                              sprinklerRadiusM: radius,
                              dripSpacingCm: spacing,
                              dripLinesCount: lines,
                            });
                          }
                        });
                      }}
                      className="w-full py-1.5 px-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-gray-300 font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Droplets size={12} className="text-cyan-400" />
                      <span>Terapkan Mode Ini ke Semua {selectedObj.label?.split('#')[0]?.trim() || 'Bedengan'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (

              <div className="py-12 text-center text-gray-500 space-y-2">
                <Sliders className="mx-auto text-gray-600" size={28} />
                <p className="text-xs">Klik objek di canvas 2D untuk mengatur koordinat, ukuran, dan tanaman.</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: AUDIT & SPATIAL VALIDATION ── */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
              {isValid ? (
                <>
                  <CheckCircle2 className="text-emerald-400" size={18} />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Layout Bebas Konflik</h4>
                    <p className="text-[11px] text-gray-400">Seluruh objek berada dalam batas dan terjangkau.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="text-rose-400" size={18} />
                  <div>
                    <h4 className="text-xs font-semibold text-rose-300">{conflicts.length} Masalah Spasial</h4>
                    <p className="text-[11px] text-gray-400">Perlu perbaikan tata letak sebelum dieksekusi.</p>
                  </div>
                </>
              )}
            </div>

            {/* List of conflicts */}
            {conflicts.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-gray-400">Daftar Konflik Terdeteksi</div>
                {conflicts.map((c, i) => {
                  const targetId = c.objectId || c.ids?.[0];
                  const conflictType = c.type.toUpperCase();
                  const typeLabel =
                    conflictType.includes('OVERLAP') ? 'Tumpang Tindih'
                    : conflictType.includes('BOUNDS') ? 'Keluar Batas'
                    : 'Akses Terhalang';

                  return (
                    <div
                      key={c.id || i}
                      onClick={() => targetId && selectObject(targetId)}
                      className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/50 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-rose-400 uppercase font-mono">
                          {typeLabel}
                        </span>
                        <span className="text-[10px] text-gray-400">Lihat Objek</span>
                      </div>
                      <p className="text-xs text-gray-200">{c.message}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rules summary */}
            <div className="space-y-2 pt-2 border-t border-white/10 text-[11px] text-gray-400">
              <div className="font-semibold text-gray-300">Aturan Spasial Aktif:</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Batas lahan: Objek fisik tidak boleh keluar dari dimensi plot.</li>
                <li>Zona terlarang: Menghindari tangki, tangga, atau area utilitas.</li>
                <li>Pemisahan fisik: Bedengan dan fasilitas tidak boleh bertabrakan.</li>
                <li>Aksesibilitas: Komponen wajib terjangkau dari pintu masuk.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── TAB 3: HARVEST & FINANCIAL ESTIMATES ── */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            {/* Live Market Price Intelligence (Firecrawl) */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-black/40 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-400" />
                  <span className="text-xs font-semibold text-white">Live Market Intelligence</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                    marketScrapedVia === 'firecrawl_live'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {marketScrapedVia === 'firecrawl_live' ? 'Firecrawl Live' : 'Bapanas Index'}
                  </span>
                  <button
                    onClick={() => fetchMarketPrices(true)}
                    disabled={isSyncingMarket}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                    title="Sinkronisasi harga pasar dengan Firecrawl"
                  >
                    <RefreshCw size={12} className={isSyncingMarket ? 'animate-spin text-amber-400' : ''} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                <span className="text-gray-400">Mode Harga Dinamis</span>
                <button
                  type="button"
                  onClick={() => toggleUseLivePrices()}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                    useLivePrices
                      ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {useLivePrices ? 'AKTIF (LIVE)' : 'STANDAR KATALOG'}
                </button>
              </div>

              <div className="text-[9px] text-gray-400/90 font-mono flex items-center justify-between">
                <span className="truncate max-w-[180px]">{marketSource}</span>
                {marketLastSync && (
                  <span>{new Date(marketLastSync).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mb-1">
                  <Scale size={13} />
                  <span>Estimasi Panen</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">
                  {metrics.totalYieldPerMonthKg} <span className="text-xs font-normal text-gray-400">kg/bulan</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center justify-between text-[11px] text-amber-400 font-medium mb-1">
                  <div className="flex items-center gap-1.5">
                    <Coins size={13} />
                    <span>Nilai Panen Bruto</span>
                  </div>
                  {useLivePrices && metrics.revenueDeltaPct !== 0 && (
                    <span className={`text-[9px] font-mono px-1 py-0.5 rounded font-bold flex items-center ${
                      metrics.revenueDeltaPct > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {metrics.revenueDeltaPct > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {metrics.revenueDeltaPct > 0 ? `+${metrics.revenueDeltaPct}%` : `${metrics.revenueDeltaPct}%`}
                    </span>
                  )}
                </div>
                <div className="text-base font-bold font-mono text-white">
                  Rp {(metrics.totalEstimatedMonthlyRevenueIdr / 1000).toLocaleString('id-ID')}k
                  <span className="text-xs font-normal text-gray-400">/bln</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-1 pt-1 border-t border-white/5 flex items-center justify-between">
                  <span>Margin Bersih (~70%):</span>
                  <span className="font-bold">Rp {(metrics.estimatedMonthlyNetProfitIdr / 1000).toLocaleString('id-ID')}k</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-medium mb-1">
                  <Droplets size={13} />
                  <span>Kebutuhan Air</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">
                  {metrics.dailyWaterRequirementLiters} <span className="text-xs font-normal text-gray-400">L/hari</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-1.5 text-[11px] text-purple-400 font-medium mb-1">
                  <Footprints size={13} />
                  <span>Kapasitas Tanam</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">
                  {metrics.totalPlantCapacity} <span className="text-xs font-normal text-gray-400">titik tanam</span>
                </div>
              </div>
            </div>

            {/* Irrigation & Water Schedule Card */}
            <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                <div className="flex items-center gap-1.5">
                  <Droplets size={14} className="text-cyan-400" />
                  <span>Jadwal & Efisiensi Irigasi</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400/80">Otomasi Zona</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                <div className="p-2 rounded bg-black/40 border border-white/5 space-y-0.5">
                  <div className="text-[10px] text-cyan-400 font-mono">ZONA TETES (DRIP)</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {metrics.irrigation?.dripBedCount || 0} bedengan
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    Durasi: ~{metrics.irrigation?.recommendedDripDurationMin || 15} mnt/hr
                  </div>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/5 space-y-0.5">
                  <div className="text-[10px] text-blue-400 font-mono">SPRINKLER MIKRO</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {metrics.irrigation?.sprinklerCount || 0} titik semprot
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    Durasi: ~{metrics.irrigation?.recommendedSprinklerDurationMin || 10} mnt/hr
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Rekomendasi penyiraman optimal: Pagi (06.30 - 07.30) atau Sore (16.30 - 17.30) untuk meminimalkan kehilangan air akibat evaporasi.
              </p>
            </div>

            {/* Breakdown per crop */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-[11px] font-mono uppercase text-gray-400 flex items-center justify-between">
                <span>Rincian per Varietas</span>
                {useLivePrices && (
                  <span className="text-[9px] text-amber-400 font-mono font-medium">Harga Pasar Terkini</span>
                )}
              </div>
              {metrics.breakdown.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">
                  Belum ada bedengan atau instalasi hidroponik di kebun.
                </div>
              ) : (
                metrics.breakdown.map(item => (
                  <div key={item.cropId} className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{item.cropName}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-amber-300">
                          Rp {item.pricePerKg.toLocaleString('id-ID')}/kg
                        </span>
                        {useLivePrices && item.deltaPct !== 0 && (
                          <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                            item.deltaPct > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {item.deltaPct > 0 ? `+${item.deltaPct}%` : `${item.deltaPct}%`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>{item.totalAreaM2} m² ({item.plantCount} tanaman)</span>
                      <span className="font-mono text-emerald-400 font-medium">
                        ~Rp {(item.estimatedValueIdr / 1000).toLocaleString('id-ID')}k/bln
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5 border-t border-white/5 font-mono">
                      <span>Panen: ~{item.monthlyYieldKg} kg/bln</span>
                      <span>Air: {item.waterDemandLitersPerDay} L/hari</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
