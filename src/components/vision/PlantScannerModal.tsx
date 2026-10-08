'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGardenStore } from '@/store/gardenStore';
import { VisionDiagnosisResponse } from '@/types/garden';
import {
  Scan,
  Camera,
  Upload,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Bug,
  Droplets,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface PlantScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetBedId?: string | null;
}

// Sample SVG data URLs for instant testing without requiring external images
const SAMPLE_CHILI_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400">
    <rect width="100%" height="100%" fill="#14281d"/>
    <path d="M 120 320 C 180 200, 240 100, 360 80 C 380 180, 340 300, 200 350 Z" fill="#2d5a3c" stroke="#4ade80" stroke-width="3"/>
    <path d="M 200 350 Q 260 210 360 80" stroke="#166534" stroke-width="3" fill="none"/>
    <path d="M 230 270 Q 200 240 170 260" stroke="#166534" stroke-width="2" fill="none"/>
    <path d="M 270 210 Q 310 190 330 220" stroke="#166534" stroke-width="2" fill="none"/>
    <!-- Thrips silvering damage and curling simulation -->
    <circle cx="210" cy="180" r="14" fill="#a3e635" opacity="0.4"/>
    <circle cx="260" cy="230" r="12" fill="#a3e635" opacity="0.4"/>
    <ellipse cx="140" cy="310" rx="16" ry="8" fill="#713f12" opacity="0.6"/>
    <text x="20" y="40" fill="#a7f3d0" font-family="sans-serif" font-size="14" font-weight="bold">Sampel Daun Cabai (Gejala Keriting &amp; Hama Thrips)</text>
  </svg>
`);

const SAMPLE_TOMATO_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400">
    <rect width="100%" height="100%" fill="#182218"/>
    <path d="M 100 300 C 140 150, 230 70, 380 90 C 410 220, 310 330, 160 340 Z" fill="#2b5329" stroke="#34d399" stroke-width="3"/>
    <path d="M 160 340 Q 250 200 380 90" stroke="#14532d" stroke-width="3" fill="none"/>
    <!-- Concentric target rings (Early Blight / Alternaria) -->
    <circle cx="200" cy="160" r="28" fill="#78350f" opacity="0.8"/>
    <circle cx="200" cy="160" r="20" fill="#451a03" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="200" cy="160" r="10" fill="#1c1917"/>
    <circle cx="280" cy="275" r="22" fill="#78350f" opacity="0.8"/>
    <circle cx="280" cy="275" r="14" fill="#451a03" stroke="#f59e0b" stroke-width="2"/>
    <text x="20" y="40" fill="#fed7aa" font-family="sans-serif" font-size="14" font-weight="bold">Sampel Daun Tomat (Bercak Konsentris Early Blight)</text>
  </svg>
`);

const SAMPLE_HEALTHY_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400">
    <rect width="100%" height="100%" fill="#061c12"/>
    <path d="M 110 310 C 160 160, 240 80, 370 80 C 400 200, 330 320, 180 340 Z" fill="#15803d" stroke="#22c55e" stroke-width="4"/>
    <path d="M 180 340 Q 260 210 370 80" stroke="#166534" stroke-width="3" fill="none"/>
    <path d="M 230 260 Q 200 230 180 250" stroke="#166534" stroke-width="2" fill="none"/>
    <path d="M 280 200 Q 320 180 340 210" stroke="#166534" stroke-width="2" fill="none"/>
    <text x="20" y="40" fill="#86efac" font-family="sans-serif" font-size="14" font-weight="bold">Sampel Daun Sehat (Hijau Sempurna - Tanpa Gejala)</text>
  </svg>
