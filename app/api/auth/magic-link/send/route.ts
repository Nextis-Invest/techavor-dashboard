import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email, callbackUrl } = await req.json()

    if (!email) {
      return NextResponse.json(
        { message: "L'email est requis" },
        { status: 400 }
      )
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Create new user without password
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: null,
        },
      })
    }

    // Generate 4-digit code
    const code = generateCode()
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Save code to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: code,
        verificationTokenExpiry: codeExpiry,
      },
    })

    // Send email with code
    const { error } = await resend.emails.send({
      from: `Techavor <${process.env.RESEND_FROM_EMAIL}>`,
      to: [email],
      subject: "Votre code de connexion - Techavor",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111;">Techavor</h1>
              </div>

              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #111; text-align: center;">
                Votre code de connexion
              </h2>

              <p style="margin: 0 0 24px; color: #666; font-size: 16px; line-height: 1.6; text-align: center;">
                Entrez ce code pour vous connecter a votre compte Techavor.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; background-color: #f5f5f5; padding: 20px 40px; border-radius: 12px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #111;">
                  ${code}
                </div>
              </div>

              <p style="margin: 24px 0 0; color: #999; font-size: 14px; line-height: 1.5; text-align: center;">
                Ce code expire dans 15 minutes.<br>
                Si vous n'avez pas demande ce code, ignorez cet email.
              </p>

              <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">

              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                Pour des raisons de securite, ne partagez jamais ce code avec personne.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json(
        { message: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Code de connexion envoye",
      success: true,
    })
  } catch (error) {
    console.error("Magic link send error:", error)
    return NextResponse.json(
      { message: "Une erreur est survenue" },
      { status: 500 }
    )
  }
}
