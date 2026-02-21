import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest) {
  const { intakeId } = await req.json()
  await prisma.projectMessage.updateMany({
    where: { intakeId, readAt: null, senderType: "CLIENT" },
    data: { readAt: new Date() }
  })
  return NextResponse.json({ ok: true })
}
