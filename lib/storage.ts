/**
 * Storage utilities for file uploads
 */

import { uploadFile } from "./minio"

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "public"
const getPublicUrlBase = () => {
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
  const endpoint = process.env.MINIO_ENDPOINT || ''
  return `${protocol}://${endpoint}`
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload a base64 encoded image to storage
 * @param base64Data Base64 encoded image data (without data URI prefix)
 * @param mimeType MIME type of the image (e.g., "image/png")
 * @param filename Filename without extension
 */
export async function uploadBase64Image(
  base64Data: string,
  mimeType: string,
  filename: string
): Promise<UploadResult> {
  try {
    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, "base64")

    // Determine file extension from MIME type
    const extension = getExtensionFromMimeType(mimeType)
    const objectName = `${filename}.${extension}`

    // Upload to MinIO/S3
    await uploadFile(BUCKET_NAME, objectName, buffer, mimeType, {
      "Cache-Control": "public, max-age=31536000",
      "x-amz-acl": "public-read",
    })

    // Construct public URL
    const url = `${getPublicUrlBase()}/${BUCKET_NAME}/${objectName}`

    return {
      success: true,
      url,
    }
  } catch (error) {
    console.error("Failed to upload image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    }
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/avif": "avif",
  }
  return mimeToExt[mimeType] || "png"
}

/**
 * Generate a unique filename for uploads
 */
export function generateUniqueFilename(prefix: string = "file"): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`
}
