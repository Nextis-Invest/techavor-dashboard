import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    let settings = await prisma.storeSettings.findFirst()

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          storeName: "My Store",
          currency: "USD",
        },
      })
    }

    // Stripe config comes from environment variables
    const stripeConfig = {
      stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY ? "sk_****" : null, // Masked
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? "whsec_****" : null, // Masked
    }

    return NextResponse.json({
      ...settings,
      ...stripeConfig,
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    let settings = await prisma.storeSettings.findFirst()

    // Note: Stripe keys are managed via environment variables, not the database
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          storeName: body.storeName || "My Store",
          storeLogo: body.storeLogo,
          storeFavicon: body.storeFavicon,
          storeUrl: body.storeUrl,
          currency: body.currency || "USD",
        },
      })
    } else {
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: {
          storeName: body.storeName,
          storeLogo: body.storeLogo,
          storeFavicon: body.storeFavicon,
          storeUrl: body.storeUrl,
          currency: body.currency,
        },
      })
    }

    // Include Stripe config from env vars in response
    const stripeConfig = {
      stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY ? "sk_****" : null,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? "whsec_****" : null,
    }

    return NextResponse.json({
      ...settings,
      ...stripeConfig,
    })
  } catch (error) {
    console.error("Error saving settings:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
}
