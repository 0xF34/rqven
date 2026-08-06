'use client';

import { useCallback, useRef, useState, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useInvestigationStore } from '@/store/investigation';
import InvestigationTimeline from '@/components/investigation/InvestigationTimeline';
import ResultsPanel from '@/components/investigation/ResultsPanel';
import { Crosshair, Satellite, Zap, Upload, X } from 'lucide-react';
import type { InvestigationResult } from '@/types/analysis';

// Dynamic import Cesium (heavy, client-only)
const CesiumGlobe = dynamic(() => import('@/components/globe/CesiumGlobe'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Satellite className="w-10 h-10 text-emerald-400/50" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border border-emerald-400/20 animate-ping" />
        </div>
        <p className="text-xs font-mono text-white/30 uppercase tracking-widest">
          Initializing Globe...
        </p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const {
    imageUrl,
    imageName,
    status,
    result,
    setStatus,
    setStages,
    updateStage,
    setResult,
    setImage,
    reset,
  } = useInvestigationStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startAnalysis = useCallback(async () => {
    if (!imageUrl) return;

    try {
      setStatus('uploading');

      const initialStages = [
        { id: 'upload', label: 'Uploading Image', status: 'pending' as const },
        { id: 'metadata', label: 'Reading Metadata', status: 'pending' as const },
        { id: 'exif', label: 'Extracting EXIF', status: 'pending' as const },
        { id: 'ocr', label: 'Reading Text (OCR)', status: 'pending' as const },
        { id: 'landmarks', label: 'Detecting Landmarks', status: 'pending' as const },
        { id: 'brands', label: 'Finding Brands', status: 'pending' as const },
        { id: 'architecture', label: 'Recognizing Architecture', status: 'pending' as const },
        { id: 'geography', label: 'Estimating Geography', status: 'pending' as const },
        { id: 'math', label: 'Calculating Measurements', status: 'pending' as const },
        { id: 'search', label: 'Searching Evidence', status: 'pending' as const },
        { id: 'ranking', label: 'Ranking Candidates', status: 'pending' as const },
        { id: 'globe', label: 'Preparing Globe', status: 'pending' as const },
        { id: 'flying', label: 'Flying to Location', status: 'pending' as const },
      ];
      setStages(initialStages);
      setStatus('analyzing');

      // Get blob from object URL
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Animate stages progressively while API call runs
      const stageOrder = initialStages.map((s) => s.id);
      const animateStages = async () => {
        for (let i = 0; i < stageOrder.length; i++) {
          updateStage(stageOrder[i], 'active');
          await new Promise((r) => setTimeout(r, 350 + Math.random() * 250));
          updateStage(stageOrder[i], 'complete');
        }
      };

      // Start stage animation and API call in parallel
      const [apiResult] = await Promise.all([
        (async () => {
          const formData = new FormData();
          formData.append('image', blob, 'image.jpg');

          const apiResponse = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
          });

          if (!apiResponse.ok) {
            const err = await apiResponse.json();
            throw new Error(err.error || 'Analysis failed');
          }

          return apiResponse.json() as Promise<InvestigationResult>;
        })(),
        animateStages(),
      ]);

      setResult(apiResult);
      setStatus('flying');
    } catch (error) {
      console.error('Analysis error:', error);
      setStatus('error');
    }
  }, [imageUrl, setStatus, setStages, updateStage, setResult]);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      setImage(url, file.name);
      setTimeout(() => startAnalysis(), 400);
    },
    [setImage, startAnalysis]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const showTimeline = status === 'uploading' || status === 'analyzing' || status === 'flying';
  const isIdle = status === 'idle';
  const isProcessing = status !== 'idle' && status !== 'complete';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Globe layer */}
      <CesiumGlobe />

      {/* Top gradient overlay */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-[1] pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-0 inset-x-0 z-10 p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Crosshair className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white/90">
                RQVEN<span className="text-emerald-400">.AI</span>
              </h1>
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">
                Geolocation Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isIdle && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={reset}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer font-mono"
              >
                New Analysis
              </motion.button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                AI Powered
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Center content */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        <div className="h-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            {/* Upload area - shown when idle OR during analysis (shows image) */}
            {(isIdle || (status === 'analyzing' || status === 'uploading' || status === 'flying') || status === 'error') && (
              <motion.div
                key="upload-area"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className={`pointer-events-auto ${result ? 'w-[380px]' : 'w-[420px]'}`}
              >
                {isIdle && (
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4"
                    >
                      <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] font-mono text-white/50">
                        OSINT Image Geolocation
                      </span>
                    </motion.div>
                    <h2 className="text-2xl font-semibold text-white/90 mb-2">
                      Where was this taken?
                    </h2>
                    <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
                      Upload any image and our AI will analyze every visible detail
                      to estimate its geolocation with confidence scoring.
                    </p>
                  </div>
                )}

                {/* Image preview / upload zone */}
                {imageUrl ? (
                  <div className="relative group">
                    <div className="relative overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                      <img
                        src={imageUrl}
                        alt="Investigation target"
                        className="w-full h-auto max-h-[45vh] object-contain bg-black/50"
                      />
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
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500/90 backdrop-blur-sm rounded-full text-white shadow-lg cursor-pointer z-10"
                      >
                        <X size={14} />
                      </motion.button>
                    )}
                    {imageName && (
                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
                        <p className="text-xs text-white/60 font-mono truncate">
                          {imageName}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`
                      relative flex flex-col items-center justify-center gap-4 p-10
                      border-2 border-dashed rounded-2xl cursor-pointer
                      transition-all duration-300 min-h-[200px]
                      ${
                        isDragging
                          ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]'
                          : 'border-white/15 bg-white/[0.03] hover:border-emerald-400/50 hover:bg-white/[0.05]'
                      }
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <motion.div
                      animate={{ scale: isDragging ? 1.15 : 1, rotate: isDragging ? 5 : 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`p-4 rounded-2xl transition-colors duration-300 ${
                        isDragging ? 'bg-emerald-500/20' : 'bg-white/[0.06]'
                      }`}
                    >
                      {isDragging ? (
                        <Upload className="w-10 h-10 text-emerald-400" />
                      ) : (
                        <svg className="w-10 h-10 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM8.25 8.625a1.125 1.125 0 110-2.25 1.125 1.125 0 010 2.25z" />
                        </svg>
                      )}
                    </motion.div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white/70">
                        {isDragging ? 'Drop image to analyze' : 'Drop an image or click to upload'}
                      </p>
                      <p className="text-xs text-white/30 mt-1.5">JPG, PNG, WebP — Max 20MB</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                        AI Analysis Ready
                      </span>
                    </div>
                  </label>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Timeline panel - left side */}
      <AnimatePresence>
        {showTimeline && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-10"
          >
            <InvestigationTimeline />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results panel - right side */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-10"
          >
            <ResultsPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-4 inset-x-0 z-10 flex justify-center pointer-events-none"
      >
        <div className="flex items-center gap-6 px-5 py-2 rounded-full glass">
          <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">
            Drag to rotate
          </span>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">
            Scroll to zoom
          </span>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">
            Right-click to tilt
          </span>
        </div>
      </motion.div>
    </div>
  );
}
