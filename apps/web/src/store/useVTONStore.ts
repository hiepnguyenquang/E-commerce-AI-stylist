import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VTONStatus = 'idle' | 'uploading' | 'pending' | 'rendering' | 'completed' | 'error';

interface VTONState {
  status: VTONStatus;
  currentJobId: string | null;
  humanImageUrl: string | null;
  garmentImageUrl: string | null;
  resultImageUrl: string | null;
  errorMessage: string | null;
  
  // Actions
  setStatus: (status: VTONStatus) => void;
  setJobId: (jobId: string) => void;
  setHumanImage: (url: string) => void;
  setGarmentImage: (url: string) => void;
  startVTON: (humanImageUrl: string, garmentImageUrl: string) => void;
  setVTONResult: (url: string) => void;
  setVTONError: (message: string) => void;
  reset: () => void;
}

export const useVTONStore = create<VTONState>()(
  persist(
    (set) => ({
      status: 'idle',
      currentJobId: null,
      humanImageUrl: null,
      garmentImageUrl: null,
      resultImageUrl: null,
      errorMessage: null,

      setStatus: (status) => set({ status }),
      setJobId: (jobId) => set({ currentJobId: jobId }),
      setHumanImage: (url) => set({ humanImageUrl: url }),
      setGarmentImage: (url) => set({ garmentImageUrl: url }),
      
      startVTON: (humanImageUrl, garmentImageUrl) => 
        set({ 
          status: 'pending', 
          humanImageUrl,
          garmentImageUrl,
          resultImageUrl: null, 
          errorMessage: null 
        }),
        
      setVTONResult: (url) => 
        set({ 
          status: 'completed', 
          resultImageUrl: url, 
          errorMessage: null 
        }),
        
      setVTONError: (message) => 
        set({ 
          status: 'error', 
          errorMessage: message, 
          resultImageUrl: null 
        }),
        
      reset: () =>
        set((state) => ({
          status: 'idle',
          currentJobId: null,
          // Keep humanImageUrl when resetting the VTON modal state
          humanImageUrl: state.humanImageUrl,
          garmentImageUrl: null,
          resultImageUrl: null,
          errorMessage: null,
        })),
    }),
    {
      name: 'vton-storage',
      // Chỉ lưu humanImageUrl vào localStorage để không bị mất khi F5
      partialize: (state) => ({ humanImageUrl: state.humanImageUrl }),
    }
  )
);