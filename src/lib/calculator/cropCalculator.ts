/**
 * AgriSensa Garden Studio — Crop & Garden Yield Calculator
 * Ported and enhanced from agrisensa_eco/services/crop_planning_calculator.py
 *
 * Computes:
 * - Yield estimates (kg/cycle, kg/month) based on bed & hydroponic areas
 * - Estimated market value (IDR)
 * - Daily irrigation water demand (L/day)
 * - Plant count based on spacing rules
 */

import type { GardenObject } from '@/types/garden';
import { VEGETABLE_CATALOG } from '@/data/vegetable-catalog';

export interface CropYieldSummary {
  cropId: string;
  cropName: string;
  cropType: string;
  objectCount: number;
  totalAreaM2: number;
  plantCount: number;
  yieldPerCycleKg: number;
  monthlyYieldKg: number;
  harvestDays: number;
  estimatedValueIdr: number;
  waterDemandLitersPerDay: number;
}

export interface IrrigationSummary {
  dripBedCount: number;
  sprinklerCount: number;
  manualBedCount: number;
  unassignedCount: number;
  recommendedDripDurationMin: number;
  recommendedSprinklerDurationMin: number;
}

export interface GardenProductionMetrics {
  totalProductionAreaM2: number;
  totalPlantCapacity: number;
  totalYieldPerMonthKg: number;
  totalEstimatedMonthlyRevenueIdr: number; // Nilai Produksi Bruto
  estimatedMonthlyOpexIdr: number; // Estimasi Biaya Operasional (benih, pupuk/nutrisi, air ~30%)
  estimatedMonthlyNetProfitIdr: number; // Estimasi Margin Bersih Bulanan
  dailyWaterRequirementLiters: number;
  irrigation: IrrigationSummary;
  breakdown: CropYieldSummary[];
}

// Approximate price per kg in IDR based on market value category
const PRICE_MAP_IDR: Record<string, number> = {
  low: 12000,
  medium: 22000,
  high: 35000,
  premium: 65000,
  volatile: 40000,
};

// Water requirement in liters/m²/day
const WATER_DEMAND_L_M2_DAY: Record<string, number> = {
  leaf: 4.5,
  fruit: 6.0,
  herb: 3.0,
};

