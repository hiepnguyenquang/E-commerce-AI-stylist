"use client"

import React, { useEffect, useState } from "react"
import { ImageUploader } from "../../components/ui/ImageUploader"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { useVTONStore } from "../../store/useVTONStore"
import { useVTONService } from "../../hooks/useVTONService"
import { Camera, X, Play, Trash2, Plus, Sparkles } from "lucide-react"

interface Garment {
  id: string;
  image_url: string;
  category: string;
  vector_status: string;
}

export default function WardrobePage() {
  const [garments, setGarments] = useState<Garment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState("upper_body")
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'garments' | 'outfits'>('garments')
  const [isSavingResult, setIsSavingResult] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const { selectedOutfit, setOutfitItem, humanImageUrl, status, progressMessage, resultImageUrl, activeContext } = useVTONStore()
  const vtonService = useVTONService("mock-customer-id")

  const fetchGarments = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("http://localhost:9000/v1/user/assets")
      if (res.ok) {
        const data = await res.json()
        setGarments(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch garments", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGarments()
  }, [])

  const handleSaveResult = async () => {
    if (!resultImageUrl) return;
    setIsSavingResult(true);
    try {
      const res = await fetch("http://localhost:9000/v1/user/garments/vton-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: resultImageUrl,
          selectedOutfit
        })
      });
      if (res.ok) {
        alert("Đã lưu kết quả vào bộ sưu tập Outfit!");
        await fetchGarments();
      } else {
        const data = await res.json();
        alert(data.message || "Lỗi khi lưu kết quả.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu kết quả.");
    } finally {
      setIsSavingResult(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa trang phục này không?")) return;
    
    try {
      const res = await fetch(`http://localhost:9000/v1/user/garments/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        const deletedItem = garments.find(g => g.id === id);
        setGarments(prev => prev.filter(g => g.id !== id));
        
        if (deletedItem) {
          if (selectedOutfit.top === deletedItem.image_url) setOutfitItem('top', null);
          if (selectedOutfit.bottom === deletedItem.image_url) setOutfitItem('bottom', null);
          if (selectedOutfit.dress === deletedItem.image_url) setOutfitItem('dress', null);
        }
      } else {
        const err = await res.json();
        alert(err.message || "Xóa thất bại");
      }
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi xóa");
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("garment_image", file)
      formData.append("category", category)
      if (description) {
        formData.append("description", description)
      }

      const res = await fetch("http://localhost:9000/v1/user/garments", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")
      
      await fetchGarments()
      setIsModalOpen(false)
      setFile(null)
      setDescription("")
    } catch (error) {
      console.error(error)
      alert("Failed to upload garment.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceId = result.source.droppableId;
    const destId = result.destination.droppableId;

    if (sourceId === "inventory" && (destId === "top" || destId === "bottom" || destId === "dress")) {
      const item = garments.find(g => g.id === result.draggableId);
      if (item) {
          if (destId === 'top' && item.category !== 'upper_body') return;
          if (destId === 'bottom' && item.category !== 'lower_body') return;
          if (destId === 'dress' && item.category !== 'dress') return;
          
          setOutfitItem(destId as 'top'|'bottom'|'dress', item.image_url);
      }
    }
  }

  const handleStartVTON = async () => {
      if (!humanImageUrl) {
          alert("Vui lòng thiết lập AI Profile (Ảnh người mẫu) trước khi thử đồ.");
          return;
      }
      
      const garmentsToProcess = [];
      if (selectedOutfit.dress) {
          garmentsToProcess.push({ url: selectedOutfit.dress, type: 'dress' });
      } else {
          if (selectedOutfit.top) garmentsToProcess.push({ url: selectedOutfit.top, type: 'upper_body' });
          if (selectedOutfit.bottom) garmentsToProcess.push({ url: selectedOutfit.bottom, type: 'lower_body' });
      }

      if (garmentsToProcess.length === 0) {
          alert("Vui lòng kéo thả ít nhất 1 món đồ vào không gian thử đồ.");
          return;
      }

      await vtonService.startMultiStepTryOn(humanImageUrl, garmentsToProcess);
  }

  const displayedItems = garments.filter(g => activeTab === 'outfits' ? g.category === 'outfit' : g.category !== 'outfit');

  return (
    <div className="relative h-[calc(100vh-80px)] bg-zinc-50/50 overflow-hidden font-sans flex flex-col items-center">
      <div className="w-full px-4 sm:px-6 relative z-10 flex flex-col h-full pt-6 pb-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            
            {/* Inventory Pane */}
            <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-[2rem] border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-zinc-100 pb-4 shrink-0">
                <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
                  Tủ đồ cá nhân <Sparkles className="text-zinc-400 w-5 h-5 hidden sm:block" />
                </h2>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="flex bg-zinc-50 rounded-full p-1 border border-zinc-100 shadow-inner flex-1 sm:flex-none">
                    <button 
                        onClick={() => setActiveTab('garments')} 
                        className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${activeTab === 'garments' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-800'}`}
                    >Trang phục</button>
                    <button 
                        onClick={() => setActiveTab('outfits')} 
                        className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${activeTab === 'outfits' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-800'}`}
                    >Đã lưu</button>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 bg-zinc-900 text-white text-[10px] sm:text-xs font-bold tracking-wide uppercase rounded-full hover:bg-zinc-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <Plus size={14} /> Thêm đồ
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 pb-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full opacity-50">
                    <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
                  </div>
                ) : displayedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                      <Sparkles className="w-8 h-8 text-zinc-300" />
                    </div>
                    <p className="text-zinc-500 font-medium text-[15px]">{activeTab === 'outfits' ? "Bạn chưa lưu outfit nào." : "Tủ đồ của bạn đang trống."}</p>
                    {activeTab === 'garments' && (
                      <button onClick={() => setIsModalOpen(true)} className="mt-4 text-sm font-bold text-zinc-900 hover:text-zinc-600 hover:scale-105 transition-all">
                        Tải lên ngay &rarr;
                      </button>
                    )}
                  </div>
                ) : (
                  <Droppable droppableId="inventory" direction="horizontal" isDropDisabled={true}>
                    {(provided) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className="flex flex-wrap gap-5"
                      >
                        {displayedItems.map((g, index) => (
                          <Draggable key={g.id} draggableId={g.id} index={index} isDragDisabled={activeTab === 'outfits'}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`w-32 h-44 bg-white rounded-2xl overflow-hidden relative group transition-all duration-300 border border-zinc-100 shadow-sm hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:border-zinc-300 ${snapshot.isDragging ? 'shadow-2xl scale-110 rotate-3 z-50 ring-4 ring-zinc-900/10' : 'hover:-translate-y-1'} ${activeTab === 'outfits' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
                                onClick={(e) => {
                                    if (activeTab === 'outfits') {
                                        e.stopPropagation();
                                        setPreviewImage(g.image_url.startsWith('http') ? g.image_url : `http://localhost:9000${g.image_url}`)
                                    }
                                }}
                              >
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(g.id);
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur hover:bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm scale-75 group-hover:scale-100"
                                  title="Xóa"
                                >
                                  <Trash2 size={12} />
                                </button>
                                <div className="h-full w-full p-3 flex items-center justify-center bg-zinc-50 group-hover:bg-white transition-colors">
                                  <img 
                                    src={g.image_url.startsWith('http') ? g.image_url : `http://localhost:9000${g.image_url}`} 
                                    alt="Garment" 
                                    className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 py-1.5 text-center bg-white/90 backdrop-blur-sm border-t border-zinc-100">
                                  <span className="text-[10px] font-bold text-zinc-800 tracking-widest uppercase">
                                    {g.category.replace("_", " ")}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            </div>

            {/* Workspace Pane */}
            <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-[2rem] border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-start h-full overflow-y-auto relative">
              
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight mb-6 w-full text-center relative z-10">Không gian Thử đồ</h2>
              
              <div className="w-full flex flex-col gap-5 flex-1 relative z-10">
                  
                  {/* Result Overlay */}
                  {activeContext === 'wardrobe' && (status === 'pending' || status === 'processing_next_step' || status === 'completed') && (
                      <div className="absolute inset-[-10px] bg-white/90 backdrop-blur-md z-30 flex flex-col items-center p-6 rounded-[2rem] border border-zinc-100 shadow-xl transition-all duration-300 opacity-100 animate-in fade-in zoom-in-95">
                          {status === 'completed' && resultImageUrl ? (
                              <div className="flex flex-col h-full w-full">
                                  <div className="flex-1 flex items-center justify-center overflow-hidden bg-zinc-50 rounded-2xl mb-6 p-2 border border-zinc-100 shadow-inner relative group">
                                    <img src={resultImageUrl} alt="VTON Result" className="max-h-full w-auto object-contain rounded-xl drop-shadow-md hover:scale-[1.02] transition-transform duration-300" />
                                  </div>
                                  <div className="flex gap-3 w-full mt-auto">
                                      <button onClick={() => useVTONStore.getState().reset()} className="flex-1 px-4 py-3.5 text-[12px] font-bold text-zinc-700 bg-white border border-zinc-200 shadow-sm rounded-full hover:bg-zinc-50 hover:-translate-y-0.5 transition-all">MIX LẠI</button>
                                      <button onClick={handleSaveResult} disabled={isSavingResult} className="flex-1 px-4 py-3.5 text-[12px] font-bold bg-zinc-900 text-white rounded-full shadow-md hover:bg-zinc-800 hover:-translate-y-0.5 disabled:opacity-50 transition-all uppercase tracking-wider">
                                          {isSavingResult ? "ĐANG LƯU..." : "LƯU KẾT QUẢ"}
                                      </button>
                                  </div>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center h-full w-full">
                                  <div className="relative w-16 h-16 mb-6">
                                    <div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-zinc-900 rounded-full border-t-transparent animate-spin"></div>
                                    <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-zinc-400 animate-pulse" />
                                  </div>
                                  <h3 className="text-lg font-bold text-zinc-800 mb-2">Đang xử lý...</h3>
                                  <p className="text-center text-xs font-medium text-zinc-500 animate-pulse tracking-wide">{progressMessage || "AI đang tổng hợp dữ liệu"}</p>
                              </div>
                          )}
                      </div>
                  )}

                  {/* Top Slot */}
                  <Droppable droppableId="top">
                      {(provided, snapshot) => (
                          <div 
                              ref={provided.innerRef} 
                              {...provided.droppableProps}
                              className={`w-full h-32 border border-dashed rounded-[1.5rem] flex items-center justify-center relative transition-all duration-300 overflow-hidden ${snapshot.isDraggingOver ? 'bg-zinc-100 border-zinc-400 scale-[1.02]' : 'bg-zinc-50 border-zinc-200 hover:bg-white hover:border-zinc-300'}`}
                          >
                              {selectedOutfit.top ? (
                                  <>
                                      <img src={selectedOutfit.top.startsWith('http') ? selectedOutfit.top : `http://localhost:9000${selectedOutfit.top}`} className="h-full object-contain p-2 drop-shadow-sm scale-105" />
                                      <button onClick={() => setOutfitItem('top', null)} className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full shadow hover:bg-red-50 hover:text-red-500 text-red-400 transition-all"><X size={12} /></button>
                                  </>
                              ) : (
                                  <span className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase flex flex-col items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-300"><Plus size={14}/></div>
                                    Kéo Áo
                                  </span>
                              )}
                              {provided.placeholder}
                          </div>
                      )}
                  </Droppable>

                  {/* Bottom Slot */}
                  <Droppable droppableId="bottom">
                      {(provided, snapshot) => (
                          <div 
                              ref={provided.innerRef} 
                              {...provided.droppableProps}
                              className={`w-full h-36 border border-dashed rounded-[1.5rem] flex items-center justify-center relative transition-all duration-300 overflow-hidden ${snapshot.isDraggingOver ? 'bg-zinc-100 border-zinc-400 scale-[1.02]' : 'bg-zinc-50 border-zinc-200 hover:bg-white hover:border-zinc-300'}`}
                          >
                              {selectedOutfit.bottom ? (
                                  <>
                                      <img src={selectedOutfit.bottom.startsWith('http') ? selectedOutfit.bottom : `http://localhost:9000${selectedOutfit.bottom}`} className="h-full object-contain p-2 drop-shadow-sm scale-105" />
                                      <button onClick={() => setOutfitItem('bottom', null)} className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full shadow hover:bg-red-50 hover:text-red-500 text-red-400 transition-all"><X size={12} /></button>
                                  </>
                              ) : (
                                  <span className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase flex flex-col items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-300"><Plus size={14}/></div>
                                    Kéo Quần
                                  </span>
                              )}
                              {provided.placeholder}
                          </div>
                      )}
                  </Droppable>
                  
                  {/* Dress Slot */}
                   <Droppable droppableId="dress">
                      {(provided, snapshot) => (
                          <div 
                              ref={provided.innerRef} 
                              {...provided.droppableProps}
                              className={`w-full h-24 border border-dashed rounded-[1.5rem] flex items-center justify-center relative transition-all duration-300 overflow-hidden ${snapshot.isDraggingOver ? 'bg-zinc-100 border-zinc-400 scale-[1.02]' : 'bg-zinc-50 border-zinc-200 hover:bg-white hover:border-zinc-300'}`}
                          >
                               {selectedOutfit.dress ? (
                                  <>
                                      <img src={`http://localhost:9000${selectedOutfit.dress}`} className="h-full object-contain p-2 drop-shadow-sm scale-105" />
                                      <button onClick={() => setOutfitItem('dress', null)} className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full shadow hover:bg-red-50 hover:text-red-500 text-red-400 transition-all"><X size={12} /></button>
                                  </>
                              ) : (
                                  <span className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase flex flex-col items-center gap-1.5 text-center px-4">
                                    Hoặc Đầm (Váy liền)
                                  </span>
                              )}
                              {provided.placeholder}
                          </div>
                      )}
                  </Droppable>
              </div>

              <div className="w-full mt-6 relative z-10 shrink-0">
                <button 
                    onClick={handleStartVTON}
                    className="w-full py-4 bg-zinc-900 text-white text-[13px] font-bold tracking-widest uppercase rounded-full shadow-md hover:bg-zinc-800 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                    <Play fill="currentColor" size={14} className="group-hover:scale-110 transition-transform" />
                    Bắt đầu Mặc Thử
                </button>
                {!humanImageUrl && (
                  <div className="mt-3 p-2.5 bg-red-50 border border-red-100 rounded-xl text-center">
                    <p className="text-red-500 text-[11px] font-medium tracking-wide">Vui lòng thiết lập Hồ sơ AI trước</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </DragDropContext>

        {/* Upload Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white rounded-[2rem] p-8 sm:p-10 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-100 relative animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black tracking-tight text-zinc-900">Thêm trang phục</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpload} className="space-y-7">
                <div className="bg-white rounded-3xl p-2 border border-zinc-100 shadow-sm">
                  <ImageUploader onImageCropped={setFile} />
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Loại trang phục</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full rounded-2xl border-zinc-200 bg-zinc-50 shadow-inner border p-4 text-[15px] font-medium focus:bg-white focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 outline-none transition-all"
                    >
                      <option value="upper_body">Áo / Thân trên</option>
                      <option value="lower_body">Quần / Thân dưới</option>
                      <option value="dress">Đầm / Váy liền</option>
                      <option value="accessory">Phụ kiện</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Mô tả ngắn (Tuỳ chọn)</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="block w-full rounded-2xl border-zinc-200 bg-zinc-50 shadow-inner border p-4 text-[15px] font-medium focus:bg-white focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 outline-none transition-all resize-none"
                      rows={2}
                      placeholder="Ví dụ: Áo thun cotton màu trắng đi dạo phố"
                    ></textarea>
                  </div>
                </div>

                <div className="flex space-x-4 pt-6 border-t border-zinc-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 text-[14px] font-bold bg-zinc-100 text-zinc-600 rounded-full hover:bg-zinc-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={!file || isUploading}
                    className="flex-1 py-4 text-[14px] font-bold bg-zinc-900 text-white rounded-full shadow-md hover:bg-zinc-800 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
                  >
                    {isUploading ? "Đang tách nền..." : "Tải lên"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {previewImage && (
          <div className="fixed inset-0 bg-zinc-900/95 backdrop-blur-md flex items-center justify-center z-[9999] transition-opacity animate-in fade-in duration-200 pt-[100px] pb-10 px-4" onClick={() => setPreviewImage(null)}>
            <div className="relative animate-in zoom-in-95 duration-200 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 shrink-0" onClick={(e) => e.stopPropagation()}>
               <button 
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-rose-500 rounded-full text-white backdrop-blur-md transition-all z-[10000] cursor-pointer"
                >
                  <X size={20} strokeWidth={2.5} />
               </button>
               <img src={previewImage} alt="Enlarged Preview" className="max-w-[90vw] max-h-[75vh] object-contain block bg-zinc-800/50" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}