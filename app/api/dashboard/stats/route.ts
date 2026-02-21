import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

// GET /api/dashboard/stats - Get dashboard statistics
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get orders stats
    const [
      totalOrders,
      pendingOrders,
      todayOrders,
      monthOrders,
      lastMonthOrders,
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalCustomers,
      monthCustomers,
      totalProducts,
      activeProducts,
      lowStockCount,
      recentOrders,
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),

      // Pending orders
      prisma.order.count({
        where: { status: "PENDING" },
      }),

      // Today's orders
      prisma.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),

      // This month's orders
      prisma.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // Last month's orders
      prisma.order.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Total revenue (completed orders)
      prisma.order.aggregate({
        where: {
          status: { in: ["DELIVERED", "SHIPPED"] },
        },
        _sum: { total: true },
      }),

      // This month's revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          status: { in: ["DELIVERED", "SHIPPED"] },
        },
        _sum: { total: true },
      }),

      // Last month's revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { in: ["DELIVERED", "SHIPPED"] },
        },
        _sum: { total: true },
      }),

      // Total customers
      prisma.user.count({
        where: { role: "CUSTOMER" },
      }),

      // New customers this month
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: startOfMonth },
        },
      }),

      // Total products
      prisma.product.count(),

      // Active products
      prisma.product.count({
        where: { status: "ACTIVE" },
      }),

      // Low stock items (where available quantity is at or below reorder point)
      prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM inventory
        WHERE quantity_available <= reorder_point AND reorder_point > 0
      ` as Promise<[{ count: number }]>,

      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
    ])

    // Calculate percentage changes
    const ordersChange = lastMonthOrders > 0
      ? Math.round(((monthOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : 0

    const revenueChange = (lastMonthRevenue._sum.total || 0) > 0
      ? Math.round(
          (((monthRevenue._sum.total || 0) - (lastMonthRevenue._sum.total || 0)) /
            (lastMonthRevenue._sum.total || 1)) *
            100
        )
      : 0

    return NextResponse.json({
      stats: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          today: todayOrders,
          month: monthOrders,
          change: ordersChange,
        },
        revenue: {
          total: totalRevenue._sum.total || 0,
          month: monthRevenue._sum.total || 0,
          change: revenueChange,
        },
        customers: {
          total: totalCustomers,
          newThisMonth: monthCustomers,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockCount[0]?.count || 0,
        },
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.user?.name || order.shippingName || "Anonyme",
        total: order.total,
        status: order.status,
        itemCount: order._count.items,
        createdAt: order.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}, "admin")
