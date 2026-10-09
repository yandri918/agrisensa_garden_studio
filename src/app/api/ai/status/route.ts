/**
 * AgriSensa Garden Studio — AI Engine Health & Status Route
 * Provides real-time dynamic check of server-side Gemini API Key.
 * Never leaks the actual key to the client.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);

  return NextResponse.json({
    configured: isConfigured,
    model: 'gemini-3.8-flash',
    mode: isConfigured ? 'cloud_gemini' : 'deterministic_rules',
    providerName: isConfigured ? 'Google Gemini 3.8 Flash (Cloud)' : 'Rule-Based Spatial Engine (Offline)',
    message: isConfigured
      ? 'Koneksi AI aktif dan terhubung ke Google Gemini 3.8 Flash'
      : 'Berjalan dalam mode mesin spasial deterministik lokal (Rule-Based)',
  });
}
