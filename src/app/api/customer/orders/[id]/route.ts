// src/app/api/customer/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET Order Detail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const orderId = parseInt(params.id);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId // Pastikan customer hanya bisa lihat ordernya sendiri
      },
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
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error("Get order detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}