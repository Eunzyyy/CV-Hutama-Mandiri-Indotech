// src/app/api/orders/route.ts - FIXED keep original format
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST tetap sama seperti sebelumnya...
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      userId,
      items, 
      totalAmount, 
      paymentMethod,
      shippingAddress, 
      notes 
    } = await request.json();

    // Validasi input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
    }

    // Tentukan user ID yang akan digunakan
    let orderUserId = parseInt(session.user.id);
    
    // Jika admin/owner yang buat order untuk customer lain
    if (userId && ["ADMIN", "OWNER"].includes(session.user.role)) {
      orderUserId = parseInt(userId);
    }

    if (isNaN(orderUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Validasi dan prepare items
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (item.type === 'product' && item.id) {
        const product = await prisma.product.findUnique({
          where: { id: item.id }
        });
        
        if (!product) {
          return NextResponse.json({ 
            error: `Product with ID ${item.id} not found` 
          }, { status: 404 });
        }
        
        if (product.stock < item.quantity) {
          return NextResponse.json({ 
            error: `Insufficient stock for product: ${product.name}` 
          }, { status: 400 });
        }

        validatedItems.push({
          productId: product.id,
          serviceId: null,
          quantity: item.quantity,
          price: product.price
        });

        calculatedTotal += product.price * item.quantity;

      } else if (item.type === 'service' && item.id) {
        const service = await prisma.service.findUnique({
          where: { id: item.id }
        });
        
        if (!service) {
          return NextResponse.json({ 
            error: `Service with ID ${item.id} not found` 
          }, { status: 404 });
        }

        validatedItems.push({
          productId: null,
          serviceId: service.id,
          quantity: item.quantity,
          price: service.price
        });

        calculatedTotal += service.price * item.quantity;
      }
    }

    // Create order dengan transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: orderUserId,
          totalAmount: calculatedTotal,
          status: "PENDING",
          paymentMethod: paymentMethod || null,
          shippingAddress: shippingAddress?.trim() || null,
          notes: notes?.trim() || null,
        },
      });

      // Create order items
      for (const item of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            ...item
          }
        });

        // Update product stock
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // Create payment record if paymentMethod provided
      if (paymentMethod) {
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            amount: calculatedTotal,
            method: paymentMethod,
            status: "PENDING",
            notes: `Payment for order ${orderNumber}`
          }
        });
      }

      return newOrder;
    });

    // Create notification
    try {
      await prisma.notification.create({
        data: {
          type: "ORDER_CREATED",
          title: "Pesanan Baru",
          message: `Pesanan baru #${orderNumber}`,
          data: { 
            orderId: result.id,
            orderNumber
          },
        },
      });
    } catch (notificationError) {
      console.log("Notification creation failed:", notificationError);
    }

    // Fetch full order data
    const fullOrder = await prisma.order.findUnique({
      where: { id: result.id },
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
                category: true
              }
            },
            service: {
              include: {
                images: true,
                category: true
              }
            }
          }
        },
        payments: true
      }
    });

    return NextResponse.json({ 
      message: "Order berhasil dibuat", 
      order: fullOrder 
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - FIXED untuk format yang diharapkan frontend
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const userId = parseInt(session.user.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    let where: any = {};

    // If not admin, only show user's own orders
    if (!["ADMIN", "OWNER", "FINANCE"].includes(session.user.role)) {
      where.userId = userId;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      if (["ADMIN", "OWNER", "FINANCE"].includes(session.user.role)) {
        where.OR = [
          { orderNumber: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ];
      } else {
        where.orderNumber = { contains: search };
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
                select: {
                  id: true,
                  publicId: true,
                  name: true,
                  price: true,
                  images: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
              service: {
                select: {
                  id: true,
                  publicId: true,
                  name: true,
                  price: true,
                  images: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // RETURN FORMAT YANG SESUAI DENGAN FRONTEND ORIGINAL
    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
    
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}