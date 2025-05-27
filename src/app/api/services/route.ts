// src/app/api/services/route.ts - FIXED untuk frontend yang ada
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";

    const where: any = {};

    if (category) {
      where.category = { publicId: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    let orderBy: any = { createdAt: "desc" };

    switch (sort) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "price_low":
        orderBy = { price: "asc" };
        break;
      case "price_high":
        orderBy = { price: "desc" };
        break;
      case "name":
        orderBy = { name: "asc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            publicId: true,
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
        },
      },
      orderBy,
    });

    // RETURN ARRAY LANGSUNG seperti yang diharapkan frontend
    return NextResponse.json(services);
    
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json([]);
  }
}