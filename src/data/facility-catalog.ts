/**
 * AgriSensa Garden Studio — Facility Catalog
 * Defines all placeable components: beds, hydroponic systems, ponds, coops, paths, etc.
 * Uses strict Lucide icon identifiers — ZERO emojis in UI.
 */

import type { FacilityType } from '@/types/garden';

export type FacilityCategory =
  | 'production'
  | 'infrastructure'
  | 'aesthetic'
  | 'livestock'
  | 'water';

export type ObjectLayer = 'physical' | 'utility' | 'plant';

export interface FacilityEntry {
  type: FacilityType;
  nameId: string;
  nameEn: string;
  iconName: string;       // Lucide icon name (clean SVG, no emoji)
  category: FacilityCategory;
  layer: ObjectLayer;
  color: string;          // hex, used in 2D canvas + 3D mesh
  defaultSize: { widthM: number; depthM: number; heightM: number };
  minSize: { widthM: number; depthM: number };
  maxSize: { widthM: number; depthM: number };
  requiresAccess: boolean;  // must be reachable from entrance
  notes: string;
}

export const FACILITY_CATALOG: FacilityEntry[] = [
  {
    type: 'raised_bed',
    nameId: 'Bedengan',
    nameEn: 'Raised Bed',
    iconName: 'Sprout',
    category: 'production',
    layer: 'physical',
    color: '#4ade80',
    defaultSize: { widthM: 1.0, depthM: 2.0, heightM: 0.3 },
    minSize: { widthM: 0.5, depthM: 0.5 },
    maxSize: { widthM: 3.0, depthM: 6.0 },
    requiresAccess: true,
    notes: 'Lebar ideal ≤1.2m agar mudah dijangkau dari sisi tanpa masuk bedengan.',
  },
  {
    type: 'hydroponic',
    nameId: 'Sistem Hidroponik',
    nameEn: 'Hydroponic System',
    iconName: 'Droplets',
    category: 'production',
    layer: 'physical',
    color: '#38bdf8',
    defaultSize: { widthM: 0.5, depthM: 3.0, heightM: 1.0 },
    minSize: { widthM: 0.3, depthM: 1.0 },
    maxSize: { widthM: 2.0, depthM: 10.0 },
    requiresAccess: true,
    notes: 'NFT/DFT/rakit apung. Nutrisi circuit terpisah dari irigasi tanah.',
  },
  {
    type: 'pond',
    nameId: 'Kolam Ikan',
    nameEn: 'Fish Pond',
    iconName: 'Waves',
    category: 'water',
    layer: 'physical',
    color: '#1d4ed8',
    defaultSize: { widthM: 1.5, depthM: 2.0, heightM: 0.6 },
    minSize: { widthM: 1.0, depthM: 1.0 },
    maxSize: { widthM: 5.0, depthM: 8.0 },
    requiresAccess: true,
    notes: 'Titik pengisian terpisah. Tidak mengasumsikan integrasi aquaponik.',
  },
  {
    type: 'chicken_coop',
    nameId: 'Kandang Ternak',
    nameEn: 'Animal Coop',
    iconName: 'Home',
    category: 'livestock',
    layer: 'physical',
    color: '#fbbf24',
    defaultSize: { widthM: 1.5, depthM: 2.0, heightM: 1.5 },
    minSize: { widthM: 1.0, depthM: 1.0 },
    maxSize: { widthM: 4.0, depthM: 6.0 },
    requiresAccess: true,
    notes: 'Pisahkan dari tanaman pangan. Sprinkler tidak mengarah ke kandang.',
  },
  {
    type: 'path',
    nameId: 'Jalur Akses',
    nameEn: 'Maintenance Path',
    iconName: 'Footprints',
    category: 'infrastructure',
    layer: 'physical',
    color: '#d4b483',
    defaultSize: { widthM: 0.6, depthM: 2.0, heightM: 0.0 },
    minSize: { widthM: 0.5, depthM: 0.5 },
    maxSize: { widthM: 2.0, depthM: 20.0 },
    requiresAccess: false,
    notes: 'Lebar min 0.6m untuk orang dewasa. Harus tersambung ke pintu masuk.',
  },
  {
    type: 'water_source',
    nameId: 'Titik Air',
    nameEn: 'Water Source',
    iconName: 'Pipette',
    category: 'infrastructure',
    layer: 'physical',
    color: '#6366f1',
    defaultSize: { widthM: 0.3, depthM: 0.3, heightM: 1.0 },
    minSize: { widthM: 0.2, depthM: 0.2 },
    maxSize: { widthM: 1.0, depthM: 1.0 },
    requiresAccess: false,
    notes: 'Keran, tandon, atau pompa. Posisi mempengaruhi routing pipa irigasi.',
  },
  {
    type: 'compost',
    nameId: 'Area Kompos',
    nameEn: 'Compost Area',
    iconName: 'Recycle',
    category: 'infrastructure',
    layer: 'physical',
    color: '#a3a3a3',
    defaultSize: { widthM: 1.0, depthM: 1.0, heightM: 0.8 },
    minSize: { widthM: 0.5, depthM: 0.5 },
    maxSize: { widthM: 3.0, depthM: 3.0 },
    requiresAccess: true,
    notes: 'Tempatkan dekat sumber sampah organik dan jauh dari area makan/duduk.',
  },
  {
    type: 'decorative',
    nameId: 'Elemen Estetika',
    nameEn: 'Decorative Element',
    iconName: 'Sparkles',
    category: 'aesthetic',
    layer: 'physical',
    color: '#f9a8d4',
    defaultSize: { widthM: 0.5, depthM: 0.5, heightM: 0.5 },
    minSize: { widthM: 0.2, depthM: 0.2 },
    maxSize: { widthM: 3.0, depthM: 3.0 },
    requiresAccess: false,
    notes: 'Pot tanaman, batu hias, tempat duduk, dll.',
  },
  {
    type: 'fixed_object',
    nameId: 'Objek Tetap',
    nameEn: 'Fixed Object',
    iconName: 'TreePine',
    category: 'infrastructure',
    layer: 'physical',
    color: '#78716c',
    defaultSize: { widthM: 1.0, depthM: 1.0, heightM: 3.0 },
    minSize: { widthM: 0.3, depthM: 0.3 },
    maxSize: { widthM: 10.0, depthM: 10.0 },
    requiresAccess: false,
    notes: 'Pohon eksisting, tiang, atau bangunan yang tidak bisa dipindah.',
  },
  {
    type: 'iot_sensor',
    nameId: 'Sensor Probe IoT',
    nameEn: 'IoT Soil Probe',
    iconName: 'Radio',
    category: 'infrastructure',
    layer: 'utility',
    color: '#06b6d4',
    defaultSize: { widthM: 0.3, depthM: 0.3, heightM: 0.6 },
    minSize: { widthM: 0.2, depthM: 0.2 },
    maxSize: { widthM: 0.5, depthM: 0.5 },
    requiresAccess: false,
    notes: 'Probe telemetri tanah cerdas: memantau kelembaban (%), EC nutrisi, dan suhu akar.',
  },
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

export function getFacilityByType(type: FacilityType): FacilityEntry | undefined {
  return FACILITY_CATALOG.find(f => f.type === type);
}

export function getFacilitiesByCategory(cat: FacilityCategory): FacilityEntry[] {
  return FACILITY_CATALOG.filter(f => f.category === cat);
}
