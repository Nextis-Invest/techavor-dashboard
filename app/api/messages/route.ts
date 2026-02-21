import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const intakeId = req.nextUrl.searchParams.get("intakeId")
  if (!intakeId) return NextResponse.json({ error: "intakeId required" }, { status: 400 })

  const messages = await prisma.projectMessage.findMany({
    where: { intakeId },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest) {
  const { intakeId, content, senderType, senderName, senderEmail } = await req.json()
  if (!intakeId || !content || !senderType || !senderEmail) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const message = await prisma.projectMessage.create({
    data: { intakeId, content, senderType, senderName, senderEmail }
  })
  return NextResponse.json({ message })
}
