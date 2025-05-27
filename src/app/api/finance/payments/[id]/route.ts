// src/app/api/finance/payments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET Payment Detail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !["ADMIN", "FINANCE", "OWNER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const paymentId = parseInt(params.id);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                phoneNumber: true
              }
            },
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
          }
        },
        verifier: {
          select: {
            name: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);

  } catch (error) {
    console.error("Get payment detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH Update Payment Status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !["ADMIN", "FINANCE", "OWNER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const paymentId = parseInt(params.id);
    const body = await req.json();
    const { status } = body;

    // Validasi status
    const validStatuses = ["PENDING", "PENDING_VERIFICATION", "PAID", "FAILED", "CANCELLED", "REFUNDED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Update payment dengan transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          verifiedAt: status === "PAID" ? new Date() : null,
          verifiedBy: status === "PAID" ? userId : null,
          paidAt: status === "PAID" ? new Date() : null
        },
        include: {
          order: true
        }
      });

      // Update order status jika payment PAID
      if (status === "PAID") {
        await prisma.order.update({
          where: { id: updatedPayment.orderId },
          data: {
            status: "PROCESSING"
          }
        });

        // Create notification untuk customer
        await prisma.notification.create({
          data: {
            userId: updatedPayment.order.userId,
            type: "PAYMENT_CONFIRMED",
            title: "Pembayaran Dikonfirmasi",
            message: `Pembayaran untuk pesanan ${updatedPayment.order.orderNumber} telah dikonfirmasi`,
            data: {
              orderId: updatedPayment.order.id,
              paymentId: updatedPayment.id
            }
          }
        });
      }

      return updatedPayment;
    });

    return NextResponse.json({
      message: "Status pembayaran berhasil diupdate",
      payment: result
    });

  } catch (error) {
    console.error("Update payment status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}