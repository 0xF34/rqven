import type { InvestigationResult, Evidence, CandidateLocation, LandmarkDetection, ArchitectureAnalysis, VegetationAnalysis, WeatherAnalysis, MathematicalAnalysis, OCRResult, ConfidenceScore, LocationEstimate } from '@/types/analysis';

interface RawAnalysis {
  exif_note?: string | null;
  ocr?: {
    texts?: string[];
    languages?: string[];
    signs?: string[];
    brands?: string[];
    addresses?: string[];
  };
  landmarks?: Array<{
    name: string;
    confidence: number;
    type: string;
    description?: string;
  }>;
  architecture?: {
    style: string;
    likely_region: string;
    features?: string[];
    era?: string;
    materials?: string[];
  };
  vegetation?: {
    types?: string[];
    density?: string;
    season?: string;
    climate_hint?: string;
  };
  weather?: {
    condition: string;
    time_of_day?: string;
    estimated_season?: string;
  };
  mathematical?: {
    estimated_building_height_m?: { value: number; method: string };
    estimated_road_width_m?: { value: number; method: string };
    sun_angle_degrees?: { value: number; method: string };
    shadow_direction?: { value: number; method: string } | number;
    estimated_camera_height_m?: { value: number; method: string };
  };
  location_estimate?: {
    country: string;
    region: string;
    city: string;
    neighborhood?: string | null;
    latitude: number;
    longitude: number;
  };
  confidence?: {
    country: number;
    region: number;
    city: number;
    neighborhood: number;
    coordinates: number;
  };
  candidates?: Array<{
    latitude: number;
    longitude: number;
    country: string;
    region: string;
    city: string;
    confidence: number;
    reasons?: string[];
  }>;
  evidence?: Array<{
    category: string;
    description: string;
    influence: string;
    detail: string;
  }>;
  reasoning?: string;
  detected_language?: string;
  cultural_indicators?: string[];
}

export function parseAIResponse(raw: RawAnalysis, exifData: Record<string, unknown> | null): InvestigationResult {
  const confidence: ConfidenceScore = raw.confidence || {
    country: 0.5, region: 0.3, city: 0.2, neighborhood: 0.1, coordinates: 0.15,
  };

  const estimate: LocationEstimate = raw.location_estimate || {
    country: 'Unknown', region: 'Unknown', city: 'Unknown', latitude: 0, longitude: 0,
  };

  const ocr: OCRResult | null = raw.ocr ? {
    text: (raw.ocr.texts || []).join(' '),
    language: raw.ocr.languages?.[0],
    confidence: 0.85,
    regions: [
      ...(raw.ocr.signs || []).map((t) => ({ text: t, type: 'sign' as const })),
      ...(raw.ocr.brands || []).map((t) => ({ text: t, type: 'brand' as const })),
      ...(raw.ocr.addresses || []).map((t) => ({ text: t, type: 'address' as const })),
    ],
  } : null;

  const landmarks: LandmarkDetection[] = (raw.landmarks || []).map((l) => ({
    name: l.name, confidence: l.confidence, type: l.type as LandmarkDetection['type'], description: l.description,
  }));

  const architecture: ArchitectureAnalysis | null = raw.architecture ? {
    style: raw.architecture.style, region: raw.architecture.likely_region,
    features: raw.architecture.features || [], era: raw.architecture.era, materials: raw.architecture.materials || [],
  } : null;

  const vegetation: VegetationAnalysis | null = raw.vegetation ? {
    types: raw.vegetation.types || [], density: (raw.vegetation.density as VegetationAnalysis['density']) || 'moderate',
    season: raw.vegetation.season, health: raw.vegetation.density === 'tropical' ? 'lush' : 'normal',
  } : null;

  const weather: WeatherAnalysis | null = raw.weather ? {
    condition: (raw.weather.condition as WeatherAnalysis['condition']) || 'clear',
  } : null;

  const math = raw.mathematical;
  const mathematical: MathematicalAnalysis | null = math ? {
    estimatedBuildingHeight: math.estimated_building_height_m
      ? { value: math.estimated_building_height_m.value, unit: 'm', method: math.estimated_building_height_m.method }
      : undefined,
    estimatedRoadWidth: math.estimated_road_width_m
      ? { value: math.estimated_road_width_m.value, unit: 'm', method: math.estimated_road_width_m.method }
      : undefined,
    sunAngle: math.sun_angle_degrees
      ? { value: math.sun_angle_degrees.value, unit: 'deg', method: math.sun_angle_degrees.method }
      : undefined,
    shadowDirection: math.shadow_direction
      ? { value: typeof math.shadow_direction === 'object' ? math.shadow_direction.value : math.shadow_direction, unit: 'deg', method: typeof math.shadow_direction === 'object' ? (math.shadow_direction.method || 'estimated') : 'estimated' }
      : undefined,
    cameraElevation: math.estimated_camera_height_m
      ? { value: math.estimated_camera_height_m.value, unit: 'm', method: math.estimated_camera_height_m.method }
      : undefined,
  } : null;

  const candidates: CandidateLocation[] = (raw.candidates || []).map((c) => ({
    latitude: c.latitude, longitude: c.longitude, country: c.country, region: c.region,
    city: c.city, confidence: c.confidence, reasons: c.reasons || [],
  }));

  const evidence: Evidence[] = (raw.evidence || []).map((e, i) => ({
    id: `evidence-${i}`, category: e.category as Evidence['category'],
    description: e.description, influence: e.influence as Evidence['influence'], detail: e.detail,
  }));

  return {
    exif: exifData as InvestigationResult['exif'],
    ocr, landmarks, architecture, vegetation, weather, mathematical,
    confidence, estimate, candidates, evidence,
    reasoning: raw.reasoning || '',
    detectedLanguage: raw.detected_language,
    timeOfDay: raw.weather?.time_of_day,
    estimatedSeason: raw.weather?.estimated_season,
  };
}

export function extractJSON(text: string): unknown {
  // Try clean parse first
  try { return JSON.parse(text); } catch {}

  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }

  return null;
}
