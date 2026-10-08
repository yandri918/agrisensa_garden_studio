/**
 * AgriSensa Garden Studio — Main Application Page
 * Spatial layout editor, 2D/3D dual viewport, validation audit, yield analytics.
 * Strictly no emojis used in UI.
 */

'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { ObjectPalette } from '@/components/sidebar/ObjectPalette';
import { RightPanel } from '@/components/sidebar/RightPanel';
import { GardenCanvas } from '@/components/canvas/GardenCanvas';
import { AIAssistantModal } from '@/components/ai/AIAssistantModal';
import { ExportModal } from '@/components/export/ExportModal';
import { PlantScannerModal } from '@/components/vision/PlantScannerModal';
import { useGardenStore } from '@/store/gardenStore';

// Client-only dynamic import for 3D Three.js scene
const Garden3DScene = dynamic(
  () => import('@/components/viewer3d/Garden3DScene').then(mod => mod.Garden3DScene),
  { ssr: false }
);

export default function Home() {
  const viewMode = useGardenStore(state => state.viewMode);
  const undo = useGardenStore(state => state.undo);
  const redo = useGardenStore(state => state.redo);
  const selectObject = useGardenStore(state => state.selectObject);
  const selectedObjectId = useGardenStore(state => state.selectedObjectId);
  const removeObject = useGardenStore(state => state.removeObject);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);

  // Keyboard shortcuts (Undo, Redo, Delete, Deselect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        selectObject(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId) {
        e.preventDefault();
        removeObject(selectedObjectId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectObject, selectedObjectId, removeObject]);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-gray-100 overflow-hidden font-sans">
      {/* 1. Header */}
      <Header
        onOpenAI={() => setIsAIModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenVision={() => setIsVisionModalOpen(true)}
      />

      {/* 2. Main Workspace (Left Palette + Center Canvas/3D + Right Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Component Catalog & Plot Settings */}
        <ObjectPalette />

        {/* Center: Viewport (2D Blueprint or 3D Scene) */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-950">
          {viewMode === '2d' ? <GardenCanvas /> : <Garden3DScene />}
        </main>

        {/* Right: Properties Inspector, Spatial Validation Audit, Crop Metrics */}
        <RightPanel onOpenVision={() => setIsVisionModalOpen(true)} />
      </div>

      {/* 3. Modals */}
      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <PlantScannerModal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        targetBedId={selectedObjectId}
      />
    </div>
  );
}
