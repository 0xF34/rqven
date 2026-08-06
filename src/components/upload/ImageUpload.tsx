'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImageIcon, X } from 'lucide-react';
import { useInvestigationStore } from '@/store/investigation';

export default function ImageUpload() {
  const {
    imageUrl,
    imageName,
    status,
    setImage,
    clearImage,
  } = useInvestigationStore();
  const [isDragging, setIsDragging] = useState(false);
  const isProcessing = status !== 'idle' && status !== 'complete';

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      setImage(url, file.name);
    },
    [setImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (imageUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group"
      >
        <div className="relative overflow-hidden rounded-xl border border-white/10 shadow-2xl">
          <img
            src={imageUrl}
            alt="Investigation target"
            className="w-full h-auto max-h-[50vh] object-contain bg-black/50"
          />
          {/* Scan line effect during analysis */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none overflow-hidden"
              >
                <div className="absolute inset-x-0 h-px bg-emerald-400/60 animate-scan shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!isProcessing && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearImage}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500/90 backdrop-blur-sm rounded-full text-white shadow-lg cursor-pointer"
          >
            <X size={14} />
          </motion.button>
        )}
        {imageName && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-xs text-white/60 font-mono truncate">
              {imageName}
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center gap-4 p-10
          border-2 border-dashed rounded-2xl cursor-pointer
          transition-all duration-300 min-h-[280px]
          ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]'
              : 'border-white/15 bg-white/[0.03] hover:border-emerald-400/50 hover:bg-white/[0.05]'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        <motion.div
          animate={{
            scale: isDragging ? 1.15 : 1,
            rotate: isDragging ? 5 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300 }}
          className={`p-4 rounded-2xl transition-colors duration-300 ${
            isDragging ? 'bg-emerald-500/20' : 'bg-white/[0.06]'
          }`}
        >
          {isDragging ? (
            <Upload className="w-10 h-10 text-emerald-400" />
          ) : (
            <ImageIcon className="w-10 h-10 text-white/40" />
          )}
        </motion.div>

        <div className="text-center">
          <p className="text-sm font-medium text-white/70">
            {isDragging ? 'Drop image to analyze' : 'Drop an image or click to upload'}
          </p>
          <p className="text-xs text-white/30 mt-1.5">
            JPG, PNG, WebP, HEIC — Max 20MB
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            AI Analysis Ready
          </span>
        </div>
      </label>
    </motion.div>
  );
}
