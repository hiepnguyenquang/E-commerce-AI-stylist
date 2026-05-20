"use client"

import React, { useState, useEffect } from "react"
import { ImageUploader } from "../../components/ui/ImageUploader"
import { useVTONStore } from "../../store/useVTONStore"

export default function AiProfilePage() {
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [gender, setGender] = useState("unisex")
  const [file, setFile] = useState<File | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isChangingImage, setIsChangingImage] = useState(false)
  
  const { setStatus, status, setHumanImage, humanImageUrl } = useVTONStore()

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true)
      try {
        const res = await fetch("http://localhost:9000/v1/ai-profile")
        if (res.ok) {
          const data = await res.json()
          if (data.data) {
            setHeight(data.data.height?.toString() || "")
            setWeight(data.data.weight?.toString() || "")
            setGender(data.data.gender || "unisex")
            setHumanImage(data.data.base_body_image_url || null)
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile", error)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [setHumanImage])

  const getFullImageUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!humanImageUrl && !file) {
      alert("Vui lòng tải lên ảnh toàn thân của bạn.")
      return
    }

    setStatus("uploading")

    try {
      const formData = new FormData()
      if (file) {
        formData.append("human_image", file)
      }
      formData.append("height", height)
      formData.append("weight", weight)
      formData.append("gender", gender)

      const res = await fetch("http://localhost:9000/v1/ai-profile", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Failed to upload/update profile")
      }

      const data = await res.json()
      
      if (data.data.processed_image_url) {
        setHumanImage(data.data.processed_image_url)
      }
      setStatus("completed")
      setIsChangingImage(false)
      alert("Hồ sơ AI đã được cập nhật thành công!")
    } catch (error) {
      console.error(error)
      setStatus("error")
      alert("Đã xảy ra lỗi khi lưu hồ sơ.")
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="h-[calc(100vh-80px)] flex justify-center items-center bg-zinc-50/50">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-zinc-50/50 flex flex-col p-4 sm:p-6 font-sans overflow-hidden">
      <div className="w-full h-full flex-1 bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Column: Image */}
        <div className="flex-1 md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-zinc-100 bg-zinc-50/50 flex flex-col overflow-y-auto">
          <label className="block text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4">
            Ảnh cơ thể (Toàn thân)
          </label>
          
          <div className="flex-1 flex flex-col justify-center min-h-[300px]">
            {humanImageUrl && !isChangingImage ? (
              <div className="flex flex-col items-center w-full h-full justify-center">
                <div className="relative w-full max-w-sm aspect-[3/4] bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mb-6 group">
                  <img 
                    src={getFullImageUrl(humanImageUrl)} 
                    alt="Profile Body" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsChangingImage(true)}
                  className="px-6 py-2.5 bg-white border border-zinc-200 rounded-full shadow-sm text-xs font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-all uppercase tracking-wider"
                >
                  Thay đổi ảnh
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full max-w-sm mx-auto flex flex-col h-full justify-center">
                <div className="bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm">
                  <ImageUploader onImageCropped={(croppedFile) => setFile(croppedFile)} />
                </div>
                {humanImageUrl && isChangingImage && (
                  <div className="text-center mt-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setFile(null);
                        setIsChangingImage(false);
                      }}
                      className="text-xs font-medium text-red-500 hover:text-red-600 hover:underline transition-all"
                    >
                      Hủy thay đổi
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="flex-1 md:w-1/2 p-8 lg:p-12 flex flex-col bg-white overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col h-full justify-center space-y-8 max-w-md mx-auto w-full">
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Chiều cao (cm)</label>
                <input 
                  type="number" 
                  required
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-2xl border-zinc-200 bg-zinc-50 shadow-inner border p-4 text-[15px] font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 outline-none transition-all"
                  placeholder="170"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Cân nặng (kg)</label>
                <input 
                  type="number" 
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-2xl border-zinc-200 bg-zinc-50 shadow-inner border p-4 text-[15px] font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 outline-none transition-all"
                  placeholder="60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Giới tính</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-2xl border-zinc-200 bg-zinc-50 shadow-inner border p-4 text-[15px] font-medium text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 outline-none transition-all cursor-pointer"
              >
                <option value="unisex">Unisex (Phi giới tính)</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div className="pt-6 mt-auto border-t border-zinc-100">
              <button 
                type="submit" 
                disabled={status === "uploading"}
                className="w-full py-4 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:bg-zinc-800 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {status === "uploading" ? "Đang xử lý..." : "Lưu Hồ Sơ"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
