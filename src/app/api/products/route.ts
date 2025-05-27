// src/app/api/products/route.ts - FIXED VERSION
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
        { name: { contains: search } }, // Remove mode: insensitive for MySQL
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

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            publicId: true,
            name: true,
          },
        },
        images: { // Pastikan nama relasi sesuai schema
          select: {
            id: true,
            url: true,
          },
        },
      },
      orderBy,
    });

    return NextResponse.json(products);
    
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}