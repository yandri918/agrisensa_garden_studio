/**
 * AgriSensa Garden Studio — Core Garden Types
 * All spatial units: meters (m), areas: m²
 */

// ─── Primitives ──────────────────────────────────────────────────────────────

export interface Point {
  x: number; // horizontal axis on plot ground plane
  y?: number; // 2D canvas vertical axis (alias for z)
  z?: number; // depth axis on plot ground plane (in 3D, Y is up, Z is depth)
}

export interface Rect {
  id?: string;
  x: number; // top-left x
  y?: number; // top-left y (alias for z)
  z?: number; // top-left z
  widthM: number;
  depthM: number;
  reason?: string;
}

export type RotationDeg = 0 | 90 | 180 | 270;

export type SystemType = 'hydroponic' | 'soil' | 'mixed';
export type GoalType = 'personal' | 'market';
export type SunlightType = 'full' | 'partial' | 'shade' | 'unknown';
export type WaterSourceType = 'tap' | 'tank' | 'pump';

// ─── Facility Types ───────────────────────────────────────────────────────────

export type FacilityType =
  | 'raised_bed'
  | 'hydroponic'
  | 'pond'
  | 'chicken_coop'
  | 'path'
  | 'water_source'
  | 'compost'
  | 'decorative'
  | 'fixed_object' // trees, existing structures
  | 'iot_sensor';  // soil moisture, EC, temp telemetry probe

// ─── Crop Assignment ──────────────────────────────────────────────────────────

export interface CropAssignment {
  cropId: string;       // references VegetableEntry.id
  allocationPct: number; // 0-100, sum per bed = 100
  plantCount: number;
  yieldEstKg: number;
}

// ─── Garden Object ────────────────────────────────────────────────────────────

export interface GardenObject {
  id: string;
  type: FacilityType;
  facilityType?: FacilityType; // alias for type
  label?: string;
  position: Point;      // position on plot ground plane
  size: {
    widthM: number;
    depthM: number;
    heightM: number;
  };
  rotationDeg: RotationDeg;
  locked?: boolean;
  isLocked?: boolean;    // alias for locked
  required?: boolean;
  cropAssignments?: CropAssignment[];
  plantSpeciesId?: string; // primary assigned crop
  irrigationZoneId?: string;
  irrigationType?: IrrigationType; // 'drip' | 'sprinkler' | 'manual' | 'unspecified'
  sprinklerRadiusM?: number;       // radius in meters for sprinkler (e.g. 1.0 - 4.0m)
  dripSpacingCm?: number;          // distance between emitters in cm (15, 20, 30cm)
  dripLinesCount?: number;         // number of drip lateral pipes (1, 2, 3)
  irrigationRateLph?: number;      // estimated emitter flow in L/h
  // Plant Health & Computer Vision Digital Twin
  healthStatus?: 'healthy' | 'warning' | 'critical';
  pestAlert?: string;
  detectedIssues?: Array<{
    name: string;
    confidence: number;
    category: 'pest' | 'disease';
    recommendation?: string;
  }>;
  notes?: string;
}

// ─── Computer Vision & Diagnostic Types ─────────────────────────────────────

