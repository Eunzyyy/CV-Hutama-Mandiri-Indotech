// src/app/api/customer/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  console.log("🔍 Customer Orders API - GET request received");
  
  try {
    const session = await getServerSession(authOptions);
    console.log("🔧 Session:", session?.user);
    
    if (!session) {
      console.log("❌ No session");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    if (session.user.role !== "CUSTOMER") {
      console.log("❌ Not customer role:", session.user.role);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = parseInt(session.user.id);
    console.log("👤 Customer ID:", userId);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    console.log("📊 Query params:", { page, limit, status });

    const skip = (page - 1) * limit;
    const whereClause: any = { userId };
    
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    console.log("🔍 Where clause:", whereClause);

    // Fetch orders
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
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.order.count({ where: whereClause })
    ]);

    console.log(`✅ Found ${orders.length} orders out of ${total} total`);

    const response = {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

// POST method untuk create order
export async function POST(request: NextRequest) {
  console.log("🔍 Customer Orders API - POST request received");
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    
    const { items, paymentMethod, shippingAddress, notes } = body;

    // Validasi
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items required" }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method required" }, { status: 400 });
    }

    if (!shippingAddress?.trim()) {
      return NextResponse.json({ error: "Shipping address required" }, { status: 400 });
    }

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;

    let calculatedTotal = 0;
    const orderItemsData = [];

    // Process items
    for (const item of items) {
      let itemData = null;
      let itemPrice = 0;

      if (item.type === 'product') {
        itemData = await prisma.product.findUnique({
          where: { id: item.id }
        });
        if (!itemData) {
          return NextResponse.json({ error: `Product ${item.id} not found` }, { status: 404 });
        }
        if (itemData.stock < item.quantity) {
          return NextResponse.json({ error: `Insufficient stock for ${itemData.name}` }, { status: 400 });
        }
        itemPrice = parseFloat(itemData.price.toString());
      } else if (item.type === 'service') {
        itemData = await prisma.service.findUnique({
          where: { id: item.id }
        });
        if (!itemData) {
          return NextResponse.json({ error: `Service ${item.id} not found` }, { status: 404 });
        }
        itemPrice = parseFloat(itemData.price.toString());
      } else {
        return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
      }

      calculatedTotal += itemPrice * item.quantity;
      orderItemsData.push({
        productId: item.type === 'product' ? item.id : null,
        serviceId: item.type === 'service' ? item.id : null,
        quantity: item.quantity,
        price: itemPrice
      });
    }

    // Create order with transaction
    const order = await prisma.$transaction(async (prisma) => {
      const newOrder = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount: calculatedTotal,
          status: "PENDING",
          paymentMethod,
          shippingAddress,
          notes: notes || null,
          orderItems: {
            create: orderItemsData
          }
        }
      });

      // Update stock for products
      for (const item of items) {
        if (item.type === 'product') {
          await prisma.product.update({
            where: { id: item.id },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

      // Create payment record if not COD
      if (paymentMethod !== 'COD') {
        await prisma.payment.create({
          data: {
            orderId: newOrder.id,
            amount: calculatedTotal,
            method: paymentMethod,
            status: "PENDING"
          }
        });
      }

      return newOrder;
    });

    return NextResponse.json({
      message: "Order created successfully",
      order: {
        id: order.id,
        orderNumber: order.orderNumber
      }
    });

  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}