`);

export function PlantScannerModal({ isOpen, onClose, targetBedId }: PlantScannerModalProps) {
  const garden = useGardenStore(state => state.garden);
  const updateObject = useGardenStore(state => state.updateObject);

  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [modelType, setModelType] = useState<'cabai_pest' | 'plant_disease'>('cabai_pest');
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(SAMPLE_CHILI_IMAGE);
  const [activePreset, setActivePreset] = useState<string>('cabai_thrips');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<VisionDiagnosisResponse | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter beds and planters
  const plantBeds = garden.objects.filter(
    o => o.type === 'raised_bed' || o.type === 'hydroponic' || o.facilityType === 'raised_bed' || o.facilityType === 'hydroponic'
  );

  // Initialize selected bed
  useEffect(() => {
    if (targetBedId) {
      setSelectedBedId(targetBedId);
    } else if (plantBeds.length > 0 && !selectedBedId) {
      setSelectedBedId(plantBeds[0].id);
    }
  }, [targetBedId, plantBeds, selectedBedId]);

  // Run initial diagnosis for default preset
  useEffect(() => {
    if (isOpen && !diagnosis) {
      handleRunDiagnosis(SAMPLE_CHILI_IMAGE, 'cabai_pest', 'cabai_thrips');
    }
  }, [isOpen]);

  // Redraw canvas with image and bounding boxes whenever diagnosis or image changes
  useEffect(() => {
    if (!canvasRef.current || !currentImageSrc) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      canvas.width = 500;
      canvas.height = 400;

      // Draw original image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw bounding boxes if predictions exist
      if (diagnosis && diagnosis.predictions.length > 0) {
        diagnosis.predictions.forEach(p => {
          const color = p.color || (p.class.toLowerCase().includes('thrip') ? '#f59e0b' : '#ef4444');

          // Box border
          ctx.lineWidth = 3;
          ctx.strokeStyle = color;
          ctx.fillStyle = `${color}25`;

          const left = p.x - p.width / 2;
          const top = p.y - p.height / 2;

          ctx.strokeRect(left, top, p.width, p.height);
          ctx.fillRect(left, top, p.width, p.height);

          // Tag background
          ctx.fillStyle = color;
          const labelText = `${p.class} ${(p.confidence * 100).toFixed(0)}%`;
          ctx.font = 'bold 11px sans-serif';
          const textWidth = ctx.measureText(labelText).width;

          ctx.fillRect(left, Math.max(0, top - 20), textWidth + 10, 20);

          // Tag text
          ctx.fillStyle = '#050505';
          ctx.fillText(labelText, left + 5, Math.max(14, top - 6));
        });
      }
    };
  }, [currentImageSrc, diagnosis]);

  const handleRunDiagnosis = async (
    imagePayload: string,
    targetModel: 'cabai_pest' | 'plant_disease',
    presetKey?: string
  ) => {
    setIsLoading(true);
    setActionSuccessMessage(null);

    try {
      const res = await fetch('/api/vision/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePayload,
          modelType: targetModel,
          samplePreset: presetKey,
        }),
      });

      if (!res.ok) throw new Error('Gagal memproses gambar');
      const data: VisionDiagnosisResponse = await res.json();
      setDiagnosis(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: 'cabai_thrips' | 'tomat_blight' | 'healthy') => {
    setActivePreset(preset);
    let src = SAMPLE_CHILI_IMAGE;
    let model: 'cabai_pest' | 'plant_disease' = 'cabai_pest';

    if (preset === 'cabai_thrips') {
      src = SAMPLE_CHILI_IMAGE;
      model = 'cabai_pest';
    } else if (preset === 'tomat_blight') {
      src = SAMPLE_TOMATO_IMAGE;
      model = 'plant_disease';
    } else if (preset === 'healthy') {
      src = SAMPLE_HEALTHY_IMAGE;
      model = 'cabai_pest';
    }

    setCurrentImageSrc(src);
    setModelType(model);
    handleRunDiagnosis(src, model, preset);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result) {
        setCurrentImageSrc(result);
        setActivePreset('custom');
        handleRunDiagnosis(result, modelType, undefined);
      }
    };
    reader.readAsDataURL(file);
  };

  // Action: Apply status tag to current bed
  const handleApplyToBed = () => {
    if (!selectedBedId || !diagnosis) return;

    const issues = diagnosis.predictions.map(p => ({
      name: p.class,
      confidence: p.confidence,
      category: (p.class.toLowerCase().includes('thrip') || p.class.toLowerCase().includes('ulat')
        ? 'pest'
        : 'disease') as 'pest' | 'disease',
    }));

    updateObject(selectedBedId, {
      healthStatus: diagnosis.healthStatus,
      pestAlert: diagnosis.healthStatus !== 'healthy' ? diagnosis.predictions[0]?.class || 'Hama/Penyakit' : undefined,
      detectedIssues: issues,
    });

    setActionSuccessMessage('Status kesehatan berhasil dicatat pada denah spasial bedengan!');
  };

  // Action: Switch irrigation to Drip for fungal protection
  const handleApplyIrrigationFix = () => {
    if (!selectedBedId || !diagnosis?.recommendations.irrigationAction) return;

    updateObject(selectedBedId, {
      irrigationType: 'drip',
      dripSpacingCm: 20,
      dripLinesCount: 2,
    });

    setActionSuccessMessage('Irigasi bedengan berhasil dialihkan ke Irigasi Tetes (Drip) untuk menekan kelembaban daun!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Scan className="text-emerald-400" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Inspeksi Kesehatan Tanaman &amp; Hama</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Roboflow Vision
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Deteksi otomatis thrips, ulat, kutu kebul, dan penyakit hawar daun berbasis Computer Vision.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): Controls & Model Choice */}
          <div className="lg:col-span-5 space-y-4">
            {/* Target Bed Selector */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-400" />
                <span>Pilih Bedengan Target di Garden Studio</span>
              </label>
              <select
                value={selectedBedId}
                onChange={e => setSelectedBedId(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {plantBeds.map(bed => (
                  <option key={bed.id} value={bed.id}>
                    {bed.label || `Bedengan ${bed.id}`} ({bed.size.widthM}m × {bed.size.depthM}m)
                  </option>
                ))}
              </select>
            </div>

            {/* Model Target Switcher */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-400" />
                <span>Model AI Vision Roboflow</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModelType('cabai_pest');
                    handleRunDiagnosis(currentImageSrc, 'cabai_pest', activePreset);
                  }}
                  className={`p-2.5 rounded-lg text-left border transition-all text-xs ${
                    modelType === 'cabai_pest'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <Bug size={13} className="text-amber-400" />
                    <span>Hama Cabai</span>
                  </div>
                  <div className="text-[10px] text-gray-400">Thrips, Ulat, Kutu Daun, Kutu Kebul</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModelType('plant_disease');
                    handleRunDiagnosis(currentImageSrc, 'plant_disease', activePreset);
                  }}
                  className={`p-2.5 rounded-lg text-left border transition-all text-xs ${
                    modelType === 'plant_disease'
                      ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <ShieldAlert size={13} className="text-rose-400" />
                    <span>PlantDoc Daun</span>
                  </div>
                  <div className="text-[10px] text-gray-400">Early Blight, Jamur, Bercak Daun</div>
                </button>
              </div>
            </div>

            {/* Presets & Image Upload */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Camera size={14} className="text-emerald-400" />
                <span>Pilih Sumber Gambar Daun</span>
              </label>

              {/* Sample Presets */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('cabai_thrips')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-medium text-left flex items-center justify-between border transition-all ${
                    activePreset === 'cabai_thrips'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Sampel 1: Cabai (Thrips &amp; Ulat)</span>
                  <span className="text-[10px] font-mono text-gray-500">Preset</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('tomat_blight')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-medium text-left flex items-center justify-between border transition-all ${
                    activePreset === 'tomat_blight'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Sampel 2: Tomat (Early Blight Jamur)</span>
                  <span className="text-[10px] font-mono text-gray-500">Preset</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('healthy')}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-medium text-left flex items-center justify-between border transition-all ${
                    activePreset === 'healthy'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Sampel 3: Kontrol Sehat (Normal)</span>
                  <span className="text-[10px] font-mono text-gray-500">Preset</span>
                </button>
              </div>

              {/* Upload Custom Image */}
              <div className="pt-2 border-t border-white/10">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload size={14} />
                  <span>Unggah Foto dari Galeri / Kamera</span>
                </button>
              </div>
            </div>

            {/* Action Feedback Banner */}
            {actionSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}
          </div>

          {/* Right Column (7 Cols): Canvas Visualizer & Diagnosis Cards */}
          <div className="lg:col-span-7 space-y-4">
            {/* Canvas Bounding Box Viewport */}
            <div className="relative rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center min-h-[300px]">
              <canvas
                ref={canvasRef}
                className="w-full h-auto max-h-[340px] object-contain block"
              />

              {isLoading && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
                  <p className="text-xs text-emerald-300 font-medium">Memindai Bounding Boxes dengan Roboflow...</p>
                </div>
              )}

              {/* Model Tag Overlay */}
              {diagnosis && (
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur border border-white/10 text-[10px] font-mono text-gray-300">
                  {diagnosis.modelUsed}
                </div>
              )}
            </div>

            {/* Diagnostic Report Panel */}
            {diagnosis && (
              <div className="space-y-3">
                {/* Status Card */}
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    diagnosis.healthStatus === 'healthy'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : diagnosis.healthStatus === 'critical'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  {diagnosis.healthStatus === 'healthy' ? (
                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                  ) : (
                    <AlertTriangle
                      className={diagnosis.healthStatus === 'critical' ? 'text-rose-400' : 'text-amber-400'}
                      size={20}
                    />
                  )}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-bold uppercase tracking-wider ${
                          diagnosis.healthStatus === 'healthy'
                            ? 'text-emerald-300'
                            : diagnosis.healthStatus === 'critical'
                            ? 'text-rose-300'
                            : 'text-amber-300'
                        }`}
                      >
                        Status: {diagnosis.healthStatus.toUpperCase()}
                      </h4>
                      <span className="text-[11px] font-mono text-gray-400">
                        {diagnosis.predictions.length} Deteksi Terpindai
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">{diagnosis.summary}</p>
                  </div>
                </div>

                {/* Recommendations Tabs / Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Organic PHT */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <h5 className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>Pengendalian Organik &amp; Hayati</span>
                    </h5>
                    <ul className="space-y-1.5 text-gray-300 text-[11px]">
                      {diagnosis.recommendations.organic.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Chemical & Mechanical */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <h5 className="font-semibold text-blue-400 flex items-center gap-1.5">
                      <Info size={14} />
                      <span>Tindakan Teknis &amp; Kimia</span>
                    </h5>
                    <ul className="space-y-1.5 text-gray-300 text-[11px]">
                      {diagnosis.recommendations.chemical.length > 0 ? (
                        diagnosis.recommendations.chemical.map((rec, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">Tidak ada intervensi kimia diperlukan.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Actionable Studio Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleApplyToBed}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Layers size={14} />
                    <span>Terapkan Status ke Denah Spasial Bedengan</span>
                  </button>

                  {diagnosis.recommendations.irrigationAction?.suggestedType === 'drip' && (
                    <button
                      type="button"
                      onClick={handleApplyIrrigationFix}
                      className="py-2 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      title="Mengubah irigasi bedengan ke irigasi tetes untuk mencegah spora jamur"
                    >
                      <Droplets size={14} />
                      <span>Ganti ke Irigasi Tetes</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
