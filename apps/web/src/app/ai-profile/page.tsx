"use client"

import React, { useState } from "react"
import { ImageUploader } from "../../components/ui/ImageUploader"
import { useVTONStore } from "../../store/useVTONStore"

export default function AiProfilePage() {
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [gender, setGender] = useState("unisex")
  const [file, setFile] = useState<File | null>(null)
  
  const { setStatus, status, setHumanImage } = useVTONStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      alert("Please upload a base body image")
      return
    }

    setStatus("uploading")

    try {
      const formData = new FormData()
      formData.append("human_image", file)
      formData.append("height", height)
      formData.append("weight", weight)
      formData.append("gender", gender)

      // Need to adjust URL to wherever Medusa is running (typically localhost:9000)
      const res = await fetch("http://localhost:9000/v1/ai-profile", {
        method: "POST",
        body: formData,
        // include any auth headers if needed
      })

      if (!res.ok) {
        throw new Error("Failed to upload profile")
      }

      const data = await res.json()
      
      setHumanImage(data.data.processed_image_url)
      setStatus("completed")
      alert("AI Profile created successfully!")
    } catch (error) {
      console.error(error)
      setStatus("error")
      alert("Error saving profile.")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Setup AI Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Body Image (Full body, well-lit)
          </label>
          <ImageUploader onImageCropped={(croppedFile) => setFile(croppedFile)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
            <input 
              type="number" 
              required
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
              placeholder="170"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
            <input 
              type="number" 
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
              placeholder="60"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select 
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          >
            <option value="unisex">Unisex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={status === "uploading"}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
        >
          {status === "uploading" ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  )
}
