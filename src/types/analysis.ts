// ==============================================
// RQVEN.AI - Type Definitions
// ==============================================

export interface InvestigationStage {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  detail?: string;
  timestamp?: number;
}

export interface EXIFData {
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    direction?: number | null;
  };
  timestamp?: string | null;
  camera?: string | null;
  make?: string | null;
  focalLength?: number | null;
  exposureTime?: number | null;
  iso?: number | null;
  orientation?: number | null;
  software?: string | null;
}

export interface OCRResult {
  text: string;
  language?: string;
  confidence: number;
  regions: {
    text: string;
    type: 'sign' | 'brand' | 'address' | 'vehicle' | 'billboard' | 'other';
  }[];
}

export interface LandmarkDetection {
  name: string;
  confidence: number;
  type: 'natural' | 'building' | 'monument' | 'bridge' | 'infrastructure' | 'brand';
  description?: string;
}

export interface ArchitectureAnalysis {
  style: string;
  region: string;
  features: string[];
  era?: string;
  materials?: string[];
}

export interface VegetationAnalysis {
  types: string[];
  density: 'sparse' | 'moderate' | 'dense' | 'tropical';
  season?: string;
  health: 'stressed' | 'normal' | 'lush';
}

export interface WeatherAnalysis {
  condition: 'clear' | 'cloudy' | 'overcast' | 'rainy' | 'foggy' | 'snowy';
  temperature?: string;
  humidity?: string;
  visibility?: string;
}

export interface MathematicalAnalysis {
  estimatedBuildingHeight?: { value: number; unit: string; method: string };
  estimatedRoadWidth?: { value: number; unit: string; method: string };
  viewingAngle?: { value: number; unit: string; method: string };
  cameraElevation?: { value: number; unit: string; method: string };
  focalLength?: { value: number; unit: string; method: string };
  shadowDirection?: { value: number; unit: string; method: string };
  sunAngle?: { value: number; unit: string; method: string };
  estimatedNorthDirection?: { value: number; unit: string; method: string };
  scaleEstimation?: { value: number; unit: string; method: string };
}

export interface ConfidenceScore {
  country: number;
  region: number;
  city: number;
  neighborhood: number;
  coordinates: number;
}

export interface CandidateLocation {
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  city: string;
  neighborhood?: string | null;
  confidence: number;
  reasons: string[];
}

export interface Evidence {
  id: string;
  category: 'exif' | 'ocr' | 'landmark' | 'architecture' | 'vegetation' | 'weather' | 'mathematical' | 'cultural';
  description: string;
  influence: 'strong' | 'moderate' | 'weak';
  detail: string;
}

export interface LocationEstimate {
  country: string;
  region: string;
  city: string;
  neighborhood?: string | null;
  latitude: number;
  longitude: number;
}

export interface InvestigationResult {
  exif: EXIFData | null;
  ocr: OCRResult | null;
  landmarks: LandmarkDetection[];
  architecture: ArchitectureAnalysis | null;
  vegetation: VegetationAnalysis | null;
  weather: WeatherAnalysis | null;
  mathematical: MathematicalAnalysis | null;
  confidence: ConfidenceScore;
  estimate: LocationEstimate;
  candidates: CandidateLocation[];
  evidence: Evidence[];
  reasoning: string;
  detectedLanguage?: string;
  timeOfDay?: string;
  estimatedSeason?: string;
}

export type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'flying' | 'complete' | 'error';