export function calculateGardenMetrics(objects: GardenObject[]): GardenProductionMetrics {
  const cropMap = new Map<string, CropYieldSummary>();

  let totalProductionArea = 0;

  for (const obj of objects) {
    const objType = obj.type || obj.facilityType;
    // Only calculate for beds, hydroponics, or objects that have plants/production
    if (objType !== 'raised_bed' && objType !== 'hydroponic') {
      continue;
    }

    const areaM2 = obj.size.widthM * obj.size.depthM;
    totalProductionArea += areaM2;

    const cropId = obj.plantSpeciesId || 'pakcoy'; // default to pakcoy if unassigned
    const crop = VEGETABLE_CATALOG.find(c => c.id === cropId) || VEGETABLE_CATALOG[1];

    let plantsInObj = 0;
    let yieldObjKg = 0;

    if (objType === 'hydroponic') {
      const holeDensity = crop.type === 'leaf' ? 25 : 6;
      plantsInObj = Math.floor(areaM2 * holeDensity);
      yieldObjKg = (plantsInObj * crop.yieldHydroGPerHole) / 1000;
    } else {
      // Soil / Raised Bed
      const spacingM = (crop.spacingCm || 20) / 100;
      plantsInObj = Math.floor(areaM2 / (spacingM * spacingM));
      yieldObjKg = areaM2 * crop.yieldSoilKgM2;
    }

    // Normalized to monthly yield (assuming rolling succession)
    const cyclesPerMonth = 30 / Math.max(crop.harvestDays, 1);
    const monthlyKg = yieldObjKg * cyclesPerMonth;

    const pricePerKg = PRICE_MAP_IDR[crop.marketValue] || 25000;
    const monthlyRev = monthlyKg * pricePerKg;

    const waterRate = WATER_DEMAND_L_M2_DAY[crop.type] || 4.5;
    const dailyWaterL = areaM2 * waterRate;

    const existing = cropMap.get(crop.id);
    if (existing) {
      existing.objectCount += 1;
      existing.totalAreaM2 = Math.round((existing.totalAreaM2 + areaM2) * 100) / 100;
      existing.plantCount += plantsInObj;
      existing.yieldPerCycleKg = Math.round((existing.yieldPerCycleKg + yieldObjKg) * 10) / 10;
      existing.monthlyYieldKg = Math.round((existing.monthlyYieldKg + monthlyKg) * 10) / 10;
      existing.estimatedValueIdr += Math.round(monthlyRev);
      existing.waterDemandLitersPerDay = Math.round((existing.waterDemandLitersPerDay + dailyWaterL) * 10) / 10;
    } else {
      cropMap.set(crop.id, {
        cropId: crop.id,
        cropName: crop.nameId,
        cropType: crop.type,
        objectCount: 1,
        totalAreaM2: Math.round(areaM2 * 100) / 100,
        plantCount: plantsInObj,
        yieldPerCycleKg: Math.round(yieldObjKg * 10) / 10,
        monthlyYieldKg: Math.round(monthlyKg * 10) / 10,
        harvestDays: crop.harvestDays,
        estimatedValueIdr: Math.round(monthlyRev),
        waterDemandLitersPerDay: Math.round(dailyWaterL * 10) / 10,
      });
    }
  }

  const breakdown = Array.from(cropMap.values());
  const totalPlantCapacity = breakdown.reduce((sum, item) => sum + item.plantCount, 0);
  const totalYieldPerMonthKg = Math.round(breakdown.reduce((sum, item) => sum + item.monthlyYieldKg, 0) * 10) / 10;
  const totalEstimatedMonthlyRevenueIdr = breakdown.reduce((sum, item) => sum + item.estimatedValueIdr, 0);
  const estimatedMonthlyOpexIdr = Math.round(totalEstimatedMonthlyRevenueIdr * 0.30); // Estimasi 30% OPEX (benih, pupuk/nutrisi, listrik pompa)
  const estimatedMonthlyNetProfitIdr = Math.max(0, totalEstimatedMonthlyRevenueIdr - estimatedMonthlyOpexIdr);
  const dailyWaterRequirementLiters = Math.round(breakdown.reduce((sum, item) => sum + item.waterDemandLitersPerDay, 0) * 10) / 10;

  // Calculate irrigation breakdown
  let dripBedCount = 0;
  let sprinklerCount = 0;
  let manualBedCount = 0;
  let unassignedCount = 0;

  for (const obj of objects) {
    const t = obj.type || obj.facilityType;
    if (t === 'raised_bed' || t === 'hydroponic') {
      const it = obj.irrigationType || 'unspecified';
      if (it === 'drip') dripBedCount++;
      else if (it === 'sprinkler') sprinklerCount++;
      else if (it === 'manual') manualBedCount++;
      else unassignedCount++;
    }
  }

  // Durations based on water demand and typical flow rates
  // Drip: ~2L/h per emitter -> ~15-25 min
  // Sprinkler: ~50L/h per head -> ~10-15 min
  const recommendedDripDurationMin = dripBedCount > 0 ? Math.min(45, Math.max(10, Math.round(dailyWaterRequirementLiters / Math.max(1, dripBedCount * 4) * 5))) : 15;
  const recommendedSprinklerDurationMin = sprinklerCount > 0 ? Math.min(30, Math.max(5, Math.round(dailyWaterRequirementLiters / Math.max(1, sprinklerCount * 10) * 5))) : 10;

  return {
    totalProductionAreaM2: Math.round(totalProductionArea * 100) / 100,
    totalPlantCapacity,
    totalYieldPerMonthKg,
    totalEstimatedMonthlyRevenueIdr,
    estimatedMonthlyOpexIdr,
    estimatedMonthlyNetProfitIdr,
    dailyWaterRequirementLiters,
    irrigation: {
      dripBedCount,
      sprinklerCount,
      manualBedCount,
      unassignedCount,
      recommendedDripDurationMin,
      recommendedSprinklerDurationMin,
    },
    breakdown,
  };
}
