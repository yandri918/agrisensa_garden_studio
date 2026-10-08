/**
 * AgriSensa Garden Studio — 3D Scene Viewer
 * React Three Fiber interactive scene with procedural meshes, realistic lighting, and camera presets.
 * No emojis used.
 */

'use client';

import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useGardenStore } from '@/store/gardenStore';
import { FACILITY_CATALOG } from '@/data/facility-catalog';
import { Camera, Sun, Compass } from 'lucide-react';
import * as THREE from 'three';
import type { GardenObject } from '@/types/garden';

// ─── Procedural 3D Mesh for each Facility Type ──────────────────────────────

function Object3DMesh({ obj, isSelected }: { obj: GardenObject; isSelected: boolean }) {
  const objType = obj.type || obj.facilityType || 'raised_bed';
  const facility = FACILITY_CATALOG.find(f => f.type === objType);
  const color = facility?.color || '#3b82f6';

  const w = obj.size.widthM;
  const d = obj.size.depthM;
  const h = obj.size.heightM || 0.4;

  const posZ = obj.position.z !== undefined ? obj.position.z : (obj.position.y ?? 0);
  const posX = obj.position.x + w / 2;
  const centerZ = posZ + d / 2;
  const rotY = -(obj.rotationDeg * Math.PI) / 180;

  return (
    <group position={[posX, 0, centerZ]} rotation={[0, rotY, 0]}>
      {/* Selection Glow Indicator */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w + 0.1, d + 0.1]} />
          <meshBasicMaterial color="#f59e0b" wireframe />
        </mesh>
      )}

      {/* 1. Raised Bed (Bedengan) */}
      {objType === 'raised_bed' && (
        <group>
          {/* Wooden border */}
          <mesh position={[0, h / 2, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#854d0e" roughness={0.8} />
          </mesh>
          {/* Soil top layer */}
          <mesh position={[0, h + 0.01, 0]}>
            <boxGeometry args={[Math.max(0.1, w - 0.1), 0.02, Math.max(0.1, d - 0.1)]} />
            <meshStandardMaterial color="#2d1e12" roughness={0.9} />
          </mesh>
          {/* Decorative Plant Stalks */}
          {Array.from({ length: Math.min(8, Math.max(2, Math.floor(w * d * 2))) }).map((_, i) => {
            const offsetX = ((i % 4) / 3 - 0.5) * (w - 0.3);
            const offsetZ = (Math.floor(i / 4) / 2 - 0.5) * (d - 0.3);
            return (
              <mesh key={i} position={[offsetX, h + 0.15, offsetZ]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshStandardMaterial color="#22c55e" roughness={0.5} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* 2. Hydroponic System */}
      {objType === 'hydroponic' && (
        <group position={[0, h / 2, 0]}>
          {/* Frame Stand */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#0284c7" metalness={0.2} roughness={0.3} />
          </mesh>
          {/* PVC Pipe channels */}
          <mesh position={[0, h / 2 + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, d, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* 3. Fish Pond */}
      {objType === 'pond' && (
        <group>
          {/* Stone Edge */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[w, 0.2, d]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
          {/* Reflective Water */}
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[Math.max(0.1, w - 0.2), Math.max(0.1, d - 0.2)]} />
            <meshStandardMaterial
              color="#0284c7"
              roughness={0.1}
              metalness={0.8}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      )}

      {/* 4. Path / Walkway */}
      {objType === 'path' && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#d4b483" roughness={0.9} />
        </mesh>
      )}

      {/* 5. Generic / Default Mesh for other facilities */}
      {objType !== 'raised_bed' &&
        objType !== 'hydroponic' &&
        objType !== 'pond' &&
        objType !== 'path' && (
          <mesh position={[0, h / 2, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        )}
    </group>
  );
}

// ─── Main 3D Canvas Scene ───────────────────────────────────────────────────

export function Garden3DScene() {
  const garden = useGardenStore(state => state.garden);
  const selectedObjectId = useGardenStore(state => state.selectedObjectId);
  const selectObject = useGardenStore(state => state.selectObject);

  const plotW = garden.plot.widthM;
  const plotD = garden.plot.depthM;

  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'walk'>('iso');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  // Switch camera angle
  const handlePresetChange = (preset: 'iso' | 'top' | 'walk') => {
    setCameraPreset(preset);
    if (!controlsRef.current) return;

    if (preset === 'iso') {
      controlsRef.current.target.set(plotW / 2, 0, plotD / 2);
      controlsRef.current.object.position.set(plotW * 1.2, plotW * 0.9, plotD * 1.5);
    } else if (preset === 'top') {
      controlsRef.current.target.set(plotW / 2, 0, plotD / 2);
      controlsRef.current.object.position.set(plotW / 2, Math.max(plotW, plotD) * 1.5, plotD / 2 + 0.01);
    } else if (preset === 'walk') {
      controlsRef.current.target.set(plotW / 2, 1.2, plotD / 2);
      controlsRef.current.object.position.set(-1, 1.6, plotD / 2);
    }
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full bg-slate-950 select-none">
      {/* 3D Viewport Toolbar */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2 glass-panel p-1.5 shadow-xl">
        <button
          onClick={() => handlePresetChange('iso')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            cameraPreset === 'iso' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Camera size={14} />
          <span>Isometrik 45°</span>
        </button>
        <button
          onClick={() => handlePresetChange('top')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            cameraPreset === 'top' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Compass size={14} />
          <span>Tampak Atas</span>
        </button>
        <button
          onClick={() => handlePresetChange('walk')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            cameraPreset === 'walk' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Sun size={14} />
          <span>Sudut Mata (1.6m)</span>
        </button>
      </div>

      {/* R3F Canvas */}
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[plotW * 1.2, plotW * 0.9, plotD * 1.5]}
          fov={45}
        />
        <OrbitControls
          ref={controlsRef}
          target={[plotW / 2, 0, plotD / 2]}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={2}
          maxDistance={50}
        />

        {/* Realistic Natural Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[plotW + 10, 20, plotD + 10]}
          intensity={1.2}
          castShadow
        />
        <hemisphereLight groundColor="#0f172a" color="#bae6fd" intensity={0.4} />

        {/* ── Ground Plane (Plot Boundary) ── */}
        <group position={[plotW / 2, 0, plotD / 2]}>
          {/* Plot Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[plotW, plotD]} />
            <meshStandardMaterial color="#14532d" roughness={0.9} />
          </mesh>

          {/* Plot Perimeter Border Curb */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(plotW, 0.05, plotD)]} />
            <lineBasicMaterial color="#10b981" linewidth={2} />
          </lineSegments>
        </group>

        {/* ── Excluded Zones ── */}
        {garden.plot.excludedZones.map((zone, idx) => {
          const zZ = zone.z !== undefined ? zone.z : (zone.y ?? 0);
          return (
            <mesh
              key={idx}
              position={[zone.x + zone.widthM / 2, 0.01, zZ + zone.depthM / 2]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[zone.widthM, zone.depthM]} />
              <meshStandardMaterial color="#ef4444" transparent opacity={0.35} />
            </mesh>
          );
        })}

        {/* ── Garden Objects ── */}
        {garden.objects.map(obj => (
          <group key={obj.id} onClick={(e) => { e.stopPropagation(); selectObject(obj.id); }}>
            <Object3DMesh
              obj={obj}
              isSelected={obj.id === selectedObjectId}
            />
          </group>
        ))}

        {/* Grid Floor around garden */}
        <gridHelper
          args={[Math.max(plotW, plotD) * 2, Math.max(plotW, plotD) * 2, '#10b981', '#1e293b']}
          position={[plotW / 2, -0.01, plotD / 2]}
        />
      </Canvas>
    </div>
  );
}
