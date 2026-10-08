/**
 * AgriSensa Garden Studio — Vegetable Catalog
 * Ported and extended from agrisensa_eco/services/crop_planning_calculator.py VEGETABLE_DB
 *
 * Data status: 'provisional' — sourced from AgriSensa internal database v1.
 * Field values are estimates for Indonesia context; verify against local agronomic sources.
 * Source accessed: 2026-10-08
 */

import type { SystemType } from '@/types/garden';

export type VegetableType = 'leaf' | 'fruit' | 'herb';
export type MarketValue = 'low' | 'medium' | 'high' | 'premium' | 'volatile';
export type PersonalValue = 'low' | 'medium' | 'high' | 'premium';
export type DataStatus = 'verified' | 'provisional';
export type LightNeeds = 'full' | 'partial' | 'shade';

export interface VegetableEntry {
  id: string;
  nameId: string;            // Bahasa Indonesia
  nameEn: string;            // English
  scientificName?: string;
  type: VegetableType;
  systemPref: SystemType[];
  harvestDays: number;
  yieldHydroGPerHole: number; // gram per lubang/tanaman
  yieldSoilKgM2: number;      // kg per m² per siklus
  marketValue: MarketValue;
  personalValue: PersonalValue;
  spacingCm: number;          // jarak tanam (center to center)
  lightNeeds: LightNeeds;
  climateNote?: string;
  companionHints?: string[];  // provisional companion planting hints
  source: string;
  dataStatus: DataStatus;
}

