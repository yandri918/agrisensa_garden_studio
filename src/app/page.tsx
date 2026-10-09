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
import { SeedImporterModal } from '@/components/seed/SeedImporterModal';
import { AgroCopilotDrawer } from '@/components/ai/AgroCopilotDrawer';
import { useGardenStore } from '@/store/gardenStore';
import { Bot } from 'lucide-react';

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
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

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
        onOpenSeedImporter={() => setIsSeedModalOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* 2. Main Workspace (Left Palette + Center Canvas/3D + Right Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Component Catalog & Plot Settings */}
        <ObjectPalette onOpenSeedImporter={() => setIsSeedModalOpen(true)} />

        {/* Center: Viewport (2D Blueprint or 3D Scene) */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-950">
          {viewMode === '2d' ? <GardenCanvas /> : <Garden3DScene />}

          {/* Floating Agro Co-Pilot Launcher */}
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="absolute bottom-5 right-5 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 shadow-xl backdrop-blur-md text-xs font-semibold hover:border-emerald-400 transition-all group"
            title="Tanya Agro-Knowledge Co-Pilot (Firecrawl RAG + Gemini AI)"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Bot size={13} className="group-hover:rotate-12 transition-transform" />
            </div>
            <span>Agro Co-Pilot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </main>

        {/* Right: Properties Inspector, Spatial Validation Audit, Crop Metrics */}
        <RightPanel
          onOpenVision={() => setIsVisionModalOpen(true)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />
      </div>

      {/* 3. Modals & Drawers */}
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

      <SeedImporterModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
      />

      <AgroCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
}
