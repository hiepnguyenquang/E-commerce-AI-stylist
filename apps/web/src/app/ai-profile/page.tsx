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
            // Assuming gender might be saved if we added it, but for now we fallback
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
    
    // Nếu không có ảnh cũ và cũng không chọn ảnh mới
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
      <div className="max-w-2xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Thiết Lập Hồ Sơ AI</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh cơ thể (Toàn thân, đủ sáng)
          </label>
          
          {humanImageUrl && !isChangingImage ? (
            <div className="flex flex-col items-center p-4 border rounded-md bg-gray-50">
              <img 
                src={getFullImageUrl(humanImageUrl)} 
                alt="Profile Body" 
                className="h-64 object-contain rounded-md shadow-sm mb-4" 
              />
              <button 
                type="button" 
                onClick={() => setIsChangingImage(true)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Thay đổi ảnh
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <ImageUploader onImageCropped={(croppedFile) => setFile(croppedFile)} />
              {humanImageUrl && isChangingImage && (
                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={() => {
                      setFile(null);
                      setIsChangingImage(false);
                    }}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Hủy thay đổi ảnh
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Chiều cao (cm)</label>
            <input 
              type="number" 
              required
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 font-medium"
              placeholder="170"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cân nặng (kg)</label>
            <input 
              type="number" 
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 font-medium"
              placeholder="60"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Giới tính</label>
          <select 
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 font-medium"
          >
            <option value="unisex">Unisex</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={status === "uploading"}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
        >
          {status === "uploading" ? "Đang xử lý..." : "Cập nhật Hồ sơ"}
        </button>
      </form>
    </div>
  )
}
