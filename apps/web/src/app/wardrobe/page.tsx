"use client"

import React, { useEffect, useState } from "react"
import { ImageUploader } from "../../components/ui/ImageUploader"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { useVTONStore } from "../../store/useVTONStore"
import { Camera, X, Play, Trash2 } from "lucide-react"

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

  const { selectedOutfit, setOutfitItem, startMultiStepVTON, humanImageUrl, status, progressMessage, resultImageUrl } = useVTONStore()

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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa trang phục này không?")) return;
    
    try {
      const res = await fetch(`http://localhost:9000/v1/user/garments/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        const deletedItem = garments.find(g => g.id === id);
        setGarments(prev => prev.filter(g => g.id !== id));
        
        // Remove from current mannequin if it's there
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
      
      await fetchGarments() // Refresh list
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
          // Simple validation
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
          alert("Vui lòng kéo thả ít nhất 1 món đồ vào người mẫu.");
          return;
      }

      startMultiStepVTON(humanImageUrl);

      try {
          const res = await fetch("http://localhost:9000/v1/vton/jobs", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({
                  human_image_url: humanImageUrl,
                  garments: garmentsToProcess,
                  user_id: "mock-customer-id" // To match the mock user
              })
          });

          if (!res.ok) {
              throw new Error("Failed to start VTON job");
          }
      } catch (err) {
          console.error(err);
          alert("Có lỗi xảy ra khi bắt đầu ghép đồ.");
      }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 mt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mix & Match Workspace</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          Add Garment
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Inventory Pane */}
          <div className="col-span-2 bg-gray-50 p-6 rounded-xl border">
            <h2 className="text-xl font-semibold mb-4">My Wardrobe</h2>
            {isLoading ? (
              <p>Loading your closet...</p>
            ) : garments.length === 0 ? (
              <p className="text-gray-500">Your wardrobe is empty.</p>
            ) : (
              <Droppable droppableId="inventory" direction="horizontal" isDropDisabled={true}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    className="flex flex-wrap gap-4"
                  >
                    {garments.map((g, index) => (
                      <Draggable key={g.id} draggableId={g.id} index={index}>
                        {(provided) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="w-32 h-40 border rounded-lg overflow-hidden relative group bg-white cursor-grab active:cursor-grabbing shadow-sm"
                          >
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Ngăn drag
                                handleDelete(g.id);
                              }}
                              className="absolute top-1 right-1 p-1.5 bg-white/90 hover:bg-red-50 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                              title="Xóa trang phục"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="h-full flex items-center justify-center p-2">
                              <img 
                                src={`http://localhost:9000${g.image_url}`} 
                                alt="Garment" 
                                className="max-h-full object-contain pointer-events-none"
                              />
                            </div>
                            <div className="p-1 bg-black text-white text-[10px] font-medium uppercase tracking-wider absolute bottom-0 left-0 right-0 text-center opacity-80">
                              {g.category.replace("_", " ")}
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

          {/* Mannequin / Workspace Pane */}
          <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">Mannequin</h2>
            
            <div className="w-full max-w-sm flex flex-col gap-4 relative">
                
                {/* Result Overlay */}
                {(status === 'pending' || status === 'processing_next_step' || status === 'completed') && (
                    <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center p-4 border rounded-xl">
                        {status === 'completed' && resultImageUrl ? (
                            <>
                                <img src={resultImageUrl} alt="VTON Result" className="w-full h-auto rounded-lg shadow-md mb-4" />
                                <button onClick={() => useVTONStore.getState().reset()} className="px-4 py-2 border rounded-md">Mix lại</button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                                <p className="text-center font-medium animate-pulse">{progressMessage || "Đang xử lý..."}</p>
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
                            className={`w-full h-40 border-2 border-dashed rounded-xl flex items-center justify-center relative transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300'}`}
                        >
                            {selectedOutfit.top ? (
                                <>
                                    <img src={`http://localhost:9000${selectedOutfit.top}`} className="h-full object-contain p-2" />
                                    <button onClick={() => setOutfitItem('top', null)} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-red-50 text-red-500"><X size={16} /></button>
                                </>
                            ) : (
                                <span className="text-gray-400 text-sm font-medium">Drop Top Here</span>
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
                            className={`w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center relative transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-300'}`}
                        >
                            {selectedOutfit.bottom ? (
                                <>
                                    <img src={`http://localhost:9000${selectedOutfit.bottom}`} className="h-full object-contain p-2" />
                                    <button onClick={() => setOutfitItem('bottom', null)} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-red-50 text-red-500"><X size={16} /></button>
                                </>
                            ) : (
                                <span className="text-gray-400 text-sm font-medium">Drop Bottom Here</span>
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                
                {/* OR Dress Slot Overlay (Simplification: if dress is selected, hide top/bottom) */}
                 <Droppable droppableId="dress">
                    {(provided, snapshot) => (
                        <div 
                            ref={provided.innerRef} 
                            {...provided.droppableProps}
                            className={`w-full h-32 border-2 border-dashed rounded-xl flex items-center justify-center relative transition-colors ${snapshot.isDraggingOver ? 'bg-pink-50 border-pink-400' : 'bg-gray-50 border-gray-300'}`}
                        >
                             {selectedOutfit.dress ? (
                                <>
                                    <img src={`http://localhost:9000${selectedOutfit.dress}`} className="h-full object-contain p-2" />
                                    <button onClick={() => setOutfitItem('dress', null)} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-red-50 text-red-500"><X size={16} /></button>
                                </>
                            ) : (
                                <span className="text-gray-400 text-sm font-medium">Or Drop Dress Here</span>
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>

            <button 
                onClick={handleStartVTON}
                className="mt-8 w-full py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
                <Play fill="currentColor" size={20} />
                START VTON
            </button>
            {!humanImageUrl && <p className="text-red-500 text-xs mt-2 text-center">Requires AI Profile setup first</p>}
          </div>

        </div>
      </DragDropContext>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload New Garment</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <ImageUploader onImageCropped={setFile} />
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                >
                  <option value="upper_body">Top / Upper Body</option>
                  <option value="lower_body">Bottom / Lower Body</option>
                  <option value="dress">Dress / One-piece</option>
                  <option value="accessory">Accessory</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả ngắn (giúp AI gợi ý tốt hơn)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm"
                  rows={2}
                  placeholder="Ví dụ: Áo thun cotton màu trắng tay ngắn đi chơi mùa hè"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!file || isUploading}
                  className="flex-1 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {isUploading ? "Processing..." : "Upload & Remove BG"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
