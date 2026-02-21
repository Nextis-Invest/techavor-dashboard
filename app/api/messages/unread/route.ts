import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const count = await prisma.projectMessage.count({
    where: { senderType: "CLIENT", readAt: null }
  })
  return NextResponse.json({ count })
}
