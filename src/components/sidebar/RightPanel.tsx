/**
 * AgriSensa Garden Studio — Right Inspection & Analytics Panel
 * Tabs: Properties (selected object), Audit (Validation engine), Metrics (Crop Yield & Revenue)
 * Strictly no emojis.
 */

'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<'inspect' | 'audit' | 'metrics'>('inspect');

  const garden = useGardenStore(state => state.garden);
  const selectedObjectId = useGardenStore(state => state.selectedObjectId);
  const updateObject = useGardenStore(state => state.updateObject);
  const rotateObject = useGardenStore(state => state.rotateObject);
  const lockObject = useGardenStore(state => state.lockObject);
  const removeObject = useGardenStore(state => state.removeObject);
  const selectObject = useGardenStore(state => state.selectObject);

  const selectedObj = garden.objects.find(o => o.id === selectedObjectId);
  const objType = selectedObj ? (selectedObj.type || selectedObj.facilityType || 'raised_bed') : null;
  const facility = objType ? FACILITY_CATALOG.find(f => f.type === objType) : null;
  const isLocked = Boolean(selectedObj?.locked || selectedObj?.isLocked);
  const posY = selectedObj ? (selectedObj.position.y ?? selectedObj.position.z ?? 0) : 0;

  // Real-time calculation of crop yield & production metrics
  const metrics = useMemo(() => calculateGardenMetrics(garden.objects), [garden.objects]);

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
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium mb-1">
                  <Coins size={13} />
                  <span>Estimasi Nilai</span>
                </div>
                <div className="text-base font-bold font-mono text-white">
                  Rp {(metrics.totalEstimatedMonthlyRevenueIdr / 1000).toLocaleString('id-ID')}k
                  <span className="text-xs font-normal text-gray-400">/bln</span>
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

            {/* Breakdown per crop */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-[11px] font-mono uppercase text-gray-400">Rincian per Varietas</div>
              {metrics.breakdown.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">
                  Belum ada bedengan atau instalasi hidroponik di kebun.
                </div>
              ) : (
                metrics.breakdown.map(item => (
                  <div key={item.cropId} className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{item.cropName}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {item.totalAreaM2} m² ({item.plantCount} tanaman)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
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
