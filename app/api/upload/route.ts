import { NextRequest, NextResponse } from "next/server"
import { uploadBase64Image, generateUniqueFilename } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          return {
            success: false,
            error: `Invalid file type: ${file.type}`,
            filename: file.name,
          }
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
          return {
            success: false,
            error: "File too large (max 10MB)",
            filename: file.name,
          }
        }

        try {
          // Convert file to base64
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64Data = buffer.toString("base64")

          // Generate unique filename
          const uniqueFilename = generateUniqueFilename("product")

          // Upload to MinIO
          const result = await uploadBase64Image(
            base64Data,
            file.type,
            `products/${uniqueFilename}`
          )

          return {
            ...result,
            filename: file.name,
          }
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          return {
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
            filename: file.name,
          }
        }
      })
    )

    const successful = uploadResults.filter((r) => r.success)
    const failed = uploadResults.filter((r) => !r.success)

    return NextResponse.json({
      success: failed.length === 0,
      uploaded: successful.map((r) => ({
        url: r.url,
        filename: r.filename,
      })),
      failed: failed.map((r) => ({
        filename: r.filename,
        error: r.error,
      })),
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    )
  }
}
