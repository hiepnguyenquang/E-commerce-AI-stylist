import { create } from 'zustand';

export type VTONStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface VTONState {
  status: VTONStatus;
  humanImageUrl: string | null;
  garmentImageUrl: string | null;
  resultImageUrl: string | null;
  errorMessage: string | null;
  
  // Actions
  setStatus: (status: VTONStatus) => void;
  setHumanImage: (url: string) => void;
  setGarmentImage: (url: string) => void;
  setResult: (url: string) => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useVTONStore = create<VTONState>((set) => ({
  status: 'idle',
  humanImageUrl: null,
  garmentImageUrl: null,
  resultImageUrl: null,
  errorMessage: null,

  setStatus: (status) => set({ status }),
  
  setHumanImage: (url) => set({ humanImageUrl: url }),
  
  setGarmentImage: (url) => set({ garmentImageUrl: url }),
  
  setResult: (url) => 
    set({ 
      status: 'completed', 
      resultImageUrl: url, 
      errorMessage: null 
    }),
    
  setError: (message) => 
    set({ 
      status: 'error', 
      errorMessage: message, 
      resultImageUrl: null 
    }),
    
  reset: () =>
    set({
      status: 'idle',
      humanImageUrl: null,
      garmentImageUrl: null,
      resultImageUrl: null,
      errorMessage: null,
    }),
}));