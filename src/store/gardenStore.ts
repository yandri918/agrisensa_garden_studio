/**
 * AgriSensa Garden Studio — Garden Store (Zustand)
 * Single source of truth for all garden state.
 * Editor 2D and 3D Preview both read from this store.
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  GardenState,
  GardenObject,
  Plot,
  Preferences,
  IrrigationState,
  OutdoorTask,
  TaskStatus,
  RotationDeg,
  Point,
} from '@/types/garden';
import { createDefaultGarden } from '@/types/garden';
import { validateLayout } from '@/lib/planner/validator';
import type { MarketPriceItem, MarketPricesResponse } from '@/types/market';

// ─── Store Shape ──────────────────────────────────────────────────────────────

interface GardenStore {
  // ── Core State ──
  garden: GardenState;
  selectedObjectId: string | null;
  viewMode: '2d' | '3d';
  isAILoading: boolean;
  aiError: string | null;

  // ── History (undo/redo) ──
  history: GardenState[];
  historyIndex: number;

  // ── Plot Actions ──
  setPlot: (updates: Partial<Plot>) => void;
  setPreferences: (updates: Partial<Preferences>) => void;
  setGardenName: (name: string) => void;

  // ── Object Actions ──
  addObject: (obj: GardenObject) => void;
  updateObject: (id: string, updates: Partial<GardenObject>) => void;
  removeObject: (id: string) => void;
  moveObject: (id: string, position: Point) => void;
  rotateObject: (id: string) => void; // cycles 0→90→180→270
  lockObject: (id: string, locked: boolean) => void;
  setObjectLabel: (id: string, label: string) => void;

  // ── Selection ──
  selectObject: (id: string | null) => void;

  // ── View ──
  setViewMode: (mode: '2d' | '3d') => void;

  // ── Validation ──
  revalidate: () => void;

  // ── Irrigation ──
  setIrrigation: (irrigation: IrrigationState) => void;

  // ── Outdoor Tasks ──
  updateTask: (id: string, updates: Partial<OutdoorTask>) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;

  // ── History ──
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // ── Persistence ──
  loadGarden: (state: GardenState) => void;
  resetGarden: () => void;

  // ── AI ──
  setAILoading: (loading: boolean) => void;
  setAIError: (error: string | null) => void;

  // ── Market Intelligence (Firecrawl) ──
  marketPrices: Record<string, MarketPriceItem>;
  marketSource: string;
  marketScrapedVia: 'firecrawl_live' | 'bapanas_benchmark_cache' | 'none';
  marketLastSync: string | null;
  isSyncingMarket: boolean;
  useLivePrices: boolean;
  marketError: string | null;
  toggleUseLivePrices: (enabled?: boolean) => void;
  fetchMarketPrices: (forceRefresh?: boolean) => Promise<void>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const ROTATION_CYCLE: RotationDeg[] = [0, 90, 180, 270];

function nextRotation(current: RotationDeg): RotationDeg {
  const idx = ROTATION_CYCLE.indexOf(current);
  return ROTATION_CYCLE[(idx + 1) % 4];
}

function updateUpdatedAt(garden: GardenState): GardenState {
  return {
    ...garden,
    provenance: { ...garden.provenance, updatedAt: new Date().toISOString() },
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGardenStore = create<GardenStore>()(
  persist(
    (set, get) => ({
      garden: createDefaultGarden(),
      selectedObjectId: null,
      viewMode: '2d',
      isAILoading: false,
      aiError: null,
      marketPrices: {},
      marketSource: 'Badan Pangan Nasional (Bapanas) & PIHPS via Firecrawl',
      marketScrapedVia: 'none',
      marketLastSync: null,
      isSyncingMarket: false,
      useLivePrices: true,
      marketError: null,
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,

      // ── Helpers ──────────────────────────────────────────────────────────

      _pushHistory(newGarden: GardenState) {
        const { history, historyIndex } = get();
        const trimmed = history.slice(0, historyIndex + 1);
        const next = [...trimmed, newGarden].slice(-50); // max 50 steps
        set({
          history: next,
          historyIndex: next.length - 1,
          canUndo: next.length > 1,
          canRedo: false,
        });
      },

      // ── Plot ─────────────────────────────────────────────────────────────

      setPlot(updates) {
        set(s => {
          const updated = updateUpdatedAt({
            ...s.garden,
            plot: { ...s.garden.plot, ...updates },
          });
          return { garden: updated };
        });
        get().revalidate();
      },

      setPreferences(updates) {
        set(s => ({
          garden: updateUpdatedAt({
            ...s.garden,
            preferences: { ...s.garden.preferences, ...updates },
          }),
        }));
      },

      setGardenName(name) {
        set(s => ({
          garden: updateUpdatedAt({ ...s.garden, name }),
        }));
      },

      // ── Objects ───────────────────────────────────────────────────────────

      addObject(obj) {
        set(s => {
          const updated = updateUpdatedAt({
            ...s.garden,
            objects: [...s.garden.objects, obj],
          });
          return { garden: updated };
        });
        get().revalidate();
      },

      updateObject(id, updates) {
        set(s => {
          const updated = updateUpdatedAt({
            ...s.garden,
            objects: s.garden.objects.map(o =>
              o.id === id ? { ...o, ...updates } : o
            ),
          });
          return { garden: updated };
        });
        get().revalidate();
      },

      removeObject(id) {
        set(s => {
          const updated = updateUpdatedAt({
            ...s.garden,
            objects: s.garden.objects.filter(o => o.id !== id),
          });
          return {
            garden: updated,
            selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId,
          };
        });
        get().revalidate();
      },

      moveObject(id, position) {
        get().updateObject(id, { position });
      },

      rotateObject(id) {
        const obj = get().garden.objects.find(o => o.id === id);
        if (!obj || obj.locked) return;
        get().updateObject(id, { rotationDeg: nextRotation(obj.rotationDeg) });
      },

      lockObject(id, locked) {
        get().updateObject(id, { locked, isLocked: locked });
      },

      setObjectLabel(id, label) {
        get().updateObject(id, { label });
      },

      // ── Selection ─────────────────────────────────────────────────────────

      selectObject(id) {
        set({ selectedObjectId: id });
      },

      // ── View ─────────────────────────────────────────────────────────────

      setViewMode(mode) {
        set({ viewMode: mode });
      },

      // ── Validation ────────────────────────────────────────────────────────

      revalidate() {
        const { garden } = get();
        const result = validateLayout(garden.objects, garden.plot);
        set(s => ({
          garden: { ...s.garden, validation: result },
        }));
      },

      // ── Irrigation ────────────────────────────────────────────────────────

      setIrrigation(irrigation) {
        set(s => ({
          garden: updateUpdatedAt({ ...s.garden, irrigation }),
        }));
      },

      // ── Outdoor Tasks ─────────────────────────────────────────────────────

      updateTask(id, updates) {
        set(s => ({
          garden: updateUpdatedAt({
            ...s.garden,
            outdoorTasks: s.garden.outdoorTasks.map(t =>
              t.id === id ? { ...t, ...updates } : t
            ),
          }),
        }));
      },

      setTaskStatus(id, status) {
        get().updateTask(id, {
          status,
          completedAt: status === 'done' ? new Date().toISOString() : undefined,
        });
      },

      // ── Undo / Redo ───────────────────────────────────────────────────────

      undo() {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;
        const newIndex = historyIndex - 1;
        set({
          garden: history[newIndex],
          historyIndex: newIndex,
          canUndo: newIndex > 0,
          canRedo: true,
        });
      },

      redo() {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;
        const newIndex = historyIndex + 1;
        set({
          garden: history[newIndex],
          historyIndex: newIndex,
          canUndo: true,
          canRedo: newIndex < history.length - 1,
        });
      },

      // ── Persistence ───────────────────────────────────────────────────────

      loadGarden(state) {
        set({
          garden: state,
          selectedObjectId: null,
          history: [state],
          historyIndex: 0,
          canUndo: false,
          canRedo: false,
        });
        get().revalidate();
      },

      resetGarden() {
        const fresh = createDefaultGarden();
        set({
          garden: fresh,
          selectedObjectId: null,
          history: [fresh],
          historyIndex: 0,
          canUndo: false,
          canRedo: false,
        });
      },

      // ── AI ────────────────────────────────────────────────────────────────

      setAILoading(loading) {
        set({ isAILoading: loading, aiError: null });
      },

      setAIError(error) {
        set({ isAILoading: false, aiError: error });
      },

      // ── Market Intelligence (Firecrawl) ───────────────────────────────────

      toggleUseLivePrices(enabled) {
        set(state => ({ useLivePrices: enabled !== undefined ? enabled : !state.useLivePrices }));
      },

      async fetchMarketPrices(forceRefresh = false) {
        set({ isSyncingMarket: true, marketError: null });
        try {
          const res = await fetch(`/api/market-prices${forceRefresh ? '?refresh=true' : ''}`);
          if (!res.ok) throw new Error('Gagal mengambil data harga pasar');
          const data: MarketPricesResponse = await res.json();
          set({
            marketPrices: data.prices || {},
            marketSource: data.source || 'Badan Pangan Nasional (Bapanas)',
            marketScrapedVia: data.scrapedVia || 'firecrawl_live',
            marketLastSync: data.timestamp || new Date().toISOString(),
            isSyncingMarket: false,
          });
        } catch (err) {
          set({
            isSyncingMarket: false,
            marketError: err instanceof Error ? err.message : 'Error syncing market data',
          });
        }
      },
    }),
    {
      name: 'agrisensa-garden-studio',
      storage: createJSONStorage(() => localStorage),
      // Only persist the garden state, not UI state like selection
      partialize: (state) => ({ garden: state.garden }),
    }
  )
);
