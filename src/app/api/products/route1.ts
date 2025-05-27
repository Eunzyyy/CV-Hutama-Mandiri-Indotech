import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API Products called");
    
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log("📦 Products found:", products.length);
    return NextResponse.json(products);
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}