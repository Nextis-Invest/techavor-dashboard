import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, hasPermission, corsHeaders } from "@/lib/api-auth"

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

/**
 * Find the pricing region for a country code
 * Priority: exact country match > default region (ROW)
 */
async function getRegionForCountry(countryCode: string | null) {
  if (!countryCode) {
    // Return default region if no country specified
    return prisma.pricingRegion.findFirst({
      where: { isDefault: true },
    })
  }

  // First, try to find a region that includes this country
  const region = await prisma.pricingRegion.findFirst({
    where: {
      countries: {
        has: countryCode.toUpperCase(),
      },
    },
  })

  if (region) {
    return region
  }

  // Fallback to default region
  return prisma.pricingRegion.findFirst({
    where: { isDefault: true },
  })
}

export async function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin") || undefined)

  // Validate API key
  const validation = await validateApiKey(request)

  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401, headers }
    )
  }

  if (!hasPermission(validation.apiKey!.permissions, "read")) {
    return NextResponse.json(
      { error: "Missing required permission: read" },
      { status: 403, headers }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get("country")

    // Get the pricing region for this country
    const region = await getRegionForCountry(country)

    // Get store settings (create default if not exists)
    let settings = await prisma.storeSettings.findFirst()

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          storeName: "Techavor Store",
          currency: "USD",
        },
      })
    }

    // Return only public configuration (never expose secret keys)
    // Stripe keys come from environment variables
    const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
    const stripeEnabled = !!process.env.STRIPE_SECRET_KEY

    // Use regional currency if available, otherwise store default
    const currency = region?.currency ?? settings.currency

    return NextResponse.json({
      success: true,
      config: {
        storeName: settings.storeName,
        storeUrl: settings.storeUrl,
        currency,
        stripe: {
          enabled: stripeEnabled,
          publishableKey: stripePublishableKey || null,
        },
        paypal: {
          enabled: settings.paypalEnabled,
          clientId: settings.paypalClientId,
        },
      },
      region: region ? {
        code: region.code,
        name: region.name,
        currency: region.currency,
      } : null,
    }, { headers })
  } catch (error) {
    console.error("Error fetching config:", error)
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500, headers }
    )
  }
}
