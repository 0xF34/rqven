import type { ConfidenceScore } from '@/types/analysis';

export interface WeightedEvidence {
  category: string;
  influence: 'strong' | 'moderate' | 'weak';
  supportsCountry?: string;
  supportsRegion?: string;
  supportsCity?: string;
}

const INFLUENCE_WEIGHTS = {
  strong: 1.0,
  moderate: 0.6,
  weak: 0.25,
};

export function calculateOverallConfidence(confidence: ConfidenceScore): number {
  const weights = {
    country: 0.3,
    region: 0.25,
    city: 0.25,
    neighborhood: 0.1,
    coordinates: 0.1,
  };

  return (
    confidence.country * weights.country +
    confidence.region * weights.region +
    confidence.city * weights.city +
    confidence.neighborhood * weights.neighborhood +
    confidence.coordinates * weights.coordinates
  );
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'Very High';
  if (confidence >= 0.7) return 'High';
  if (confidence >= 0.5) return 'Moderate';
  if (confidence >= 0.3) return 'Low';
  return 'Speculative';
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return '#10b981';
  if (confidence >= 0.4) return '#f59e0b';
  return '#ef4444';
}

export function estimateSearchRadius(confidence: ConfidenceScore): number {
  // Return radius in meters for the confidence circle
  if (confidence.coordinates > 0.8) return 300;
  if (confidence.coordinates > 0.6) return 1000;
  if (confidence.coordinates > 0.4) return 3000;
  if (confidence.coordinates > 0.2) return 10000;
  return 25000;
}

export function rankCandidates(
  candidates: { confidence: number }[]
): { confidence: number }[] {
  return [...candidates].sort((a, b) => b.confidence - a.confidence);
}