export interface VisionPrediction {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface VisionDiagnosisResponse {
  modelUsed: string;
  projectName: string;
  predictions: VisionPrediction[];
  healthStatus: 'healthy' | 'warning' | 'critical';
  summary: string;
  recommendations: {
    organic: string[];
    chemical: string[];
    irrigationAction?: {
      advice: string;
      suggestedType: 'drip' | 'sprinkler' | 'manual';
    };
    spacingAction?: string;
  };
}

// ─── Weather & Precision Agronomy Types ─────────────────────────────────────

export interface WeatherResponse {
  city: string;
  latitude: number;
  longitude: number;
  elevation: number;
  current: {
    temperatureC: number;
    relativeHumidityPct: number;
    precipitationMm: number;
    rainMm: number;
    weatherCode: number;
    weatherDescription: string;
    windSpeedKmh: number;
  };
  daily: {
    et0EvapotranspirationMm: number;
    precipitationProbabilityMaxPct: number;
    precipitationSumMm: number;
    tempMaxC: number;
    tempMinC: number;
  };
  smartAdvisory: {
    rainDelay: boolean;
    irrigationMultiplier: number;
    irrigationAdvice: string;
    diseaseRiskLevel: 'low' | 'moderate' | 'high';
    diseaseAdvice: string;
  };
  cachedAt?: string;
}

// ─── Plot ─────────────────────────────────────────────────────────────────────

export interface PlotDimensions {
  widthM: number;
  depthM: number;
  areaM2: number;
}

export interface Plot {
  widthM: number;
  depthM: number;
  dimensions?: PlotDimensions; // optional helper
  northRotationDeg: number; // 0 = top of canvas is north
  entrance: Point;
  entrancePosition?: Point;   // alias for entrance
  waterSource: {
    position: Point;
    type: WaterSourceType;
    flowLpm: number | null;     // null = unknown
    pressureBar: number | null; // null = unknown
  };
  excludedZones: Rect[];
  sunlight: SunlightType;
  drainage: 'good' | 'poor' | 'unknown';
  snapGridM?: number;
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export interface Preferences {
  mode: 'productive' | 'balanced' | 'aesthetic';
  goal: GoalType;
  system: SystemType;
  systemType?: SystemType; // alias
  householdSize: number;
  maintenanceMinutesPerDay: number;
  pathWidthM: number; // default 0.6
}

// ─── Irrigation ───────────────────────────────────────────────────────────────

export type IrrigationType = 'drip' | 'sprinkler' | 'manual' | 'unspecified';

export interface IrrigationZone {
  id: string;
  name: string;
  type: IrrigationType;
  objectIds: string[]; // which garden objects belong to this zone
  radius?: number;     // sprinkler radius in meters (illustrative if no spec)
}

export interface IrrigationPipe {
  id: string;
  points: Point[]; // polyline path
  zoneId: string;
  layer: 'main' | 'branch';
}

export interface IrrigationState {
  zones: IrrigationZone[];
  pipes: IrrigationPipe[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type ConflictType =
  | 'OUT_OF_BOUNDS'
  | 'IN_EXCLUDED_ZONE'
  | 'OVERLAP'
  | 'ACCESS_BLOCKED'
  | 'SPRINKLER_ON_COOP'
  | 'REQUIRED_MISSING'
  | 'overlap'
  | 'out_of_bounds'
  | 'access_blocked';

export interface Conflict {
  id?: string;
  type: ConflictType;
  ids?: string[];        // affected object IDs
  objectId?: string;     // alias for primary affected ID
  message: string;
}

export interface ValidationResult {
  status: 'valid' | 'has_conflicts' | 'infeasible' | 'not_checked';
  isValid?: boolean;     // helper alias
  conflicts: Conflict[];
  assumptions: string[];
  checkedAt?: string;    // ISO timestamp
}

// ─── Outdoor Tasks ────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'doing' | 'done' | 'skipped';

export interface OutdoorTask {
  id: string;
  description: string;
  status: TaskStatus;
  notes?: string;
  completedAt?: string;
}

// ─── Provenance ───────────────────────────────────────────────────────────────

export interface Provenance {
  generatedBy: 'manual' | 'ai';
  modelId: string | null;
  catalogVersion: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Area Breakdown ───────────────────────────────────────────────────────────

export interface AreaBreakdown {
  plotTotal: number;
  excluded: number;
  facilities: number;
  paths: number;
  remaining: number; // not necessarily plantable
}

// ─── Top-level Garden State ───────────────────────────────────────────────────

export interface GardenState {
  schemaVersion: '1.0';
  id: string;
  name: string;
  units: 'm';
  plot: Plot;
  preferences: Preferences;
  objects: GardenObject[];
  irrigation: IrrigationState;
  validation: ValidationResult;
  provenance: Provenance;
  outdoorTasks: OutdoorTask[];
}

// ─── Default Factory ──────────────────────────────────────────────────────────

export function createDefaultGarden(overrides?: Partial<GardenState>): GardenState {
  const now = new Date().toISOString();
  const widthM = 8;
  const depthM = 6;

  return {
    schemaVersion: '1.0',
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `garden_${Date.now()}`,
    name: 'Kebun Pekarangan Mandiri',
    units: 'm',
    plot: {
      widthM,
      depthM,
      dimensions: { widthM, depthM, areaM2: widthM * depthM },
      northRotationDeg: 0,
      entrance: { x: 0, y: depthM / 2, z: depthM / 2 },
      entrancePosition: { x: 0, y: depthM / 2, z: depthM / 2 },
      waterSource: { position: { x: 0.5, y: 0.5, z: 0.5 }, type: 'tap', flowLpm: null, pressureBar: null },
      excludedZones: [],
      sunlight: 'full',
      drainage: 'good',
      snapGridM: 0.25,
    },
    preferences: {
      mode: 'balanced',
      goal: 'personal',
      system: 'mixed',
      systemType: 'mixed',
      householdSize: 4,
      maintenanceMinutesPerDay: 20,
      pathWidthM: 0.6,
    },
    objects: [
      {
        id: 'obj_default_bed_1',
        type: 'raised_bed',
        facilityType: 'raised_bed',
        label: 'Bedengan Selada',
        position: { x: 2.0, y: 1.0, z: 1.0 },
        size: { widthM: 1.0, depthM: 2.5, heightM: 0.35 },
        rotationDeg: 0,
        locked: false,
        isLocked: false,
        required: true,
        plantSpeciesId: 'selada',
        irrigationType: 'drip',
        dripSpacingCm: 20,
        dripLinesCount: 2,
      },
      {
        id: 'obj_default_bed_2',
        type: 'raised_bed',
        facilityType: 'raised_bed',
        label: 'Bedengan Pakcoy',
        position: { x: 4.0, y: 1.0, z: 1.0 },
        size: { widthM: 1.0, depthM: 2.5, heightM: 0.35 },
        rotationDeg: 0,
        locked: false,
        isLocked: false,
        required: true,
        plantSpeciesId: 'pakcoy',
        irrigationType: 'sprinkler',
        sprinklerRadiusM: 2.0,
      },
      {
        id: 'obj_default_hydro',
        type: 'hydroponic',
        facilityType: 'hydroponic',
        label: 'Rak Hidroponik NFT',
        position: { x: 6.0, y: 1.0, z: 1.0 },
        size: { widthM: 0.6, depthM: 3.0, heightM: 1.0 },
        rotationDeg: 0,
        locked: false,
        isLocked: false,
        required: false,
        plantSpeciesId: 'kale',
        irrigationType: 'drip',
      },
      {
        id: 'obj_default_path',
        type: 'path',
        facilityType: 'path',
        label: 'Jalur Akses',
        position: { x: 0.8, y: 0.5, z: 0.5 },
        size: { widthM: 0.8, depthM: 4.5, heightM: 0.0 },
        rotationDeg: 0,
        locked: false,
        isLocked: false,
        required: false,
      },
      {
        id: 'obj_default_water',
        type: 'water_source',
        facilityType: 'water_source',
        label: 'Keran Air',
        position: { x: 0.5, y: 0.5, z: 0.5 },
        size: { widthM: 0.3, depthM: 0.3, heightM: 0.9 },
        rotationDeg: 0,
        locked: true,
        isLocked: true,
        required: true,
      },
    ],
    irrigation: { zones: [], pipes: [] },
    validation: { status: 'valid', isValid: true, conflicts: [], assumptions: [] },
    provenance: {
      generatedBy: 'manual',
      modelId: null,
      catalogVersion: '1.0.0',
      createdAt: now,
      updatedAt: now,
    },
    outdoorTasks: [
      { id: 'task_1', description: 'Ukur sisi lahan dan bandingkan dengan denah', status: 'todo' },
      { id: 'task_2', description: 'Amati pencahayaan matahari pagi hingga sore', status: 'todo' },
      { id: 'task_3', description: 'Tandai posisi bedengan dengan patok tali', status: 'todo' },
      { id: 'task_4', description: 'Uji aliran dan tekanan sumber air', status: 'todo' },
    ],
    ...overrides,
  };
}
