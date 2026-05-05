"use client"

import React, { useEffect, useState } from "react"
import { ImageUploader } from "../../components/ui/ImageUploader"

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
  const [isUploading, setIsUploading] = useState(false)

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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("garment_image", file)
      formData.append("category", category)

      const res = await fetch("http://localhost:9000/v1/user/garments", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")
      
      await fetchGarments() // Refresh list
      setIsModalOpen(false)
      setFile(null)
    } catch (error) {
      console.error(error)
      alert("Failed to upload garment. Make sure the backend is running and processing the background.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Wardrobe</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          Add Garment
        </button>
      </div>

      {isLoading ? (
        <p>Loading your closet...</p>
      ) : garments.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">Your wardrobe is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {garments.map((g) => (
            <div key={g.id} className="border rounded-lg overflow-hidden relative group">
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center p-2">
                <img 
                  src={`http://localhost:9000${g.image_url}`} 
                  alt="Garment" 
                  className="max-h-full object-contain"
                />
              </div>
              <div className="p-2 bg-white text-xs font-medium uppercase tracking-wider text-gray-500 absolute bottom-0 left-0 right-0 bg-opacity-90">
                {g.category.replace("_", " ")}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Upload New Garment</h2>
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
