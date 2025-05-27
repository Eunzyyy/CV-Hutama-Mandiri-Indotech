// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    
    let where: any = { id: orderId };
    
    // If not admin, only allow access to own orders
    if (!["ADMIN", "OWNER", "FINANCE"].includes(session.user.role)) {
      where.userId = userId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            phoneNumber: true,
            address: true,
          },
        },
        orderItems: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
            service: {
              include: {
                images: true,
                category: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" }
        }
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
    
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !["ADMIN", "OWNER", "FINANCE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const { status, notes } = await request.json();

    if (!status || !["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        notes: notes?.trim() || existingOrder.notes,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
            service: {
              include: {
                images: true,
                category: true,
              },
            },
          },
        },
        payments: true
      },
    });

    // Update payment status if order is delivered and payment method is COD
    if (status === "DELIVERED" && existingOrder.paymentMethod === "COD") {
      await prisma.payment.updateMany({
        where: { orderId: orderId },
        data: { status: "PAID", paidAt: new Date() }
      });
    }

    // Create notification
    try {
      await prisma.notification.create({
        data: {
          type: "ORDER_UPDATED",
          title: "Status Pesanan Diupdate",
          message: `Pesanan #${existingOrder.orderNumber} diupdate menjadi ${status}`,
          data: { 
            orderId: orderId,
            orderNumber: existingOrder.orderNumber,
            newStatus: status
          },
        },
      });
    } catch (notificationError) {
      console.log("Notification creation failed:", notificationError);
    }

    return NextResponse.json(updatedOrder);
    
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Check if order can be cancelled
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!["PENDING", "PROCESSING"].includes(order.status)) {
      return NextResponse.json({ 
        error: "Only pending or processing orders can be cancelled" 
      }, { status: 400 });
    }

    // Cancel order and restore stock
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" }
      });

      // Restore product stock
      for (const item of order.orderItems) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity }
            }
          });
        }
      }

      // Update payment status
      await tx.payment.updateMany({
        where: { orderId: orderId },
        data: { status: "CANCELLED" }
      });
    });

    return NextResponse.json({ message: "Order cancelled successfully" });
    
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}