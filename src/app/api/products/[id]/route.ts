// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Helper function untuk mencari produk berdasarkan publicId atau regular id
async function findProduct(identifier: string) {
  console.log('Finding product with identifier:', identifier);
  
  // Coba cari berdasarkan publicId dulu
  let product = await prisma.product.findUnique({
    where: { publicId: identifier },
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
  });

  console.log('Product found by publicId:', product ? 'YES' : 'NO');

  // Jika tidak ketemu dan identifier adalah angka, coba cari berdasarkan id
  if (!product && !isNaN(Number(identifier))) {
    console.log('Trying to find by regular id:', identifier);
    product = await prisma.product.findUnique({
      where: { id: parseInt(identifier) },
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
    });
    console.log('Product found by id:', product ? 'YES' : 'NO');
  }

  return product;
}

// GET - Ambil produk berdasarkan publicId atau id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET request for product ID:', params.id);
    
    const product = await findProduct(params.id);

    if (!product) {
      console.log('Product not found with identifier:', params.id);
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    console.log('Product found, returning data');
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data produk" },
      { status: 500 }
    );
  }
}

// PUT - Update produk
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Cek apakah produk ada
    const existingProduct = await findProduct(params.id);

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stock") as string);
    const categoryId = parseInt(formData.get("categoryId") as string);
    const sku = formData.get("sku") as string || null;
    const weight = formData.get("weight") ? parseInt(formData.get("weight") as string) : null;
    const weightUnit = formData.get("weightUnit") as string || "gram";

    // Validasi input
    if (!name || !description || isNaN(price) || isNaN(stock) || isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Data tidak lengkap atau tidak valid" },
        { status: 400 }
      );
    }

    // Handle image deletion
    const deleteImagesStr = formData.get("deleteImages") as string;
    if (deleteImagesStr) {
      const deleteImageIds = JSON.parse(deleteImagesStr);
      await prisma.productImage.deleteMany({
        where: {
          id: { in: deleteImageIds },
          productId: existingProduct.id,
        },
      });
    }

    // Handle new images upload
    const newImages = formData.getAll("images") as File[];
    const imageUrls: string[] = [];
    
    for (const image of newImages) {
      if (image.size > 0) {
        // Di sini Anda perlu implementasi upload file
        const buffer = await image.arrayBuffer();
        const fileName = `product_${Date.now()}_${image.name}`;
        
        // Implementasi upload file sesuai kebutuhan (Cloudinary, AWS S3, dll)
        const imageUrl = `/uploads/products/${fileName}`; // placeholder
        imageUrls.push(imageUrl);
      }
    }

    // Konversi weight ke gram jika perlu
    let weightInGrams = weight;
    if (weight && weightUnit) {
      switch (weightUnit) {
        case 'kg':
          weightInGrams = weight * 1000;
          break;
        case 'ton':
          weightInGrams = weight * 1000000;
          break;
        case 'gram':
        default:
          weightInGrams = weight;
      }
    }

    // Update produk menggunakan internal id
    const updatedProduct = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        sku,
        weight: weightInGrams,
        images: {
          create: imageUrls.map(url => ({ url })),
        },
      },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate produk" },
      { status: 500 }
    );
  }
}

// DELETE - Hapus produk
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Cek apakah produk ada
    const existingProduct = await findProduct(params.id);

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hapus produk (gambar akan terhapus otomatis karena onDelete: Cascade)
    await prisma.product.delete({
      where: { id: existingProduct.id },
    });

    return NextResponse.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Gagal menghapus produk" },
      { status: 500 }
    );
  }
}