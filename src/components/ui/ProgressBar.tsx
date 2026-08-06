'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-1
  label?: string;
  showValue?: boolean;
  className?: string;
  color?: string;
}

export function ProgressBar({
  value,
  label,
  showValue = true,
  className,
  color,
}: ProgressBarProps) {
  const barColor =
    color ||
    (value > 0.8
      ? '#10b981'
      : value > 0.5
        ? '#f59e0b'
        : '#ef4444');

  return (
    <div className={cn('space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-[11px] text-white/40 font-mono uppercase tracking-wider">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-xs font-mono" style={{ color: barColor }}>
              {Math.round(value * 100)}%
            </span>
          )}
        </div>
      )}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
