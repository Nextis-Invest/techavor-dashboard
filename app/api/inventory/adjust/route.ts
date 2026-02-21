import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

// POST /api/inventory/adjust - Adjust stock levels
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const {
      productId,
      variantId,
      warehouseId,
      quantity,
      type,
      reason,
      reference,
    } = body

    if (!productId || quantity === undefined || !type) {
      return NextResponse.json(
        { error: "Product ID, quantity, and type are required" },
        { status: 400 }
      )
    }

    // Validate movement type
    const validTypes = ["IN", "OUT", "ADJUSTMENT", "TRANSFER", "RETURN", "DAMAGE", "LOSS"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid movement type" },
        { status: 400 }
      )
    }

    // Get or create default warehouse
    let warehouse = await prisma.warehouse.findFirst({
      where: warehouseId ? { id: warehouseId } : { isDefault: true },
    })

    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: {
          name: "Entrepot Principal",
          code: "MAIN",
          isDefault: true,
          isActive: true,
        },
      })
    }

    // Get or create inventory record
    let inventory = await prisma.inventory.findFirst({
      where: {
        productId,
        variantId: variantId || null,
        warehouseId: warehouse.id,
      },
    })

    if (!inventory) {
      inventory = await prisma.inventory.create({
        data: {
          productId,
          variantId: variantId || null,
          warehouseId: warehouse.id,
          quantity: 0,
          reservedQuantity: 0,
          lowStockThreshold: 10,
        },
      })
    }

    // Calculate new quantity based on movement type
    let newQuantity = inventory.quantity
    let quantityChange = quantity

    switch (type) {
      case "IN":
      case "RETURN":
        newQuantity += quantity
        break
      case "OUT":
      case "DAMAGE":
      case "LOSS":
        newQuantity -= quantity
        quantityChange = -quantity
        break
      case "ADJUSTMENT":
        // For adjustments, quantity is the new absolute value
        quantityChange = quantity - inventory.quantity
        newQuantity = quantity
        break
      case "TRANSFER":
        // Handle transfer separately
        newQuantity -= quantity
        quantityChange = -quantity
        break
    }

    // Prevent negative stock
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: "Stock insuffisant" },
        { status: 400 }
      )
    }

    // Update inventory and create movement record
    const [updatedInventory, movement] = await prisma.$transaction([
      prisma.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQuantity },
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
        },
      }),
      prisma.stockMovement.create({
        data: {
          inventoryId: inventory.id,
          type,
          quantity: quantityChange,
          reason: reason || null,
          reference: reference || null,
        },
      }),
    ])

    // Check for low stock alert
    if (newQuantity <= updatedInventory.lowStockThreshold) {
      // Create or update stock alert
      await prisma.stockAlert.upsert({
        where: {
          productId_variantId_warehouseId: {
            productId,
            variantId: variantId || "",
            warehouseId: warehouse.id,
          },
        },
        create: {
          productId,
          variantId: variantId || null,
          warehouseId: warehouse.id,
          currentQuantity: newQuantity,
          threshold: updatedInventory.lowStockThreshold,
          isResolved: false,
        },
        update: {
          currentQuantity: newQuantity,
          isResolved: false,
          notifiedAt: null,
        },
      })
    } else {
      // Resolve existing alert if stock is now sufficient
      await prisma.stockAlert.updateMany({
        where: {
          productId,
          variantId: variantId || null,
          warehouseId: warehouse.id,
          isResolved: false,
        },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      inventory: updatedInventory,
      movement,
    })
  } catch (error) {
    console.error("Error adjusting inventory:", error)
    return NextResponse.json(
      { error: "Failed to adjust inventory" },
      { status: 500 }
    )
  }
}, "admin")
