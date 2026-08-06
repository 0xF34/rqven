'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useInvestigationStore } from '@/store/investigation';
import {
  MapPin,
  Globe,
  Building2,
  Eye,
  Thermometer,
  TreePine,
  Ruler,
  Languages,
  FileText,
  ChevronRight,
  Crosshair,
  Clock,
  Sun,
} from 'lucide-react';
import type { CandidateLocation, Evidence } from '@/types/analysis';

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-white/40 font-mono uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xs font-mono text-emerald-400">
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            backgroundColor:
              value > 0.8
                ? '#10b981'
                : value > 0.5
                  ? '#f59e0b'
                  : '#ef4444',
          }}
        />
      </div>
    </div>
  );
}

function EvidenceItem({ evidence }: { evidence: Evidence }) {
  const categoryColors: Record<string, string> = {
    exif: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ocr: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    landmark: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    architecture: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    vegetation: 'bg-green-500/20 text-green-400 border-green-500/30',
    weather: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    mathematical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    cultural: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };

  const influenceColors = {
    strong: 'text-emerald-400',
    moderate: 'text-amber-400',
    weak: 'text-white/40',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span
          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            categoryColors[evidence.category] || categoryColors.cultural
          }`}
        >
          {evidence.category}
        </span>
        <span
          className={`text-[10px] font-mono uppercase ${
            influenceColors[evidence.influence]
          }`}
        >
          {evidence.influence}
        </span>
      </div>
      <p className="text-xs text-white/70 mb-1">{evidence.description}</p>
      <p className="text-[11px] text-white/40 leading-relaxed">
        {evidence.detail}
      </p>
    </motion.div>
  );
}

function CandidateCard({
  candidate,
  isSelected,
  onClick,
}: {
  candidate: CandidateLocation;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg border transition-all cursor-pointer
        ${
          isSelected
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
        }
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-white/80">
          {candidate.city || candidate.region}
        </span>
        <span className="text-[10px] font-mono text-emerald-400">
          {Math.round(candidate.confidence * 100)}%
        </span>
      </div>
      <p className="text-[10px] text-white/40 font-mono">
        {candidate.country} — {candidate.region}
      </p>
      <p className="text-[10px] text-white/30 font-mono mt-1">
        {candidate.latitude.toFixed(4)}, {candidate.longitude.toFixed(4)}
      </p>
    </motion.button>
  );
}

export default function ResultsPanel() {
  const { result, selectedCandidate, selectCandidate, showResults } =
    useInvestigationStore();

  if (!result || !showResults) return null;

  const overallConfidence =
    (result.confidence.country +
      result.confidence.region +
      result.confidence.city +
      result.confidence.coordinates) /
    4;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-[420px] max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/50 backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-5 border-b border-white/10 bg-black/70 backdrop-blur-xl rounded-t-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-white/80">
                Analysis Complete
              </h2>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400">
                {Math.round(overallConfidence * 100)}% overall
              </span>
            </div>
          </div>

          {/* Location estimate */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-lg font-semibold text-white">
                {result.estimate.city}, {result.estimate.country}
              </span>
            </div>
            <p className="text-xs font-mono text-white/40 pl-5.5">
              {result.estimate.latitude.toFixed(6)},{' '}
              {result.estimate.longitude.toFixed(6)}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Confidence breakdown */}
          <section>
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-3">
              Confidence Breakdown
            </h3>
            <div className="space-y-2.5">
              <ConfidenceBar value={result.confidence.country} label="Country" />
              <ConfidenceBar value={result.confidence.region} label="Region" />
              <ConfidenceBar value={result.confidence.city} label="City" />
              <ConfidenceBar
                value={result.confidence.neighborhood}
                label="Neighborhood"
              />
              <ConfidenceBar
                value={result.confidence.coordinates}
                label="Coordinates"
              />
            </div>
          </section>

          {/* Quick facts */}
          <section className="grid grid-cols-2 gap-2">
            {result.detectedLanguage && (
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <Languages className="w-3.5 h-3.5 text-purple-400 mb-1.5" />
                <p className="text-[10px] text-white/30 font-mono uppercase">
                  Language
                </p>
                <p className="text-xs text-white/70">{result.detectedLanguage}</p>
              </div>
            )}
            {result.timeOfDay && (
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <Sun className="w-3.5 h-3.5 text-amber-400 mb-1.5" />
                <p className="text-[10px] text-white/30 font-mono uppercase">
                  Time of Day
                </p>
                <p className="text-xs text-white/70">{result.timeOfDay}</p>
              </div>
            )}
            {result.estimatedSeason && (
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <Clock className="w-3.5 h-3.5 text-cyan-400 mb-1.5" />
                <p className="text-[10px] text-white/30 font-mono uppercase">
                  Season
                </p>
                <p className="text-xs text-white/70">{result.estimatedSeason}</p>
              </div>
            )}
            {result.weather && (
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <Thermometer className="w-3.5 h-3.5 text-sky-400 mb-1.5" />
                <p className="text-[10px] text-white/30 font-mono uppercase">
                  Weather
                </p>
                <p className="text-xs text-white/70 capitalize">
                  {result.weather.condition}
                </p>
              </div>
            )}
          </section>

          {/* Architecture */}
          {result.architecture && (
            <section>
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2 flex items-center gap-1.5">
                <Building2 size={11} /> Architecture
              </h3>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-1.5">
                <p className="text-xs text-white/70">
                  <span className="text-white/40">Style:</span>{' '}
                  {result.architecture.style}
                </p>
                <p className="text-xs text-white/70">
                  <span className="text-white/40">Region:</span>{' '}
                  {result.architecture.region}
                </p>
                {result.architecture.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {result.architecture.features.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400/70 border border-orange-500/20"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Vegetation */}
          {result.vegetation && result.vegetation.types.length > 0 && (
            <section>
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2 flex items-center gap-1.5">
                <TreePine size={11} /> Vegetation
              </h3>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex flex-wrap gap-1">
                  {result.vegetation.types.map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400/70 border border-green-500/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-1.5">
                  Density: {result.vegetation.density}
                  {result.vegetation.season && ` — Season: ${result.vegetation.season}`}
                </p>
              </div>
            </section>
          )}

          {/* Mathematical Analysis */}
          {result.mathematical && (
            <section>
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2 flex items-center gap-1.5">
                <Ruler size={11} /> Measurements
              </h3>
              <div className="space-y-1.5">
                {result.mathematical.estimatedBuildingHeight && (
                  <div className="flex justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-[11px] text-white/50">Building Height</span>
                    <span className="text-[11px] font-mono text-white/70">
                      ~{result.mathematical.estimatedBuildingHeight.value.toFixed(1)}{' '}
                      {result.mathematical.estimatedBuildingHeight.unit}
                    </span>
                  </div>
                )}
                {result.mathematical.estimatedRoadWidth && (
                  <div className="flex justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-[11px] text-white/50">Road Width</span>
                    <span className="text-[11px] font-mono text-white/70">
                      ~{result.mathematical.estimatedRoadWidth.value.toFixed(1)}{' '}
                      {result.mathematical.estimatedRoadWidth.unit}
                    </span>
                  </div>
                )}
                {result.mathematical.sunAngle && (
                  <div className="flex justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-[11px] text-white/50">Sun Angle</span>
                    <span className="text-[11px] font-mono text-white/70">
                      ~{result.mathematical.sunAngle.value.toFixed(1)}{' '}
                      {result.mathematical.sunAngle.unit}
                    </span>
                  </div>
                )}
                {result.mathematical.cameraElevation && (
                  <div className="flex justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-[11px] text-white/50">Camera Height</span>
                    <span className="text-[11px] font-mono text-white/70">
                      ~{result.mathematical.cameraElevation.value.toFixed(1)}{' '}
                      {result.mathematical.cameraElevation.unit}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* OCR Texts */}
          {result.ocr && (
            <section>
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2 flex items-center gap-1.5">
                <FileText size={11} /> Detected Text (OCR)
              </h3>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-xs text-white/70 leading-relaxed">
                  {result.ocr.text || 'No text detected'}
                </p>
                {result.ocr.regions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.ocr.regions.map((r, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400/70 border border-purple-500/20"
                      >
                        {r.type}: {r.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Reasoning */}
          <section>
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2 flex items-center gap-1.5">
              <Eye size={11} /> Reasoning
            </h3>
            <p className="text-xs text-white/60 leading-relaxed p-3 rounded-lg bg-white/[0.03] border border-white/5">
              {result.reasoning}
            </p>
          </section>

          {/* Candidate locations */}
          {result.candidates.length > 1 && (
            <section>
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2 flex items-center gap-1.5">
                <Globe size={11} /> Alternative Locations
                <ChevronRight size={10} className="text-white/20" />
              </h3>
              <div className="space-y-1.5">
                {result.candidates.map((c, i) => (
                  <CandidateCard
                    key={i}
                    candidate={c}
                    isSelected={
                      selectedCandidate?.latitude === c.latitude &&
                      selectedCandidate?.longitude === c.longitude
                    }
                    onClick={() =>
                      selectCandidate(
                        selectedCandidate?.latitude === c.latitude
                          ? null
                          : c
                      )
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* Evidence list */}
          <section>
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2">
              Evidence Chain ({result.evidence.length})
            </h3>
            <div className="space-y-1.5">
              {result.evidence.map((e) => (
                <EvidenceItem key={e.id} evidence={e} />
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}