export const VEGETABLE_CATALOG: VegetableEntry[] = [
  // ── SAYURAN DAUN (LEAFY GREENS) ─────────────────────────────────────────────
  {
    id: 'selada',
    nameId: 'Selada',
    nameEn: 'Lettuce',
    scientificName: 'Lactuca sativa',
    type: 'leaf',
    systemPref: ['hydroponic', 'mixed'],
    harvestDays: 40,
    yieldHydroGPerHole: 150,
    yieldSoilKgM2: 1.5,
    marketValue: 'high',
    personalValue: 'medium',
    spacingCm: 20,
    lightNeeds: 'partial',
    climateNote: 'Tumbuh baik di dataran tinggi atau hidroponik dengan naungan di dataran rendah',
    source: 'AgriSensa VEGETABLE_DB v1 (internal)',
    dataStatus: 'provisional',
  },
  {
    id: 'pakcoy',
    nameId: 'Pakcoy',
    nameEn: 'Bok Choy',
    scientificName: 'Brassica rapa subsp. chinensis',
    type: 'leaf',
    systemPref: ['hydroponic', 'soil', 'mixed'],
    harvestDays: 30,
    yieldHydroGPerHole: 120,
    yieldSoilKgM2: 1.8,
    marketValue: 'medium',
    personalValue: 'high',
    spacingCm: 15,
    lightNeeds: 'partial',
    climateNote: 'Adaptif di berbagai ketinggian, cocok sayuran harian',
    source: 'AgriSensa VEGETABLE_DB v1 (internal)',
    dataStatus: 'provisional',
  },
  {
    id: 'bayam',
    nameId: 'Bayam',
    nameEn: 'Spinach',
    scientificName: 'Amaranthus spp.',
    type: 'leaf',
    systemPref: ['soil', 'hydroponic', 'mixed'],
    harvestDays: 25,
    yieldHydroGPerHole: 100,
    yieldSoilKgM2: 1.2,
    marketValue: 'medium',
    personalValue: 'high',
    spacingCm: 10,
    lightNeeds: 'full',
    climateNote: 'Tumbuh cepat, toleran panas, panen bisa bertahap',
    source: 'AgriSensa VEGETABLE_DB v1 (internal)',
    dataStatus: 'provisional',
  },
  {
    id: 'kangkung',
    nameId: 'Kangkung',
    nameEn: 'Water Spinach',
    scientificName: 'Ipomoea aquatica',
    type: 'leaf',
    systemPref: ['soil', 'hydroponic', 'mixed'],
    harvestDays: 21,
    yieldHydroGPerHole: 100,
    yieldSoilKgM2: 2.0,
    marketValue: 'low',
    personalValue: 'high',
    spacingCm: 10,
    lightNeeds: 'full',
    climateNote: 'Sangat cepat, bisa panen berkali-kali (cut-and-come-again)',
    source: 'AgriSensa VEGETABLE_DB v1 (internal)',
    dataStatus: 'provisional',
  },
  {
    id: 'kale',
    nameId: 'Kale',
    nameEn: 'Kale',
    scientificName: 'Brassica oleracea var. sabellica',
    type: 'leaf',
    systemPref: ['hydroponic', 'soil'],
    harvestDays: 50,
    yieldHydroGPerHole: 200,
    yieldSoilKgM2: 2.5,
    marketValue: 'premium',
    personalValue: 'premium',
    spacingCm: 30,
    lightNeeds: 'full',
    climateNote: 'Lebih produktif di dataran tinggi; butuh malam sejuk',
    source: 'AgriSensa VEGETABLE_DB v1 (internal)',
    dataStatus: 'provisional',
  },

  // ── SAYURAN BUAH (FRUITING VEGETABLES) ──────────────────────────────────────
  {
    id: 'cabai-rawit',
    nameId: 'Cabai Rawit',
    nameEn: 'Bird\'s Eye Chili',
    scientificName: 'Capsicum frutescens',
    type: 'fruit',
    systemPref: ['soil', 'mixed'],
    harvestDays: 90,
    yieldHydroGPerHole: 500,
    yieldSoilKgM2: 0.8,
    marketValue: 'volatile',
    personalValue: 'high',
    spacingCm: 50,
    lightNeeds: 'full',
    climateNote: 'Harga fluktuatif tinggi; butuh sinar penuh dan drainase baik',
    source: 'AgriSensa VEGETABLE_DB v1 (internal)',
    dataStatus: 'provisional',
  },
  {
    id: 'tomat-cherry',
    nameId: 'Tomat Cherry',
    nameEn: 'Cherry Tomato',
    scientificName: 'Solanum lycopersicum var. cerasiforme',
    type: 'fruit',
    systemPref: ['hydroponic', 'soil'],
    harvestDays: 70,
    yieldHydroGPerHole: 1000,
    yieldSoilKgM2: 3.0,
    marketValue: 'high',
    personalValue: 'medium',
    spacingCm: 40,
    lightNeeds: 'full',
    climateNote: 'Perlu ajir/trellis; cocok hidroponik DFT/Dutch bucket',
    source: 'AgriSensa VEGETABLE_DB v1 (internal)',
    dataStatus: 'provisional',
  },
  {
    id: 'terung',
    nameId: 'Terung',
    nameEn: 'Eggplant',
    scientificName: 'Solanum melongena',
    type: 'fruit',
    systemPref: ['soil'],
    harvestDays: 60,
    yieldHydroGPerHole: 800,
    yieldSoilKgM2: 2.5,
    marketValue: 'medium',
    personalValue: 'medium',
    spacingCm: 60,
    lightNeeds: 'full',
    climateNote: 'Adaptif dataran rendah-menengah; butuh jarak cukup',
    source: 'AgriSensa VEGETABLE_DB v1 (internal)',
    dataStatus: 'provisional',
  },
  {
    id: 'timun',
    nameId: 'Timun',
    nameEn: 'Cucumber',
    scientificName: 'Cucumis sativus',
    type: 'fruit',
    systemPref: ['soil', 'mixed'],
    harvestDays: 40,
    yieldHydroGPerHole: 1500,
    yieldSoilKgM2: 4.0,
    marketValue: 'medium',
    personalValue: 'medium',
    spacingCm: 40,
    lightNeeds: 'full',
    climateNote: 'Merambat, butuh ajir; panen cepat dan berulang',
    source: 'AgriSensa VEGETABLE_DB v1 (internal)',
    dataStatus: 'provisional',
  },
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

export function getVegetableById(id: string): VegetableEntry | undefined {
  return VEGETABLE_CATALOG.find(v => v.id === id);
}

export function getVegetablesBySystem(system: SystemType): VegetableEntry[] {
  return VEGETABLE_CATALOG.filter(v => v.systemPref.includes(system));
}

export function getVegetablesByType(type: VegetableType): VegetableEntry[] {
  return VEGETABLE_CATALOG.filter(v => v.type === type);
}
