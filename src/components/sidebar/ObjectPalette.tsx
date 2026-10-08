/**
 * AgriSensa Garden Studio — Object Palette & Comprehensive Plot Settings
 * Left sidebar for adding components, editing garden parameters, managing excluded zones, and choosing presets.
 * No emojis used.
 */

'use client';

import React, { useState } from 'react';
import { useGardenStore } from '@/store/gardenStore';
import { FACILITY_CATALOG, type FacilityEntry } from '@/data/facility-catalog';
import { VEGETABLE_CATALOG } from '@/data/vegetable-catalog';
import { IconRenderer } from '@/components/common/IconRenderer';
import {
  Plus,
  Sliders,
  Sprout,
  LayoutTemplate,
  Layers,
  Trash2,
  DoorOpen,
  Ban,
  Clock,
  Users,
  Droplets,
} from 'lucide-react';
import type { GardenObject, Rect } from '@/types/garden';

export function ObjectPalette() {
  const [tab, setTab] = useState<'facilities' | 'crops' | 'plot'>('facilities');
  const garden = useGardenStore(state => state.garden);
  const addObject = useGardenStore(state => state.addObject);
  const updateObject = useGardenStore(state => state.updateObject);
  const setPlot = useGardenStore(state => state.setPlot);
  const setGardenName = useGardenStore(state => state.setGardenName);
  const setPreferences = useGardenStore(state => state.setPreferences);

  const plotW = garden.plot.widthM;
  const plotD = garden.plot.depthM;
  const entrance = garden.plot.entrance;
  const entranceY = entrance.y ?? entrance.z ?? 0;

  // Add facility to garden
  const handleAddFacility = (facility: FacilityEntry) => {
    const currentCount = garden.objects.length;
    const spawnX = Math.min(plotW - facility.defaultSize.widthM, 1.0 + (currentCount % 4) * 1.5);
    const spawnY = Math.min(plotD - facility.defaultSize.depthM, 1.0 + Math.floor(currentCount / 4) * 2.5);

    const newObj: GardenObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      label: `${facility.nameId} #${currentCount + 1}`,
      type: facility.type,
      facilityType: facility.type,
      position: { x: Math.max(0.2, spawnX), y: Math.max(0.2, spawnY), z: Math.max(0.2, spawnY) },
      size: { ...facility.defaultSize },
      rotationDeg: 0,
      locked: false,
      isLocked: false,
      required: false,
      cropAssignments: [],
      plantSpeciesId: facility.type === 'raised_bed' || facility.type === 'hydroponic' ? 'pakcoy' : undefined,
    };

    addObject(newObj);
  };

  // Preset layouts
  const applyPreset = (preset: 'backyard' | 'commercial' | 'rooftop') => {
    if (preset === 'backyard') {
      setPlot({
        widthM: 8,
        depthM: 6,
        excludedZones: [{ id: 'ex_1', x: 6, y: 0, z: 0, widthM: 2, depthM: 2, reason: 'Area Tangga & Pompa' }],
        entrance: { x: 0, y: 3, z: 3 },
      });
    } else if (preset === 'commercial') {
      setPlot({
        widthM: 15,
        depthM: 10,
        excludedZones: [{ id: 'ex_2', x: 13, y: 0, z: 0, widthM: 2, depthM: 3, reason: 'Gudang Alat' }],
        entrance: { x: 0, y: 5, z: 5 },
      });
    } else if (preset === 'rooftop') {
      setPlot({
        widthM: 5,
        depthM: 3,
        excludedZones: [],
        entrance: { x: 0, y: 1.5, z: 1.5 },
      });
    }
  };

  // Add Excluded Zone
  const handleAddExcludedZone = () => {
    const newZone: Rect = {
      id: `zone_${Date.now()}`,
      x: Math.max(0, plotW - 2),
      y: 0,
      z: 0,
      widthM: 1.5,
      depthM: 1.5,
      reason: 'Zona Utilitas / Tangki',
    };
    setPlot({
      excludedZones: [...garden.plot.excludedZones, newZone],
    });
  };

  const handleRemoveExcludedZone = (idx: number) => {
    const updated = garden.plot.excludedZones.filter((_, i) => i !== idx);
    setPlot({ excludedZones: updated });
  };

  const handleUpdateExcludedZone = (idx: number, updates: Partial<Rect>) => {
    const updated = garden.plot.excludedZones.map((z, i) => (i === idx ? { ...z, ...updates } : z));
    setPlot({ excludedZones: updated });
  };

  return (
    <aside className="w-80 h-full glass-panel flex flex-col border-r border-white/10 select-none overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-white/10 bg-black/30">
        <button
          onClick={() => setTab('facilities')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            tab === 'facilities'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>Fasilitas</span>
        </button>
        <button
          onClick={() => setTab('crops')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            tab === 'crops'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sprout size={14} />
          <span>Tanaman</span>
        </button>
        <button
          onClick={() => setTab('plot')}
          className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            tab === 'plot'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sliders size={14} />
          <span>Lahan & Data</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── TAB 1: Facilities ── */}
        {tab === 'facilities' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
              Komponen Kebun
            </div>
            <div className="grid grid-cols-1 gap-2">
              {FACILITY_CATALOG.map(facility => (
                <div
                  key={facility.type}
                  onClick={() => handleAddFacility(facility)}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center text-slate-950 font-bold shadow-sm"
                      style={{ backgroundColor: facility.color }}
                    >
                      <IconRenderer name={facility.iconName} size={18} color="#0f172a" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-white group-hover:text-emerald-300 transition-colors">
                        {facility.nameId}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        {facility.defaultSize.widthM}m × {facility.defaultSize.depthM}m (T: {facility.defaultSize.heightM}m)
                      </p>
                    </div>
                  </div>
                  <button className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: Crops ── */}
        {tab === 'crops' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
              Database Tanaman AgriSensa
            </div>
            <div className="space-y-2">
              {VEGETABLE_CATALOG.map(crop => (
                <div
                  key={crop.id}
                  className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      {crop.nameId}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono">
                      {crop.harvestDays} hari panen
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 italic">
                    {crop.scientificName}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-300 pt-1 border-t border-white/5">
                    <div>Hasil Tanah: {crop.yieldSoilKgM2} kg/m²</div>
                    <div>Nilai Pasar: <span className="uppercase text-emerald-400">{crop.marketValue}</span></div>
                    <div>Jarak Tanam: {crop.spacingCm} cm</div>
                    <div>Sinar: {crop.lightNeeds}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: Plot Dimensions, Excluded Zones, and Preferences ── */}
        {tab === 'plot' && (
          <div className="space-y-5">
            {/* Garden Project Name */}
            <div>
              <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider block mb-1">
                Nama Proyek Kebun
              </label>
              <input
                type="text"
                value={garden.name}
                onChange={e => setGardenName(e.target.value)}
                placeholder="Nama kebun..."
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Plot Dimensions */}
            <div>
              <div className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
                Dimensi Lahan (Meter)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Lebar (m)</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    step="0.5"
                    value={plotW}
                    onChange={e => {
                      const w = parseFloat(e.target.value) || 2;
                      setPlot({ widthM: w });
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Panjang (m)</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    step="0.5"
                    value={plotD}
                    onChange={e => {
                      const d = parseFloat(e.target.value) || 2;
                      setPlot({ depthM: d });
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="mt-2 text-right text-xs text-emerald-400 font-mono">
                Total Luas: {(plotW * plotD).toFixed(1)} m²
              </div>
            </div>

            {/* Entrance Position */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                <DoorOpen size={13} className="text-emerald-400" />
                <span>Posisi Pintu Masuk (Meter)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">X (Meter)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={entrance.x}
                    onChange={e =>
                      setPlot({
                        entrance: { ...entrance, x: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Y (Meter)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={entranceY}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setPlot({
                        entrance: { ...entrance, y: val, z: val },
                      });
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Water Source & Irrigation Grid */}
            <div className="pt-2 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                  <Droplets size={13} className="text-cyan-400" />
                  <span>Sumber Air & Jaringan Irigasi</span>
                </div>
              </div>

              {/* Water Source Type & Pressure */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Tipe Suplai</label>
                  <select
                    value={garden.plot.waterSource.type}
                    onChange={e =>
                      setPlot({
                        waterSource: {
                          ...garden.plot.waterSource,
                          type: e.target.value as 'tap' | 'tank' | 'pump',
                        },
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="tap">Keran PDAM/Sumur</option>
                    <option value="tank">Tandon Gravitasi (Toren)</option>
                    <option value="pump">Pompa Otomatis</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Tekanan Kerja (Bar)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="5.0"
                    value={garden.plot.waterSource.pressureBar || 1.5}
                    onChange={e =>
                      setPlot({
                        waterSource: {
                          ...garden.plot.waterSource,
                          pressureBar: parseFloat(e.target.value) || 1.5,
                        },
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Quick Batch Setup */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-gray-400">Pemasangan Otomatis Semua Bedengan:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      garden.objects.forEach(obj => {
                        if (obj.type === 'raised_bed' || obj.facilityType === 'raised_bed') {
                          updateObject(obj.id, {
                            irrigationType: 'drip',
                            dripSpacingCm: 20,
                            dripLinesCount: 2,
                          });
                        }
                      });
                    }}
                    className="py-1 px-1.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[10px] text-cyan-300 font-medium transition-colors text-center"
                  >
                    Pasang Tetes (Drip)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      garden.objects.forEach(obj => {
                        if (obj.type === 'raised_bed' || obj.facilityType === 'raised_bed') {
                          updateObject(obj.id, {
                            irrigationType: 'sprinkler',
                            sprinklerRadiusM: 2.0,
                          });
                        }
                      });
                    }}
                    className="py-1 px-1.5 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-[10px] text-blue-300 font-medium transition-colors text-center"
                  >
                    Pasang Sprinkler
                  </button>
                </div>
              </div>
            </div>

            {/* Excluded Zones Manager */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                  <Ban size={13} className="text-rose-400" />
                  <span>Zona Terlarang ({garden.plot.excludedZones.length})</span>
                </div>
                <button
                  onClick={handleAddExcludedZone}
                  className="px-2 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-semibold flex items-center gap-1 hover:bg-rose-500/25"
                >
                  <Plus size={11} />
                  <span>Tambah Zona</span>
                </button>
              </div>

              {garden.plot.excludedZones.map((zone, idx) => {
                const zY = zone.y ?? zone.z ?? 0;
                return (
                  <div key={zone.id || idx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={zone.reason || `Zona #${idx + 1}`}
                        onChange={e => handleUpdateExcludedZone(idx, { reason: e.target.value })}
                        className="bg-transparent text-xs text-white font-medium border-b border-transparent focus:border-emerald-500 focus:outline-none w-44"
                      />
                      <button
                        onClick={() => handleRemoveExcludedZone(idx)}
                        className="text-gray-400 hover:text-rose-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-gray-400">
                      <div>
                        <span>X:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={zone.x}
                          onChange={e => handleUpdateExcludedZone(idx, { x: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-black/40 border border-white/10 rounded px-1 py-0.5 text-white"
                        />
                      </div>
                      <div>
                        <span>Y:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={zY}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            handleUpdateExcludedZone(idx, { y: val, z: val });
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded px-1 py-0.5 text-white"
                        />
                      </div>
                      <div>
                        <span>W:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={zone.widthM}
                          onChange={e => handleUpdateExcludedZone(idx, { widthM: parseFloat(e.target.value) || 0.5 })}
                          className="w-full bg-black/40 border border-white/10 rounded px-1 py-0.5 text-white"
                        />
                      </div>
                      <div>
                        <span>D:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={zone.depthM}
                          onChange={e => handleUpdateExcludedZone(idx, { depthM: parseFloat(e.target.value) || 0.5 })}
                          className="w-full bg-black/40 border border-white/10 rounded px-1 py-0.5 text-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Farm Preferences */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <div className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                Preferensi Budidaya
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
                    <Users size={12} />
                    <span>Anggota Keluarga</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={garden.preferences.householdSize}
                    onChange={e => setPreferences({ householdSize: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
                    <Clock size={12} />
                    <span>Rawat (Menit/Hari)</span>
                  </div>
                  <input
                    type="number"
                    min="5"
                    max="240"
                    step="5"
                    value={garden.preferences.maintenanceMinutesPerDay}
                    onChange={e => setPreferences({ maintenanceMinutesPerDay: parseInt(e.target.value) || 10 })}
                    className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                Preset Lahan Cepat
              </div>
              <button
                onClick={() => applyPreset('backyard')}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-medium text-white">Pekarangan Rumah (Backyard)</div>
                  <div className="text-[10px] text-gray-400">8.0m × 6.0m (48 m²)</div>
                </div>
                <LayoutTemplate size={16} className="text-emerald-400" />
              </button>
              <button
                onClick={() => applyPreset('commercial')}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-medium text-white">Komersial Mini (Agri-Production)</div>
                  <div className="text-[10px] text-gray-400">15.0m × 10.0m (150 m²)</div>
                </div>
                <LayoutTemplate size={16} className="text-emerald-400" />
              </button>
              <button
                onClick={() => applyPreset('rooftop')}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-medium text-white">Rooftop / Balkon</div>
                  <div className="text-[10px] text-gray-400">5.0m × 3.0m (15 m²)</div>
                </div>
                <LayoutTemplate size={16} className="text-emerald-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
