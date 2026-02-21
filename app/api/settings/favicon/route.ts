import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { writeFile, unlink, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
  }
  return mimeToExt[mimeType] || "png"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, mimeType } = body

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Image and mimeType are required" },
        { status: 400 }
      )
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Remove data URI prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // Generate filename
    const extension = getExtensionFromMimeType(mimeType)
    const filename = `favicon.${extension}`
    const filePath = path.join(UPLOAD_DIR, filename)

    // Delete old favicon files
    const oldFiles = ["favicon.png", "favicon.jpg", "favicon.gif", "favicon.webp", "favicon.svg", "favicon.ico"]
    for (const oldFile of oldFiles) {
      const oldPath = path.join(UPLOAD_DIR, oldFile)
      if (existsSync(oldPath)) {
        await unlink(oldPath).catch(() => {})
      }
    }

    // Write new file
    await writeFile(filePath, buffer)

    // Public URL
    const url = `/uploads/${filename}`

    // Update store settings with favicon URL
    let settings = await prisma.storeSettings.findFirst()

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          storeName: "My Store",
          storeFavicon: url,
        },
      })
    } else {
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: {
          storeFavicon: url,
        },
      })
    }

    return NextResponse.json({
      success: true,
      url,
      settings,
    })
  } catch (error) {
    console.error("Error uploading favicon:", error)
    return NextResponse.json(
      { error: "Failed to upload favicon" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Delete favicon files
    const files = ["favicon.png", "favicon.jpg", "favicon.gif", "favicon.webp", "favicon.svg", "favicon.ico"]
    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file)
      if (existsSync(filePath)) {
        await unlink(filePath).catch(() => {})
      }
    }

    let settings = await prisma.storeSettings.findFirst()

    if (settings) {
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: {
          storeFavicon: null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Error removing favicon:", error)
    return NextResponse.json(
      { error: "Failed to remove favicon" },
      { status: 500 }
    )
  }
}
