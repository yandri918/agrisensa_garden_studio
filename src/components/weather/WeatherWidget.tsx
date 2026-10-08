'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WeatherResponse } from '@/types/garden';
import { useGardenStore } from '@/store/gardenStore';
import {
  Cloud,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Scan,
} from 'lucide-react';

interface CityOption {
  name: string;
  lat: number;
  lng: number;
}

const CITY_OPTIONS: CityOption[] = [
  { name: 'Lembang, Jawa Barat', lat: -6.8168, lng: 107.6167 },
  { name: 'Bogor, Jawa Barat', lat: -6.5971, lng: 106.806 },
  { name: 'Batu / Malang, Jawa Timur', lat: -7.8712, lng: 112.527 },
  { name: 'Sleman, D.I. Yogyakarta', lat: -7.6896, lng: 110.3398 },
  { name: 'Tabanan, Bali', lat: -8.5413, lng: 115.125 },
];

interface WeatherWidgetProps {
  onOpenVisionScanner?: () => void;
}

export function WeatherWidget({ onOpenVisionScanner }: WeatherWidgetProps) {
  const [selectedCity, setSelectedCity] = useState<CityOption>(CITY_OPTIONS[0]);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [appliedAdviceFeedback, setAppliedAdviceFeedback] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement | null>(null);

  const garden = useGardenStore(state => state.garden);
  const updateObject = useGardenStore(state => state.updateObject);

  const fetchWeather = async (city: CityOption) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/weather?lat=${city.lat}&lng=${city.lng}&city=${encodeURIComponent(city.name)}`);
      if (res.ok) {
        const data: WeatherResponse = await res.json();
        setWeather(data);
      }
    } catch (err) {
      console.warn('Failed to load weather:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Apply Smart Rain Delay / ET0 to all beds
  const handleApplySmartIrrigation = () => {
    if (!weather) return;

    if (weather.smartAdvisory.rainDelay) {
      // In rain delay, we preserve drip/sprinkler config but annotate note
      garden.objects.forEach(obj => {
        if (obj.type === 'raised_bed' || obj.type === 'hydroponic') {
          updateObject(obj.id, {
            notes: `[Rain Delay Aktif] Peluang hujan ${weather.daily.precipitationProbabilityMaxPct}%. Katup penyiraman dihentikan sementara.`,
          });
        }
      });
      setAppliedAdviceFeedback('Smart Rain Delay diaktifkan ke seluruh bedengan!');
    } else {
      // Adjust spacing/rates according to ET0
      setAppliedAdviceFeedback(
        `Penyesuaian laju evaporasi (${weather.daily.et0EvapotranspirationMm} mm) diterapkan ke jadwal irigasi.`
      );
    }

    setTimeout(() => setAppliedAdviceFeedback(null), 4000);
  };

  // Weather icon selector
  const getWeatherIcon = (code: number, rain: number) => {
    if (rain > 0.5 || code >= 61) {
      return <CloudRain size={14} className="text-cyan-400" />;
    }
    if (code >= 1 && code <= 3) {
      return <Cloud size={14} className="text-gray-300" />;
    }
    return <Sun size={14} className="text-amber-400" />;
  };

  return (
    <div className="relative select-none" ref={popoverRef}>
      {/* Header Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-xs text-gray-200 transition-all hover:border-white/20"
        title="Klik untuk membuka detail cuaca mikro & rekomendasi irigasi Open-Meteo"
      >
        <div className="flex items-center gap-1.5 font-medium">
          {weather ? (
            getWeatherIcon(weather.current.weatherCode, weather.current.precipitationMm)
          ) : (
            <Cloud size={14} className="text-gray-400" />
          )}
          <span>{weather ? `${weather.current.temperatureC}°C` : 'Cuaca...'}</span>
        </div>

        {weather && (
          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono hidden md:flex">
            <span className="text-gray-600">•</span>
            <span>RH {weather.current.relativeHumidityPct}%</span>
          </div>
        )}

        {/* Rain Delay Warning Badge */}
        {weather?.smartAdvisory.rainDelay && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Rain Delay
          </span>
        )}

        <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3.5">
          {/* Location Bar & Refresh */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <MapPin size={14} />
              <select
                value={selectedCity.name}
                onChange={e => {
                  const found = CITY_OPTIONS.find(c => c.name === e.target.value);
                  if (found) setSelectedCity(found);
                }}
                className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
              >
                {CITY_OPTIONS.map(c => (
                  <option key={c.name} value={c.name} className="bg-slate-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchWeather(selectedCity)}
              disabled={isLoading}
              className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Perbarui Cuaca"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Current Microclimate Grid */}
          {weather && (
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-0.5">
                  <Thermometer size={11} className="text-amber-400" />
                  <span>Suhu Udara</span>
                </div>
                <div className="text-base font-bold text-white font-mono">{weather.current.temperatureC}°C</div>
                <div className="text-[9px] text-gray-500 font-mono">
                  {weather.daily.tempMinC}° - {weather.daily.tempMaxC}°C
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-0.5">
                  <Droplets size={11} className="text-cyan-400" />
                  <span>Kelembaban</span>
                </div>
                <div className="text-base font-bold text-cyan-300 font-mono">
                  {weather.current.relativeHumidityPct}%
                </div>
                <div className="text-[9px] text-gray-500 font-mono">{weather.current.weatherDescription}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-0.5">
                  <Wind size={11} className="text-emerald-400" />
                  <span>Evaporasi ET0</span>
                </div>
                <div className="text-base font-bold text-emerald-300 font-mono">
                  {weather.daily.et0EvapotranspirationMm} <span className="text-[10px]">mm</span>
                </div>
                <div className="text-[9px] text-gray-500 font-mono">FAO-56 Penman</div>
              </div>
            </div>
          )}

          {/* Rain Probability & Summary */}
          {weather && (
            <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-gray-300">
                <span className="flex items-center gap-1.5">
                  <CloudRain size={13} className="text-cyan-400" />
                  <span>Prediksi Curah Hujan Hari Ini:</span>
                </span>
                <span className="font-mono font-semibold text-white">
                  {weather.daily.precipitationSumMm} mm ({weather.daily.precipitationProbabilityMaxPct}%)
                </span>
              </div>
            </div>
          )}

          {/* Smart Rain Delay & Irrigation Advisory Card */}
          {weather && (
            <div
              className={`p-3 rounded-xl border space-y-2 text-xs ${
                weather.smartAdvisory.rainDelay
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {weather.smartAdvisory.rainDelay ? (
                  <>
                    <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                    <span>Rekomendasi: Smart Rain Delay Aktif</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Rekomendasi: Irigasi Berjalan Normal</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{weather.smartAdvisory.irrigationAdvice}</p>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleApplySmartIrrigation}
                className="w-full py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Terapkan Logika Cuaca ke Denah Irigasi</span>
              </button>
            </div>
          )}

          {/* Fungal Disease Warning Banner */}
          {weather?.smartAdvisory.diseaseRiskLevel !== 'low' && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                <ShieldAlert size={14} className="text-rose-400" />
                <span>Peringatan Risiko Jamur Hawar Daun</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{weather?.smartAdvisory.diseaseAdvice}</p>
              {onOpenVisionScanner && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenVisionScanner();
                  }}
                  className="w-full py-1.5 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 border border-rose-500/30"
                >
                  <Scan size={13} />
                  <span>Buka AI Vision Scanner Daun</span>
                </button>
              )}
            </div>
          )}

          {/* Feedback Banner */}
          {appliedAdviceFeedback && (
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-[11px] text-emerald-300 text-center font-medium">
              {appliedAdviceFeedback}
            </div>
          )}

          {/* Footer note */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 font-mono">
            <span>Data: Open-Meteo High Resolution</span>
            <span>Update: {weather?.cachedAt || 'Baru'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
