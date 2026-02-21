import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate a unique order number
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NS${year}${month}${day}${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items,
      customer,
      shipping,
      notes,
      subtotal,
      shippingCost,
      total,
      paymentMethod,
    } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Le panier est vide' },
        { status: 400 }
      );
    }

    if (!customer?.firstName || !customer?.lastName || !customer?.phone) {
      return NextResponse.json(
        { error: 'Informations client incompletes' },
        { status: 400 }
      );
    }

    if (!shipping?.address || !shipping?.city) {
      return NextResponse.json(
        { error: 'Adresse de livraison incomplete' },
        { status: 400 }
      );
    }

    // Generate unique order number
    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.order.findUnique({
        where: { orderNumber },
      });
      if (!existing) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    // Create shipping address
    const shippingAddress = await prisma.address.create({
      data: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        address1: shipping.address,
        city: shipping.city,
        postalCode: shipping.postalCode || '',
        country: 'MA',
      },
    });

    // Create billing address (same as shipping for COD)
    const billingAddress = await prisma.address.create({
      data: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        address1: shipping.address,
        city: shipping.city,
        postalCode: shipping.postalCode || '',
        country: 'MA',
        isBilling: true,
        isShipping: false,
      },
    });

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        email: customer.email || `${customer.phone}@nassima.ma`,
        phone: customer.phone,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        fulfillmentStatus: 'UNFULFILLED',
        paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'CASH',
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        subtotal: subtotal,
        shippingAmount: shippingCost,
        taxAmount: 0,
        discountAmount: 0,
        total: total,
        customerNotes: notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            sku: item.productId, // Use productId as SKU if not provided
            quantity: item.quantity,
            price: item.price,
            taxAmount: 0,
            discountAmount: 0,
            total: item.price * item.quantity,
            image: item.image,
          })),
        },
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    // TODO: Send SMS notification to customer
    // TODO: Send email notification to admin

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la commande' },
      { status: 500 }
    );
  }
}

// GET /api/orders - List orders (admin only, would need auth)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber');

    if (orderNumber) {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: true,
          shippingAddress: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Commande non trouvee' },
          { status: 404 }
        );
      }

      return NextResponse.json({ order });
    }

    // Return recent orders (would need auth in production)
    const orders = await prisma.order.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des commandes' },
      { status: 500 }
    );
  }
}
