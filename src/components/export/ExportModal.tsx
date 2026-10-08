/**
 * AgriSensa Garden Studio — Export & Share Modal
 * Export JSON, Import JSON, Print Specification Report.
 * No emojis used.
 */

'use client';

import React, { useState } from 'react';
import { useGardenStore } from '@/store/gardenStore';
import { calculateGardenMetrics } from '@/lib/calculator/cropCalculator';
import {
  Download,
  Upload,
  Copy,
  Check,
  Printer,
  FileJson,
  X,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const garden = useGardenStore(state => state.garden);
  const loadGarden = useGardenStore(state => state.loadGarden);

  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'report'>('export');

  if (!isOpen) return null;

  const jsonString = JSON.stringify(garden, null, 2);
  const metrics = calculateGardenMetrics(garden.objects);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${garden.name.toLowerCase().replace(/\s+/g, '_')}_blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (parsed.plot && parsed.objects) {
        loadGarden(parsed);
        onClose();
      } else {
        alert('Format JSON tidak valid untuk AgriSensa Garden Studio.');
      }
    } catch {
      alert('Gagal membaca JSON. Pastikan format teks sudah benar.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl glass-panel bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Download size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Ekspor & Dokumentasi Kebun</h3>
              <p className="text-[11px] text-gray-400">Unduh data spesifikasi, cetak laporan, atau impor blueprint</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 bg-black/30">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 ${
              activeTab === 'export' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5' : 'text-gray-400'
            }`}
          >
            <FileJson size={14} />
            <span>Ekspor JSON</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 ${
              activeTab === 'import' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5' : 'text-gray-400'
            }`}
          >
            <Upload size={14} />
            <span>Impor Blueprint</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 ${
              activeTab === 'report' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5' : 'text-gray-400'
            }`}
          >
            <Printer size={14} />
            <span>Ringkasan Cetak</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'export' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">
                  Schema Version: {garden.schemaVersion} ({garden.objects.length} objek)
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopy} className="btn-secondary text-xs py-1 px-3">
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
                  </button>
                  <button onClick={handleDownloadJson} className="btn-primary text-xs py-1 px-3">
                    <Download size={14} />
                    <span>Unduh File</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 bg-black/60 border border-white/10 rounded-lg text-[11px] font-mono text-gray-300 max-h-72 overflow-y-auto">
                {jsonString}
              </pre>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Tempelkan file JSON blueprint AgriSensa Garden Studio di bawah ini untuk memuat layout:
              </p>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder='Paste {"schemaVersion": "1.0.0", "plot": ...}'
                className="w-full h-56 p-3 bg-black/60 border border-white/10 rounded-lg text-[11px] font-mono text-gray-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="w-full btn-primary py-2.5 text-xs justify-center"
              >
                <Upload size={14} />
                <span>Muat Blueprint ke Editor</span>
              </button>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-4 text-white">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                  Laporan Perencanaan: {garden.name}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                  <div>Dimensi Lahan: {garden.plot.widthM}m × {garden.plot.depthM}m ({(garden.plot.widthM * garden.plot.depthM).toFixed(1)} m²)</div>
                  <div>Area Produksi: {metrics.totalProductionAreaM2} m²</div>
                  <div>Estimasi Panen: {metrics.totalYieldPerMonthKg} kg / bulan</div>
                  <div>Estimasi Nilai Panen: Rp {metrics.totalEstimatedMonthlyRevenueIdr.toLocaleString('id-ID')} / bulan</div>
                  <div>Kebutuhan Air: {metrics.dailyWaterRequirementLiters} Liter / hari</div>
                  <div>Kapasitas Tanam: {metrics.totalPlantCapacity} tanaman</div>
                </div>
              </div>

              <div className="text-right">
                <button onClick={handlePrint} className="btn-primary text-xs py-2 px-4">
                  <Printer size={14} />
                  <span>Cetak / Simpan PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
