'use client';

import { motion } from 'framer-motion';
import { useInvestigationStore } from '@/store/investigation';
import {
  Upload,
  FileText,
  ScanLine,
  Languages,
  Landmark,
  Tag,
  Building2,
  Globe,
  Calculator,
  Search,
  BarChart3,
  Globe2,
  Navigation,
} from 'lucide-react';

const stageIcons: Record<string, React.ReactNode> = {
  upload: <Upload size={14} />,
  metadata: <FileText size={14} />,
  exif: <ScanLine size={14} />,
  ocr: <Languages size={14} />,
  landmarks: <Landmark size={14} />,
  brands: <Tag size={14} />,
  architecture: <Building2 size={14} />,
  geography: <Globe size={14} />,
  math: <Calculator size={14} />,
  search: <Search size={14} />,
  ranking: <BarChart3 size={14} />,
  globe: <Globe2 size={14} />,
  flying: <Navigation size={14} />,
};

export default function InvestigationTimeline() {
  const { stages, status } = useInvestigationStore();
  const isActive = status === 'uploading' || status === 'analyzing' || status === 'flying';

  if (status === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-80 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          {isActive && (
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-white/60">
          Investigation Pipeline
        </h3>
      </div>

      {/* Stage list */}
      <div className="space-y-0.5">
        {stages.map((stage, index) => {
          const isComplete = stage.status === 'complete';
          const isCurrent = stage.status === 'active';

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{ delay: index * 0.03 }}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300
                ${
                  isCurrent
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : isComplete
                      ? 'bg-white/[0.03]'
                      : 'opacity-30'
                }
              `}
            >
              {/* Icon */}
              <div
                className={`
                  flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0
                  ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isComplete
                        ? 'bg-emerald-500/10 text-emerald-400/60'
                        : 'bg-white/5 text-white/20'
                  }
                `}
              >
                {stageIcons[stage.id] || <div className="w-2 h-2 rounded-full" />}
              </div>

              {/* Label */}
              <span
                className={`
                  text-xs font-medium flex-1 truncate
                  ${
                    isCurrent
                      ? 'text-emerald-400'
                      : isComplete
                        ? 'text-white/60'
                        : 'text-white/30'
                  }
                `}
              >
                {stage.label}
              </span>

              {/* Status indicator */}
              {isComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    className="text-emerald-400"
                  >
                    <path
                      d="M2 4L3.5 5.5L6 2.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              )}

              {isCurrent && (
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full bg-emerald-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}