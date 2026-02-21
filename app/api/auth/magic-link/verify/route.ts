import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email et code requis" },
        { status: 400 }
      )
    }

    // Find user with this code
    const user = await prisma.user.findFirst({
      where: {
        email,
        verificationToken: code,
        verificationTokenExpiry: {
          gte: new Date(),
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: "Code invalide ou expire" },
        { status: 400 }
      )
    }

    // Clear token and verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: null,
        verificationTokenExpiry: null,
        emailVerified: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      email: user.email,
    })
  } catch (error) {
    console.error("Code verify error:", error)
    return NextResponse.json(
      { message: "Une erreur est survenue" },
      { status: 500 }
    )
  }
}
