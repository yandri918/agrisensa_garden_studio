/**
 * AgriSensa Garden Studio — 2D Interactive SVG Canvas
 * Spatial editor with pan, zoom, grid snapping, and collision highlighting.
 * No emojis used.
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGardenStore } from '@/store/gardenStore';
import { FACILITY_CATALOG } from '@/data/facility-catalog';
import { VEGETABLE_CATALOG } from '@/data/vegetable-catalog';
import {
  RotateCw,
  Trash2,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  ArrowUp,
  Droplets,
} from 'lucide-react';

export function GardenCanvas() {
  const garden = useGardenStore(state => state.garden);
  const selectedObjectId = useGardenStore(state => state.selectedObjectId);
  const selectObject = useGardenStore(state => state.selectObject);
  const moveObject = useGardenStore(state => state.moveObject);
  const rotateObject = useGardenStore(state => state.rotateObject);
  const removeObject = useGardenStore(state => state.removeObject);
  const lockObject = useGardenStore(state => state.lockObject);

  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport transforms (Pan & Zoom)
  const [scale, setScale] = useState(60); // 60 pixels per meter
  const [panOffset, setPanOffset] = useState({ x: 80, y: 80 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [showIrrigationOverlay, setShowIrrigationOverlay] = useState(true);

  // Object Dragging State
  const [dragState, setDragState] = useState<{
    id: string;
    startMouse: { x: number; y: number };
    startPos: { x: number; y: number };
  } | null>(null);

  const plot = garden.plot;
  const plotW = plot.widthM;
  const plotD = plot.depthM;
  const snapStep = plot.snapGridM || 0.25;

  // Fit to screen helper
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const margin = 100;
    const availableW = rect.width - margin;
    const availableH = rect.height - margin;
    const scaleX = availableW / plotW;
    const scaleY = availableH / plotD;
    const newScale = Math.max(25, Math.min(100, Math.min(scaleX, scaleY)));

    setScale(newScale);
    setPanOffset({
      x: (rect.width - plotW * newScale) / 2,
      y: (rect.height - plotD * newScale) / 2,
    });
  }, [plotW, plotD]);

  useEffect(() => {
    handleFitToScreen();
  }, [handleFitToScreen]);

  // Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale(prev => Math.min(150, Math.max(20, prev * zoomFactor)));
  };

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
      return;
    }

    if (dragState) {
      const deltaScreenX = e.clientX - dragState.startMouse.x;
      const deltaScreenY = e.clientY - dragState.startMouse.y;

      const deltaMetersX = deltaScreenX / scale;
      const deltaMetersY = deltaScreenY / scale;

      const rawX = dragState.startPos.x + deltaMetersX;
      const rawY = dragState.startPos.y + deltaMetersY;

      // Snap to grid
      const snappedX = Math.round(rawX / snapStep) * snapStep;
      const snappedY = Math.round(rawY / snapStep) * snapStep;

      // Clamp inside plot
      const clampedX = Math.max(0, Math.min(plotW - 0.2, snappedX));
      const clampedY = Math.max(0, Math.min(plotD - 0.2, snappedY));

      moveObject(dragState.id, { x: clampedX, y: clampedY, z: clampedY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragState(null);
  };

  // Convert meters to canvas pixels
  const m2px = (m: number) => m * scale;

  // Selected object lookup
  const selectedObj = garden.objects.find(o => o.id === selectedObjectId);
  const selectedObjPosY = selectedObj ? (selectedObj.position.y ?? selectedObj.position.z ?? 0) : 0;

  // Conflicts lookup
  const conflictIds = new Set(
    garden.validation.conflicts.flatMap(c => (c.objectId ? [c.objectId] : c.ids || []))
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden"
      style={{ backgroundColor: 'var(--canvas-bg)', cursor: isPanning ? 'grabbing' : 'default' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Viewport Canvas Controls */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 glass-panel p-1.5 shadow-xl">
        <button
          className="btn-icon"
          onClick={() => setScale(s => Math.min(150, s * 1.2))}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="btn-icon"
          onClick={() => setScale(s => Math.max(20, s * 0.8))}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <div className="h-5 w-[1px] bg-white/10" />
        <button className="btn-icon" onClick={handleFitToScreen} title="Fit to Screen">
          <Maximize2 size={16} />
        </button>
        <div className="h-5 w-[1px] bg-white/10" />
        <button
          className={`btn-icon ${showIrrigationOverlay ? 'active !text-cyan-400 !border-cyan-500/50 !bg-cyan-500/15' : ''}`}
          onClick={() => setShowIrrigationOverlay(!showIrrigationOverlay)}
          title={showIrrigationOverlay ? 'Sembunyikan Lapisan Irigasi' : 'Tampilkan Lapisan Irigasi'}
        >
          <Droplets size={16} />
        </button>
        <span className="text-[11px] text-gray-400 font-mono px-2">
          {Math.round(scale)} px/m
        </span>
      </div>

      {/* Orientation & Compass */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2 glass-panel px-3 py-2 text-xs text-gray-300 shadow-md">
        <Compass size={16} className="text-emerald-400" />
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span>UTARA</span>
          <ArrowUp size={12} className="text-emerald-400" />
        </div>
      </div>

      {/* Quick Object Floating Toolbar when selected */}
      {selectedObj && (
        <div
          className="absolute z-30 glass-panel p-1.5 flex items-center gap-1.5 shadow-2xl border border-emerald-500/30"
          style={{
            left: Math.max(20, panOffset.x + m2px(selectedObj.position.x)),
            top: Math.max(20, panOffset.y + m2px(selectedObjPosY) - 52),
          }}
        >
          <span className="text-xs font-medium text-emerald-400 px-2">
            {selectedObj.label || selectedObj.type} ({selectedObj.rotationDeg}°)
          </span>
          <button
            className="btn-icon"
            onClick={() => rotateObject(selectedObj.id)}
            title="Rotate 90°"
          >
            <RotateCw size={14} />
          </button>
          <button
            className="btn-icon"
            onClick={() => lockObject(selectedObj.id, !(selectedObj.locked ?? selectedObj.isLocked))}
            title={selectedObj.locked || selectedObj.isLocked ? 'Buka Kunci' : 'Kunci Posisi'}
          >
            {selectedObj.locked || selectedObj.isLocked ? <Lock size={14} className="text-amber-400" /> : <Unlock size={14} />}
          </button>
          <button
            className="btn-icon hover:text-red-400"
            onClick={() => removeObject(selectedObj.id)}
            title="Hapus Objek"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* SVG Canvas World */}
      <svg
        className="w-full h-full"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern
            id="garden-grid-minor"
            width={m2px(0.5)}
            height={m2px(0.5)}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${m2px(0.5)} 0 L 0 0 0 ${m2px(0.5)}`}
              fill="none"
              stroke="var(--grid-line)"
              strokeWidth="1"
            />
          </pattern>
          <pattern
            id="garden-grid-major"
            width={m2px(1.0)}
            height={m2px(1.0)}
            patternUnits="userSpaceOnUse"
          >
            <rect width={m2px(1.0)} height={m2px(1.0)} fill="url(#garden-grid-minor)" />
            <path
              d={`M ${m2px(1.0)} 0 L 0 0 0 ${m2px(1.0)}`}
              fill="none"
              stroke="var(--grid-major)"
              strokeWidth="1.2"
            />
          </pattern>

          {/* Excluded Zone Hatch Pattern */}
          <pattern
            id="excluded-hatch"
            width="12"
            height="12"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="2" />
          </pattern>

          {/* Raised Bed Soil Texture Pattern */}
          <pattern id="bed-soil" width="8" height="8" patternUnits="userSpaceOnUse">
            <line x1="0" y1="4" x2="8" y2="4" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* ── 1. Plot Area Background & Grid ── */}
        <g>
          {/* Outer Border / Ground */}
          <rect
            x={0}
            y={0}
            width={m2px(plotW)}
            height={m2px(plotD)}
            fill="var(--plot-fill)"
            stroke="var(--plot-border)"
            strokeWidth="2.5"
            rx="4"
          />

          {/* Grid lines inside plot */}
          <rect
            x={0}
            y={0}
            width={m2px(plotW)}
            height={m2px(plotD)}
            fill="url(#garden-grid-major)"
            pointerEvents="none"
          />

          {/* Plot Dimension Text Rulers */}
          <text
            x={m2px(plotW) / 2}
            y={-12}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="12"
            fontFamily="var(--font-mono)"
          >
            {plotW} m (Lebar)
          </text>
          <text
            x={-14}
            y={m2px(plotD) / 2}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="12"
            fontFamily="var(--font-mono)"
            transform={`rotate(-90, -14, ${m2px(plotD) / 2})`}
          >
            {plotD} m (Panjang)
          </text>

          {/* Entrance Marker */}
          {(plot.entrance || plot.entrancePosition) && (
            <g
              transform={`translate(${m2px(plot.entrance.x)}, ${m2px(plot.entrance.y ?? plot.entrance.z ?? 0)})`}
            >
              <circle r="8" fill="#10b981" />
              <circle r="14" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
              <text
                x="18"
                y="4"
                fill="#10b981"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fontWeight="bold"
              >
                PINTU MASUK
              </text>
            </g>
          )}

          {/* Water Source Marker */}
          {plot.waterSource && (
            <g
              transform={`translate(${m2px(plot.waterSource.position.x)}, ${m2px(plot.waterSource.position.y ?? plot.waterSource.position.z ?? 0)})`}
            >
              <circle r="8" fill="#0284c7" />
              <circle r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
              <text
                x="18"
                y="4"
                fill="#38bdf8"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fontWeight="bold"
              >
                SUMBER AIR ({plot.waterSource.type.toUpperCase()})
              </text>
            </g>
          )}

          {/* ── 2. Excluded Zones ── */}
          {plot.excludedZones.map((zone, idx) => {
            const zY = zone.y ?? zone.z ?? 0;
            return (
              <g key={idx}>
                <rect
                  x={m2px(zone.x)}
                  y={m2px(zY)}
                  width={m2px(zone.widthM)}
                  height={m2px(zone.depthM)}
                  fill="url(#excluded-hatch)"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  rx="3"
                />
                <text
                  x={m2px(zone.x + zone.widthM / 2)}
                  y={m2px(zY + zone.depthM / 2) + 4}
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  AREA TERLARANG
                </text>
              </g>
            );
          })}

          {/* ── 3. Garden Objects ── */}
          {garden.objects.map(obj => {
            const isSelected = obj.id === selectedObjectId;
            const hasConflict = conflictIds.has(obj.id);
            const objType = obj.type || obj.facilityType || 'raised_bed';
            const facility = FACILITY_CATALOG.find(f => f.type === objType);
            const crop = VEGETABLE_CATALOG.find(c => c.id === obj.plantSpeciesId);

            const w = m2px(obj.size.widthM);
            const h = m2px(obj.size.depthM);
            const cx = w / 2;
            const cy = h / 2;
            const posY = obj.position.y ?? obj.position.z ?? 0;
            const isLocked = Boolean(obj.locked || obj.isLocked);

            return (
              <g
                key={obj.id}
                transform={`translate(${m2px(obj.position.x)}, ${m2px(posY)})`}
                style={{ cursor: isLocked ? 'not-allowed' : 'move' }}
                onMouseDown={e => {
                  e.stopPropagation();
                  selectObject(obj.id);
                  if (!isLocked) {
                    setDragState({
                      id: obj.id,
                      startMouse: { x: e.clientX, y: e.clientY },
                      startPos: { x: obj.position.x, y: posY },
                    });
                  }
                }}
              >
                {/* Rotated Container */}
                <g transform={`rotate(${obj.rotationDeg}, ${cx}, ${cy})`}>
                  {/* Object Footprint */}
                  <rect
                    width={w}
                    height={h}
                    fill={facility?.color || '#3b82f6'}
                    fillOpacity={0.7}
                    stroke={
                      hasConflict
                        ? '#ef4444'
                        : isSelected
                        ? 'var(--accent-amber)'
                        : 'rgba(255, 255, 255, 0.4)'
                    }
                    strokeWidth={isSelected ? 3 : hasConflict ? 2.5 : 1.2}
                    strokeDasharray={hasConflict ? '4 2' : undefined}
                    rx="4"
                  />

                  {/* Internal Texture/Details depending on facility type */}
                  {objType === 'raised_bed' && (
                    <rect
                      x="3"
                      y="3"
                      width={Math.max(0, w - 6)}
                      height={Math.max(0, h - 6)}
                      fill="url(#bed-soil)"
                      rx="2"
                    />
                  )}

                  {objType === 'hydroponic' && (
                    <line
                      x1="0"
                      y1={cy}
                      x2={w}
                      y2={cy}
                      stroke="rgba(255, 255, 255, 0.6)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Object Label & Dimensions */}
                  <text
                    x={cx}
                    y={cy - 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={Math.max(9, Math.min(13, w / 8))}
                    fontWeight="600"
                    pointerEvents="none"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                  >
                    {obj.label || facility?.nameId}
                  </text>

                  {/* Subtitle / Assigned Crop */}
                  <text
                    x={cx}
                    y={cy + 10}
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.85)"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    pointerEvents="none"
                  >
                    {crop ? crop.nameId : `${obj.size.widthM}×${obj.size.depthM}m`}
                  </text>

                  {/* Lock Indicator */}
                  {isLocked && (
                    <circle cx={w - 10} cy={10} r="5" fill="#f59e0b" />
                  )}

                  {/* Drip Irrigation Lateral Lines & Emitters */}
                  {showIrrigationOverlay && obj.irrigationType === 'drip' && (
                    <g pointerEvents="none">
                      {Array.from({ length: obj.dripLinesCount || 2 }).map((_, lineIdx) => {
                        const lineCount = obj.dripLinesCount || 2;
                        const lineX = (w * (lineIdx + 1)) / (lineCount + 1);
                        const spacingPx = m2px((obj.dripSpacingCm || 20) / 100);
                        const emitterCount = Math.max(2, Math.floor(h / spacingPx));
                        return (
                          <g key={lineIdx}>
                            <line
                              x1={lineX}
                              y1={4}
                              x2={lineX}
                              y2={h - 4}
                              stroke="#06b6d4"
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                            />
                            {Array.from({ length: emitterCount }).map((_, emIdx) => {
                              const emY = 8 + (emIdx * (h - 16)) / Math.max(1, emitterCount - 1);
                              return (
                                <circle
                                  key={emIdx}
                                  cx={lineX}
                                  cy={emY}
                                  r="2"
                                  fill="#22d3ee"
                                />
                              );
                            })}
                          </g>
                        );
                      })}
                      <rect x="3" y="3" width="26" height="11" rx="2" fill="#083344" fillOpacity="0.85" />
                      <text x="16" y="11" textAnchor="middle" fill="#22d3ee" fontSize="7.5" fontFamily="var(--font-mono)" fontWeight="bold">DRIP</text>
                    </g>
                  )}

                  {/* Sprinkler Badge */}
                  {showIrrigationOverlay && obj.irrigationType === 'sprinkler' && (
                    <g pointerEvents="none">
                      <rect x="3" y="3" width="48" height="11" rx="2" fill="#1e3a8a" fillOpacity="0.85" />
                      <text x="27" y="11" textAnchor="middle" fill="#93c5fd" fontSize="7.5" fontFamily="var(--font-mono)" fontWeight="bold">SPRINKLER</text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}

          {/* ── 4. Irrigation Network & Sprinkler Radii Layer ── */}
          {showIrrigationOverlay && (
            <g pointerEvents="none">
              {/* Pipelines from Water Source to Irrigated Objects */}
              {garden.objects.map(obj => {
                if (obj.irrigationType !== 'drip' && obj.irrigationType !== 'sprinkler') return null;
                const ws = garden.plot.waterSource;
                const wsX = m2px(ws.position.x);
                const wsY = m2px(ws.position.y ?? ws.position.z ?? 0);
                const objX = m2px(obj.position.x + obj.size.widthM / 2);
                const objY = m2px((obj.position.y ?? obj.position.z ?? 0) + obj.size.depthM / 2);

                return (
                  <g key={`pipe_${obj.id}`}>
                    <line
                      x1={wsX}
                      y1={wsY}
                      x2={objX}
                      y2={objY}
                      stroke="rgba(14, 165, 233, 0.45)"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <circle cx={objX} cy={objY} r="3" fill="#0284c7" />
                  </g>
                );
              })}

              {/* Sprinkler Coverage Circles */}
              {garden.objects.map(obj => {
                if (obj.irrigationType !== 'sprinkler') return null;
                const radiusM = obj.sprinklerRadiusM || 2.0;
                const rPx = m2px(radiusM);
                const cx = m2px(obj.position.x + obj.size.widthM / 2);
                const cy = m2px((obj.position.y ?? obj.position.z ?? 0) + obj.size.depthM / 2);

                return (
                  <g key={`sprinkler_circle_${obj.id}`}>
                    {/* Spray Coverage Area */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={rPx}
                      fill="rgba(59, 130, 246, 0.12)"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="6 3"
                    />
                    {/* Inner Spray Ripple */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={rPx * 0.55}
                      fill="none"
                      stroke="rgba(59, 130, 246, 0.25)"
                      strokeWidth="1"
                      strokeDasharray="2 3"
                    />
                    {/* Nozzle center */}
                    <circle cx={cx} cy={cy} r="6" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx={cx} cy={cy} r="2" fill="#93c5fd" />
                    <text
                      x={cx}
                      y={cy - rPx + 14}
                      textAnchor="middle"
                      fill="#60a5fa"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fontWeight="600"
                    >
                      SPRINKLER (r={radiusM.toFixed(1)}m)
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </svg>

    </div>
  );
}
