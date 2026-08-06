import type {
  InvestigationResult,
  Evidence,
  CandidateLocation,
  LandmarkDetection,
  ArchitectureAnalysis,
  VegetationAnalysis,
  WeatherAnalysis,
  MathematicalAnalysis,
  OCRResult,
  ConfidenceScore,
  LocationEstimate,
} from '@/types/analysis';

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
    era?: string | null;
    materials?: string[];
  };
  vegetation?: {
    types?: string[];
    density?: string;
    season?: string | null;
    climate_hint?: string;
  };
  weather?: {
    condition: string;
    time_of_day?: string;
    estimated_season?: string;
  };
  mathematical?: {
    estimated_building_height_m?: { value: number; method: string } | null;
    estimated_road_width_m?: { value: number; method: string } | null;
    sun_angle_degrees?: { value: number; method: string } | null;
    shadow_direction?: { value: number; method: string } | number | null;
    estimated_camera_height_m?: { value: number; method: string } | null;
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
    neighborhood?: string | null;
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

export function parseAIResponse(
  raw: RawAnalysis,
  exifData: Record<string, unknown> | null
): InvestigationResult {
  const confidence: ConfidenceScore = raw.confidence || {
    country: 0.5, region: 0.3, city: 0.2, neighborhood: 0.1, coordinates: 0.15,
  };

  const estimate: LocationEstimate = {
    country: raw.location_estimate?.country || 'Unknown',
    region: raw.location_estimate?.region || 'Unknown',
    city: raw.location_estimate?.city || 'Unknown',
    neighborhood: raw.location_estimate?.neighborhood ?? undefined,
    latitude: raw.location_estimate?.latitude || 0,
    longitude: raw.location_estimate?.longitude || 0,
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
    name: l.name,
    confidence: l.confidence,
    type: (l.type === 'natural' || l.type === 'building' || l.type === 'monument' || l.type === 'bridge' || l.type === 'infrastructure' || l.type === 'brand')
      ? l.type
      : 'building',
    description: l.description,
  }));

  const architecture: ArchitectureAnalysis | null = raw.architecture ? {
    style: raw.architecture.style,
    region: raw.architecture.likely_region,
    features: raw.architecture.features || [],
    era: raw.architecture.era ?? undefined,
    materials: raw.architecture.materials || [],
  } : null;

  const vegetation: VegetationAnalysis | null = raw.vegetation ? {
    types: raw.vegetation.types || [],
    density: ['sparse', 'moderate', 'dense', 'tropical'].includes(raw.vegetation.density || '')
      ? raw.vegetation.density as VegetationAnalysis['density']
      : 'moderate',
    season: raw.vegetation.season ?? undefined,
    health: raw.vegetation.density === 'tropical' ? 'lush' : 'normal',
  } : null;

  const weather: WeatherAnalysis | null = raw.weather ? {
    condition: ['clear', 'cloudy', 'overcast', 'rainy', 'foggy', 'snowy'].includes(raw.weather.condition)
      ? raw.weather.condition as WeatherAnalysis['condition']
      : 'clear',
  } : null;

  const m = raw.mathematical;
  const mathematical: MathematicalAnalysis | null = m ? {
    estimatedBuildingHeight: m.estimated_building_height_m ? { value: m.estimated_building_height_m.value, unit: 'm', method: m.estimated_building_height_m.method } : undefined,
    estimatedRoadWidth: m.estimated_road_width_m ? { value: m.estimated_road_width_m.value, unit: 'm', method: m.estimated_road_width_m.method } : undefined,
    sunAngle: m.sun_angle_degrees ? { value: m.sun_angle_degrees.value, unit: 'deg', method: m.sun_angle_degrees.method } : undefined,
    shadowDirection: m.shadow_direction
      ? { value: typeof m.shadow_direction === 'object' && m.shadow_direction !== null ? m.shadow_direction.value : m.shadow_direction, unit: 'deg', method: typeof m.shadow_direction === 'object' && m.shadow_direction !== null ? (m.shadow_direction.method || 'estimated') : 'estimated' }
      : undefined,
    cameraElevation: m.estimated_camera_height_m ? { value: m.estimated_camera_height_m.value, unit: 'm', method: m.estimated_camera_height_m.method } : undefined,
  } : null;

  const candidates: CandidateLocation[] = (raw.candidates || []).map((c) => ({
    latitude: c.latitude,
    longitude: c.longitude,
    country: c.country,
    region: c.region,
    city: c.city,
    neighborhood: c.neighborhood ?? undefined,
    confidence: c.confidence,
    reasons: c.reasons || [],
  }));

  const evidence: Evidence[] = (raw.evidence || []).map((e, i) => ({
    id: `evidence-${i}`,
    category: (['exif', 'ocr', 'landmark', 'architecture', 'vegetation', 'weather', 'mathematical', 'cultural'].includes(e.category)
      ? e.category
      : 'cultural') as Evidence['category'],
    description: e.description,
    influence: (['strong', 'moderate', 'weak'].includes(e.influence)
      ? e.influence
      : 'weak') as Evidence['influence'],
    detail: e.detail,
  }));

  return {
    exif: exifData as InvestigationResult['exif'],
    ocr,
    landmarks,
    architecture,
    vegetation,
    weather,
    mathematical,
    confidence,
    estimate,
    candidates,
    evidence,
    reasoning: raw.reasoning || '',
    detectedLanguage: raw.detected_language,
    timeOfDay: raw.weather?.time_of_day,
    estimatedSeason: raw.weather?.estimated_season,
  };
}

export function extractJSON(text: string): unknown {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}
