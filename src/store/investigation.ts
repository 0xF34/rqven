import { create } from 'zustand';
import type {
  AnalysisStatus,
  InvestigationResult,
  InvestigationStage,
  CandidateLocation,
} from '@/types/analysis';

interface InvestigationStore {
  status: AnalysisStatus;
  imageUrl: string | null;
  imageName: string | null;
  stages: InvestigationStage[];
  result: InvestigationResult | null;
  selectedCandidate: CandidateLocation | null;
  showResults: boolean;
  cameraFlying: boolean;

  setStatus: (status: AnalysisStatus) => void;
  setImage: (url: string, name: string) => void;
  clearImage: () => void;
  updateStage: (id: string, status: InvestigationStage['status'], detail?: string) => void;
  setStages: (stages: InvestigationStage[]) => void;
  setResult: (result: InvestigationResult) => void;
  selectCandidate: (candidate: CandidateLocation | null) => void;
  setShowResults: (show: boolean) => void;
  setCameraFlying: (flying: boolean) => void;
  reset: () => void;
}

const initialStages: InvestigationStage[] = [
  { id: 'upload', label: 'Uploading Image', status: 'pending' },
  { id: 'metadata', label: 'Reading Metadata', status: 'pending' },
  { id: 'exif', label: 'Extracting EXIF', status: 'pending' },
  { id: 'ocr', label: 'Reading Text (OCR)', status: 'pending' },
  { id: 'landmarks', label: 'Detecting Landmarks', status: 'pending' },
  { id: 'brands', label: 'Finding Brands', status: 'pending' },
  { id: 'architecture', label: 'Recognizing Architecture', status: 'pending' },
  { id: 'geography', label: 'Estimating Geography', status: 'pending' },
  { id: 'math', label: 'Calculating Measurements', status: 'pending' },
  { id: 'search', label: 'Searching Evidence', status: 'pending' },
  { id: 'ranking', label: 'Ranking Candidates', status: 'pending' },
  { id: 'globe', label: 'Preparing Globe', status: 'pending' },
  { id: 'flying', label: 'Flying to Location', status: 'pending' },
];

export const useInvestigationStore = create<InvestigationStore>((set) => ({
  status: 'idle',
  imageUrl: null,
  imageName: null,
  stages: initialStages,
  result: null,
  selectedCandidate: null,
  showResults: false,
  cameraFlying: false,

  setStatus: (status) => set({ status }),
  setImage: (url, name) => set({ imageUrl: url, imageName: name }),
  clearImage: () =>
    set({
      imageUrl: null,
      imageName: null,
      status: 'idle',
      stages: initialStages,
      result: null,
      selectedCandidate: null,
      showResults: false,
      cameraFlying: false,
    }),
  updateStage: (id, status, detail) =>
    set((state) => ({
      stages: state.stages.map((s) =>
        s.id === id
          ? { ...s, status, detail: detail ?? s.detail, timestamp: Date.now() }
          : s
      ),
    })),
  setStages: (stages) => set({ stages }),
  setResult: (result) => set({ result }),
  selectCandidate: (candidate) => set({ selectedCandidate: candidate }),
  setShowResults: (show) => set({ showResults: show }),
  setCameraFlying: (flying) => set({ cameraFlying: flying }),
  reset: () =>
    set({
      status: 'idle',
      imageUrl: null,
      imageName: null,
      stages: initialStages,
      result: null,
      selectedCandidate: null,
      showResults: false,
      cameraFlying: false,
    }),
}));
