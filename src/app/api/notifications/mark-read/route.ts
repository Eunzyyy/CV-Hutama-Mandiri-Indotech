// src/app/api/notifications/mark-read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, markAll = false } = body;

    if (markAll) {
      // Mark all notifications as read for current user
      await prisma.notification.updateMany({
        where: {
          AND: [
            {
              OR: [
                { userId: session.user.id },
                ...(["ADMIN", "OWNER", "FINANCE"].includes(session.user.role) 
                  ? [{ userId: null }]
                  : []
                ),
              ],
            },
            { isRead: false },
          ],
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({ message: "Semua notifikasi telah ditandai sebagai dibaca" });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          AND: [
            {
              OR: [
                { userId: session.user.id },
                ...(["ADMIN", "OWNER", "FINANCE"].includes(session.user.role) 
                  ? [{ userId: null }]
                  : []
                ),
              ],
            },
          ],
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({ message: "Notifikasi telah ditandai sebagai dibaca" });
    } else {
      return NextResponse.json(
        { error: "notificationIds atau markAll diperlukan" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Gagal menandai notifikasi sebagai dibaca" },
      { status: 500 }
    );
  }
}