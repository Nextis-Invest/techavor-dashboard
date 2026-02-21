"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, X, Image as ImageIcon, Loader2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { toast } from "sonner"

export interface UploadedImage {
  url: string
  altText: string
}

interface ImageUploaderProps {
  images: UploadedImage[]
  onImagesChange: (images: UploadedImage[]) => void
  maxImages?: number
  className?: string
  productName?: string
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  className,
  productName = "",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const draggedIndexRef = useRef<number | null>(null)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const uploadFiles = async (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} n'est pas une image valide`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 10MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const remainingSlots = maxImages - images.length
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images autorisees`)
      return
    }

    const filesToUpload = validFiles.slice(0, remainingSlots)
    if (filesToUpload.length < validFiles.length) {
      toast.warning(
        `Seulement ${filesToUpload.length} image(s) seront uploadees (limite: ${maxImages})`
      )
    }

    setIsUploading(true)
    setUploadProgress(`Upload de ${filesToUpload.length} image(s)...`)

    try {
      const formData = new FormData()
      filesToUpload.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'upload")
      }

      if (result.uploaded && result.uploaded.length > 0) {
        const newImages: UploadedImage[] = result.uploaded.map(
          (item: { url: string; filename: string }) => ({
            url: item.url,
            altText: productName || item.filename,
          })
        )
        onImagesChange([...images, ...newImages])
        toast.success(`${result.uploaded.length} image(s) uploadee(s)`)
      }

      if (result.failed && result.failed.length > 0) {
        result.failed.forEach((item: { filename: string; error: string }) => {
          toast.error(`Echec pour ${item.filename}: ${item.error}`)
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'upload"
      )
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      await uploadFiles(files)
    },
    [images, maxImages, productName, onImagesChange]
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await uploadFiles(files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const handleImageDragStart = (index: number) => {
    draggedIndexRef.current = index
  }

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndexRef.current === null || draggedIndexRef.current === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndexRef.current]
    newImages.splice(draggedIndexRef.current, 1)
    newImages.splice(index, 0, draggedImage)
    draggedIndexRef.current = index
    onImagesChange(newImages)
  }

  const handleImageDragEnd = () => {
    draggedIndexRef.current = null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{uploadProgress}</p>
          </>
        ) : (
          <>
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Glissez vos images ici ou cliquez pour parcourir
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP jusqu&apos;a 10MB (max {maxImages} images)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              draggable
              onDragStart={() => handleImageDragStart(index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
              className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-move"
            >
              <img
                src={img.url}
                alt={img.altText}
                className="h-full w-full object-cover"
                loading="lazy"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(index)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Drag handle indicator */}
              <div className="absolute top-1 left-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Primary badge */}
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-medium">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isUploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
          <ImageIcon className="h-4 w-4" />
          <span>Aucune image ajoutee</span>
        </div>
      )}
    </div>
  )
}
