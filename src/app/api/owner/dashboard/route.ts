// src/app/api/owner/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Get total revenue from delivered orders with paid payments
    const totalRevenue = await prisma.payment.aggregate({
      where: {
        status: "PAID",
        order: {
          status: "DELIVERED"
        }
      },
      _sum: {
        amount: true
      }
    });

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get total orders
    const totalOrders = await prisma.order.count();

    // Get total products
    const totalProducts = await prisma.product.count();

    // Get total services
    const totalServices = await prisma.service.count();

    // Get pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        status: {
          in: ["PENDING", "PROCESSING"]
        }
      }
    });

    // Get pending payments
    const pendingPayments = await prisma.payment.count({
      where: {
        status: "PENDING_VERIFICATION"
      }
    });

    // Get average rating
    const avgRating = await prisma.review.aggregate({
      _avg: {
        rating: true
      }
    });

    // Calculate monthly growth
    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const currentMonthRevenue = await prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: {
          gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
          lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        }
      },
      _sum: {
        amount: true
      }
    });

    const lastMonthRevenue = await prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: {
          gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          lt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1)
        }
      },
      _sum: {
        amount: true
      }
    });

    const monthlyGrowth = lastMonthRevenue._sum.amount 
      ? ((currentMonthRevenue._sum.amount || 0) - (lastMonthRevenue._sum.amount || 0)) / (lastMonthRevenue._sum.amount || 1) * 100
      : 0;

    // Get recent activity (recent orders)
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const recentActivity = recentOrders.map(order => ({
      title: `Order ${order.orderNumber} dari ${order.user.name}`,
      time: order.createdAt.toLocaleDateString('id-ID'),
      type: 'order'
    }));

    const dashboardStats = {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalUsers,
      totalOrders,
      totalProducts,
      totalServices,
      pendingOrders,
      pendingPayments,
      averageRating: Number(avgRating._avg.rating?.toFixed(1)) || 0,
      monthlyGrowth: Number(monthlyGrowth.toFixed(1)),
      recentActivity
    };

    return NextResponse.json(dashboardStats);

  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}