// src/app/api/checkout/route.ts
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);
    const body = await request.json();
    const { cartId, paymentMethod, notes, customerDesign } = body;

    // Validasi input
    if (!cartId) {
      return NextResponse.json(
        { message: "Cart ID diperlukan" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { message: "Metode pembayaran diperlukan" },
        { status: 400 }
      );
    }

    // Cek apakah cart ada dan milik user
    const cart = await prisma.order.findUnique({
      where: {
        id: Number(cartId),
        userId,
        status: "PENDING",
        paymentStatus: "UNPAID",
        orderNumber: {
          startsWith: "CART-",
        },
      },
      include: {
        items: true,
      },
    });

    if (!cart) {
      return NextResponse.json(
        { message: "Cart tidak ditemukan" },
        { status: 404 }
      );
    }

    if (cart.items.length === 0) {
      return NextResponse.json(
        { message: "Cart kosong" },
        { status: 400 }
      );
    }

    // Generate nomor pesanan yang baru
    const orderNumber = `ORDER-${Date.now()}-${userId}`;

    // Update cart menjadi order
    const order = await prisma.order.update({
      where: {
        id: Number(cartId),
      },
      data: {
        orderNumber,
        paymentMethod,
        notes,
        customerDesign,
        status: "PENDING", // Tetap PENDING sampai dibayar dan dikonfirmasi admin
      },
    });

    return NextResponse.json({
      message: "Checkout berhasil",
      order,
    });
  } catch (error) {
    console.error("Error checkout:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}