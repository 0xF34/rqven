'use client';

import { motion } from 'framer-motion';

interface ConfidenceRingProps {
  value: number; // 0-1
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function ConfidenceRing({
  value,
  size = 80,
  strokeWidth = 4,
  label,
  className = '',
}: ConfidenceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - value * circumference;

  const color =
    value > 0.8 ? '#10b981' : value > 0.5 ? '#f59e0b' : '#ef4444';

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-sm font-mono font-semibold"
            style={{ color }}
          >
            {Math.round(value * 100)}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
