// src/app/api/payments/confirm/route.ts
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    const formData = await request.formData();
    
    const orderId = Number(formData.get("orderId"));
    const amount = Number(formData.get("amount"));
    const paymentProofFile = formData.get("paymentProof") as File;
    
    if (!orderId || !amount || !paymentProofFile) {
      return NextResponse.json(
        { message: "Semua field harus diisi" },
        { status: 400 }
      );
    }
    
    // Validate order
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId,
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { message: "Order tidak ditemukan" },
        { status: 404 }
      );
    }
    
    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { message: "Pesanan sudah dibayar" },
        { status: 400 }
      );
    }
    
    // In a real app, handle file upload to storage service here
    // For this example, we'll just store the filename as if it's uploaded
    const paymentProofUrl = `/uploads/payment-proofs/${Date.now()}-${paymentProofFile.name}`;
    
    // Update order with payment proof
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentProof: paymentProofUrl,
      },
    });
    
    return NextResponse.json({
      message: "Bukti pembayaran berhasil dikirim",
    });
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}