// src/app/api/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile, unlink } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to parse as number first, then as publicId
    const isNumeric = !isNaN(Number(params.id));
    
    const service = await prisma.service.findUnique({
      where: isNumeric 
        ? { id: parseInt(params.id) }
        : { publicId: params.id },
      include: {
        category: true,
        images: true,
        reviews: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const categoryId = parseInt(formData.get("categoryId") as string);
    const deleteImagesStr = formData.get("deleteImages") as string;
    
    // Validation
    if (!name || !description || isNaN(price) || isNaN(categoryId)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if service exists
    const isNumeric = !isNaN(Number(params.id));
    const existingService = await prisma.service.findUnique({
      where: isNumeric 
        ? { id: parseInt(params.id) }
        : { publicId: params.id },
      include: { images: true },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Handle image deletions
    const imagesToDelete = deleteImagesStr ? JSON.parse(deleteImagesStr) : [];
    
    if (imagesToDelete.length > 0) {
      // Delete images from database and filesystem
      const imagesToDeleteData = await prisma.serviceImage.findMany({
        where: {
          id: { in: imagesToDelete },
          serviceId: existingService.id,
        },
      });

      for (const image of imagesToDeleteData) {
        try {
          // Delete from filesystem
          const imagePath = path.join(process.cwd(), "public", image.url);
          await unlink(imagePath);
        } catch (error) {
          console.error("Error deleting image file:", error);
        }
      }

      await prisma.serviceImage.deleteMany({
        where: {
          id: { in: imagesToDelete },
          serviceId: existingService.id,
        },
      });
    }

    // Handle new image uploads
    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    for (const file of imageFiles) {
      if (file instanceof File && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const fileName = `service-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.type.split('/')[1]}`;
        const filePath = path.join(process.cwd(), "public/uploads/services", fileName);
        
        await writeFile(filePath, buffer);
        imageUrls.push(`/uploads/services/${fileName}`);
      }
    }

    // Update service
    const updatedService = await prisma.service.update({
      where: { id: existingService.id },
      data: {
        name,
        description,
        price,
        categoryId,
        images: {
          create: imageUrls.map((url) => ({ url })),
        },
      },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error: any) {
    console.error("Error updating service:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isNumeric = !isNaN(Number(params.id));
    const service = await prisma.service.findUnique({
      where: isNumeric 
        ? { id: parseInt(params.id) }
        : { publicId: params.id },
      include: { images: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Delete images from filesystem
    for (const image of service.images) {
      try {
        const imagePath = path.join(process.cwd(), "public", image.url);
        await unlink(imagePath);
      } catch (error) {
        console.error("Error deleting image file:", error);
      }
    }

    await prisma.service.delete({
      where: { id: service.id },
    });

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}