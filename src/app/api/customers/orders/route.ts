// src/app/api/customer/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET Orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;
    
    const whereClause: any = { userId };
    
    if (status) {
      whereClause.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  name: true,
                  images: { take: 1 }
                }
              },
              service: {
                select: {
                  name: true,
                  images: { take: 1 }
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.order.count({ where: whereClause })
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST Create Order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const body = await req.json();
    
    const { productId, serviceId, quantity, shippingAddress, requestedDeliveryDate, paymentMethod, notes } = body;

    if (!productId && !serviceId) {
      return NextResponse.json(
        { error: "Product ID atau Service ID wajib diisi" },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.trim()) {
      return NextResponse.json(
        { error: "Alamat pengiriman wajib diisi" },
        { status: 400 }
      );
    }

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;

    let itemPrice = 0;
    let itemData = null;

    // Get product or service details
    if (productId) {
      itemData = await prisma.product.findFirst({
        where: { publicId: productId }
      });
      if (!itemData) {
        return NextResponse.json(
          { error: "Produk tidak ditemukan" },
          { status: 404 }
        );
      }
      itemPrice = parseFloat(itemData.price.toString());
    } else if (serviceId) {
      itemData = await prisma.service.findFirst({
        where: { publicId: serviceId }
      });
      if (!itemData) {
        return NextResponse.json(
          { error: "Jasa tidak ditemukan" },
          { status: 404 }
        );
      }
      itemPrice = parseFloat(itemData.price.toString());
    }

    const totalAmount = itemPrice * quantity;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        totalAmount,
        status: "PENDING",
        shippingAddress,
        requestedDeliveryDate: requestedDeliveryDate ? new Date(requestedDeliveryDate) : null,
        paymentMethod,
        notes: notes || null,
        orderItems: {
          create: {
            productId: productId ? itemData.id : null,
            serviceId: serviceId ? itemData.id : null,
            quantity,
            price: itemPrice
          }
        }
      }
    });

    return NextResponse.json({
      message: "Pesanan berhasil dibuat",
      orderId: order.id
    });

  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}