import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  try {
    // Get Stripe keys from environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error("Stripe not configured for webhooks")
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      )
    }

    // Get store settings for currency
    const settings = await prisma.storeSettings.findFirst()

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    })

    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeWebhookSecret
      )
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        console.log("Payment successful:", session.id)

        // Create order in database
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

        await prisma.order.create({
          data: {
            orderNumber,
            email: session.customer_email || session.customer_details?.email || "unknown@email.com",
            phone: session.customer_details?.phone,
            status: "CONFIRMED",
            paymentStatus: "PAID",
            subtotal: (session.amount_subtotal || 0) / 100,
            total: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || settings?.currency || "USD",
            notes: `Stripe Session: ${session.id}`,
            couponCode: session.metadata?.couponCode || null,
            // Create addresses
            shippingAddress: {
              create: {
                firstName: session.customer_details?.name?.split(" ")[0] || "Customer",
                lastName: session.customer_details?.name?.split(" ").slice(1).join(" ") || "",
                address1: session.customer_details?.address?.line1 || "N/A",
                address2: session.customer_details?.address?.line2 || null,
                city: session.customer_details?.address?.city || "N/A",
                state: session.customer_details?.address?.state || null,
                postalCode: session.customer_details?.address?.postal_code || "N/A",
                country: session.customer_details?.address?.country || "US",
                phone: session.customer_details?.phone || "",
              },
            },
            billingAddress: {
              create: {
                firstName: session.customer_details?.name?.split(" ")[0] || "Customer",
                lastName: session.customer_details?.name?.split(" ").slice(1).join(" ") || "",
                address1: session.customer_details?.address?.line1 || "N/A",
                address2: session.customer_details?.address?.line2 || null,
                city: session.customer_details?.address?.city || "N/A",
                state: session.customer_details?.address?.state || null,
                postalCode: session.customer_details?.address?.postal_code || "N/A",
                country: session.customer_details?.address?.country || "US",
                phone: session.customer_details?.phone || "",
                isBilling: true,
                isShipping: false,
              },
            },
          },
        })

        console.log("Order created:", orderNumber)
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("Checkout session expired:", session.id)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("Payment failed:", paymentIntent.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
