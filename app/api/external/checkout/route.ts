import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, hasPermission, corsHeaders } from "@/lib/api-auth"
import Stripe from "stripe"

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

interface CheckoutItem {
  name: string
  description?: string
  price: number // in cents
  quantity: number
  image?: string
}

interface CheckoutRequest {
  items: CheckoutItem[]
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  metadata?: Record<string, string>
  couponCode?: string
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin") || undefined)

  // Validate API key
  const validation = await validateApiKey(request)

  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401, headers }
    )
  }

  if (!hasPermission(validation.apiKey!.permissions, "checkout")) {
    return NextResponse.json(
      { error: "Missing required permission: checkout" },
      { status: 403, headers }
    )
  }

  try {
    // Get store settings
    const settings = await prisma.storeSettings.findFirst()

    if (!settings) {
      return NextResponse.json(
        { error: "Store not configured" },
        { status: 500, headers }
      )
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500, headers }
      )
    }

    // Parse request body
    const body: CheckoutRequest = await request.json()

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400, headers }
      )
    }

    if (!body.successUrl || !body.cancelUrl) {
      return NextResponse.json(
        { error: "Missing successUrl or cancelUrl" },
        { status: 400, headers }
      )
    }

    // Initialize Stripe with environment variable
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    })

    // Calculate discount if coupon provided
    let discountPercent = 0
    if (body.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: body.couponCode.toUpperCase(),
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      })

      if (coupon && coupon.type === "PERCENTAGE") {
        discountPercent = Number(coupon.value)
      }
    }

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = body.items.map((item) => {
      let unitAmount = item.price

      // Apply discount
      if (discountPercent > 0) {
        unitAmount = Math.round(unitAmount * (1 - discountPercent / 100))
      }

      return {
        price_data: {
          currency: settings.currency.toLowerCase(),
          product_data: {
            name: item.name,
            description: item.description,
            images: item.image ? [item.image] : undefined,
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      }
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
      customer_email: body.customerEmail,
      metadata: {
        ...body.metadata,
        couponCode: body.couponCode || "",
        discountPercent: discountPercent.toString(),
        apiKeyName: validation.apiKey!.name,
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    }, { headers })
  } catch (error) {
    console.error("Checkout error:", error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers }
      )
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500, headers }
    )
  }
}
