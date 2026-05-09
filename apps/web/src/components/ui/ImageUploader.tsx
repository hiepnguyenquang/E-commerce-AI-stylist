"use client"

import React, { useRef, useState } from "react"
import imageCompression from "browser-image-compression"

interface ImageUploaderProps {
  onImageCropped: (file: File) => void
  aspectRatio?: number
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

export function ImageUploader({
  onImageCropped,
  aspectRatio = 3 / 4, // Default to 3:4 portrait
  maxSizeMB = 2,
  maxWidthOrHeight = 1024,
}: ImageUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    try {
      // 1. Crop to Aspect Ratio using Canvas
      const croppedBlob = await cropImageToAspectRatio(file, aspectRatio)
      const croppedFile = new File([croppedBlob], file.name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      })

      // 2. Compress Image
      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: maxWidthOrHeight,
        useWebWorker: true,
        fileType: "image/jpeg",
      }

      const compressedFile = await imageCompression(croppedFile, options)
      
      // Update preview and notify parent
      setPreviewUrl(URL.createObjectURL(compressedFile))
      onImageCropped(compressedFile as File)
    } catch (error) {
      console.error("Error processing image:", error)
      alert("Error processing image. Please try another one.")
    } finally {
      setIsProcessing(false)
    }
  }

  const cropImageToAspectRatio = (file: File, ratio: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        
        if (!ctx) {
          return reject(new Error("Failed to get canvas context"))
        }

        // Calculate dimensions to match aspect ratio
        let targetWidth = img.width
        let targetHeight = img.height

        if (img.width / img.height > ratio) {
          // Image is wider than target ratio
          targetWidth = img.height * ratio
        } else {
          // Image is taller than target ratio
          targetHeight = img.width / ratio
        }

        canvas.width = targetWidth
        canvas.height = targetHeight

        // Calculate crop start to center
        const startX = (img.width - targetWidth) / 2
        const startY = (img.height - targetHeight) / 2

        ctx.drawImage(
          img,
          startX, startY, targetWidth, targetHeight,
          0, 0, targetWidth, targetHeight
        )

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Canvas to Blob failed"))
          }
        }, "image/jpeg", 0.95)
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-4">
      <div 
        className="h-40 aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden relative bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors shadow-sm"
        onClick={() => fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-2">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-1" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-gray-500 font-medium">Click to upload</p>
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  )
}
