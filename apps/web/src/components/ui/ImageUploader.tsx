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
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto space-y-4">
      <div 
        className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden relative bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-6">
            <p className="text-gray-500 mb-2">Click to select an image</p>
            <p className="text-xs text-gray-400">Aspect Ratio: 3:4, Max: 2MB</p>
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
