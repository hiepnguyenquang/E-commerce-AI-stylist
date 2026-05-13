import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VTONStatus = 'idle' | 'uploading' | 'pending' | 'rendering' | 'processing_next_step' | 'completed' | 'error';
export type VTONContext = 'modal' | 'wardrobe' | null;

interface SelectedOutfit {
  top: string | null;
  bottom: string | null;
  dress: string | null;
}

interface VTONState {
  status: VTONStatus;
  activeContext: VTONContext;
  currentJobId: string | null;
  humanImageUrl: string | null;
  garmentImageUrl: string | null; // For single item try-on
  selectedOutfit: SelectedOutfit; // For Mix & Match UI
  resultImageUrl: string | null;
  errorMessage: string | null;
  progressMessage: string | null;
  
  // Actions
  setStatus: (status: VTONStatus) => void;
  setJobId: (jobId: string) => void;
  setHumanImage: (url: string) => void;
  setGarmentImage: (url: string) => void;
  setOutfitItem: (type: keyof SelectedOutfit, url: string | null) => void;
  startVTON: (humanImageUrl: string, garmentImageUrl?: string) => void;
  startMultiStepVTON: (humanImageUrl: string, context?: VTONContext) => void;
  setProgress: (message: string) => void;
  setVTONResult: (url: string) => void;
  setVTONError: (message: string) => void;
  reset: () => void;
  resetOutfit: () => void;
}

export const useVTONStore = create<VTONState>()(
  persist(
    (set) => ({
      status: 'idle',
      activeContext: null,
      currentJobId: null,
      humanImageUrl: null,
      garmentImageUrl: null,
      selectedOutfit: { top: null, bottom: null, dress: null },
      resultImageUrl: null,
      errorMessage: null,
      progressMessage: null,

      setStatus: (status) => set({ status }),
      setJobId: (jobId) => set({ currentJobId: jobId }),
      setHumanImage: (url) => set({ humanImageUrl: url }),
      setGarmentImage: (url) => set({ garmentImageUrl: url }),
      setOutfitItem: (type, url) => set((state) => ({ 
          selectedOutfit: { ...state.selectedOutfit, [type]: url } 
      })),
      
      startVTON: (humanImageUrl, garmentImageUrl) => 
        set({ 
          status: 'pending', 
          activeContext: 'modal',
          humanImageUrl,
          garmentImageUrl: garmentImageUrl || null,
          resultImageUrl: null, 
          errorMessage: null,
          progressMessage: null
        }),

      startMultiStepVTON: (humanImageUrl, context = 'wardrobe') => 
        set({ 
          status: 'pending', 
          activeContext: context,
          humanImageUrl,
          garmentImageUrl: null,
          resultImageUrl: null, 
          errorMessage: null,
          progressMessage: "Đang khởi tạo chuỗi công việc..."
        }),
      
      setProgress: (message) => set({ progressMessage: message }),
        
      setVTONResult: (url) => 
        set({ 
          status: 'completed', 
          resultImageUrl: url, 
          errorMessage: null,
          progressMessage: "Đã hoàn thành!"
        }),
        
      setVTONError: (message) => 
        set({ 
          status: 'error', 
          errorMessage: message, 
          resultImageUrl: null,
          progressMessage: null
        }),
        
      reset: () =>
        set((state) => ({
          status: 'idle',
          activeContext: null,
          currentJobId: null,
          // Keep humanImageUrl and selectedOutfit when resetting the VTON modal state
          humanImageUrl: state.humanImageUrl,
          garmentImageUrl: null,
          resultImageUrl: null,
          errorMessage: null,
          progressMessage: null
        })),
        
      resetOutfit: () => set({ selectedOutfit: { top: null, bottom: null, dress: null } }),
    }),
    {
      name: 'vton-storage',
      // Lưu lại humanImageUrl và bộ đồ đang mix dang dở
      partialize: (state) => ({ 
          humanImageUrl: state.humanImageUrl,
          selectedOutfit: state.selectedOutfit
      }),
    }
  )
);