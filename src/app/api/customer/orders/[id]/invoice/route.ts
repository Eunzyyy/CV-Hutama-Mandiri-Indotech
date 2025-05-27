// src/app/api/customer/orders/[id]/invoice/route.ts - SAMA DENGAN FINANCE
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const orderId = parseInt(params.id);
    const userId = parseInt(session.user.id);
    
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        userId: userId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            phoneNumber: true,
            address: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            },
            service: {
              select: {
                name: true
              }
            }
          }
        },
        payments: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Create PDF dengan format yang sama persis dengan finance
    const doc = new jsPDF();
    
    // Load logo - mentok kiri
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-hutama.png');
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30);
    } catch (error) {
      // Placeholder logo
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.circle(25, 25, 15);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('LOGO', 20, 27);
    }
    
    // Company Header - mulai dari tengah kiri
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('HUTAMA MARDIMAN INDOTECH', 45, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('CNC PRECISION PRODUCT', 45, 28);
    
    // Company address - font kecil, posisi tetap
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text('Jl. Raya Binong No. 79 Kamp. Parigi Sukabakti, Curug', 45, 35);
    doc.text('Tangerang 15810 Telp. 021 - 5983117 Fax. 021 - 5983117', 45, 41);
    
    // Tanggal dan Kepada - MENTOK KANAN
    const currentDate = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dateStr = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Right aligned - mentok kanan
    const dateText = `Tangerang, ${dateStr}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, 200 - dateWidth, 20);
    
    const kepadaText = 'Kepada Yth';
    const kepadaWidth = doc.getTextWidth(kepadaText);
    doc.text(kepadaText, 200 - kepadaWidth, 30);
    
    // Line separator
    doc.setLineWidth(1.5);
    doc.line(10, 50, 200, 50);
    
    // Faktur number - mentok kiri
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`FAKTUR No. : ${order.orderNumber}/HMI/IX/${currentDate.getFullYear()}`, 10, 62);
    
    // Customer info - mentok kanan
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const upText = 'UP :';
    const upWidth = doc.getTextWidth(upText);
    doc.text(upText, 200 - upWidth, 62);
    
    const customerName = order.user.name.toUpperCase();
    const customerWidth = doc.getTextWidth(customerName);
    doc.text(customerName, 200 - customerWidth, 70);
    
    const tangerangText = 'TANGERANG';
    const tangerangWidth = doc.getTextWidth(tangerangText);
    doc.text(tangerangText, 200 - tangerangWidth, 78);
    
    // Table - lebih compact dan presisi
    const tableStartY = 90;
    const rowHeight = 12;
    const col1 = 10;   // Banyaknya
    const col2 = 35;   // Nama Barang  
    const col3 = 130;  // Harga
    const col4 = 170;  // Jumlah
    const tableEnd = 200;
    
    // Table header background
    doc.setFillColor(248, 248, 248);
    doc.rect(col1, tableStartY, tableEnd - col1, 10, 'F');
    
    // Vertical lines
    doc.setLineWidth(0.5);
    doc.line(col1, tableStartY, col1, tableStartY + 70); // Left
    doc.line(col2, tableStartY, col2, tableStartY + 70); // After Banyaknya
    doc.line(col3, tableStartY, col3, tableStartY + 70); // After Nama
    doc.line(col4, tableStartY, col4, tableStartY + 70); // After Harga
    doc.line(tableEnd, tableStartY, tableEnd, tableStartY + 70); // Right
    
    // Horizontal lines
    doc.line(col1, tableStartY, tableEnd, tableStartY); // Top
    doc.line(col1, tableStartY + 10, tableEnd, tableStartY + 10); // After header
    
    // Table headers - font kecil dan centered
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    
    doc.text('Banyaknya', col1 + 2, tableStartY + 7);
    doc.text('NAMA BARANG', col2 + 20, tableStartY + 7);
    doc.text('Harga', col3 + 10, tableStartY + 7);
    doc.text('Jumlah', col4 + 10, tableStartY + 7);
    
    // Table content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let currentRowY = tableStartY + 10;
    let totalAmount = 0;
    
    order.orderItems.forEach((item, index) => {
      const itemName = item.product?.name || item.service?.name || 'Unknown Item';
      const sku = item.product?.sku ? ` ${item.product.sku}` : '';
      const subtotal = item.quantity * item.price;
      totalAmount += subtotal;
      
      const rowY = currentRowY + (index * rowHeight);
      
      // Horizontal line
      doc.line(col1, rowY + rowHeight, tableEnd, rowY + rowHeight);
      
      // Banyaknya - left aligned dalam kolom
      doc.text(`${item.quantity} pcs`, col1 + 2, rowY + 8);
      
      // Nama Barang - truncate smart
      const fullItemName = `${itemName}${sku}`.toUpperCase();
      let displayName = fullItemName;
      if (fullItemName.length > 25) {
        displayName = fullItemName.substring(0, 22) + '...';
      }
      doc.text(displayName, col2 + 2, rowY + 8);
      
      // Harga - right aligned dalam kolom
      const priceText = item.price.toLocaleString('id-ID');
      const priceWidth = doc.getTextWidth(priceText);
      doc.text(priceText, col4 - 5 - priceWidth, rowY + 8);
      
      // Jumlah - right aligned dalam kolom
      const totalText = subtotal.toLocaleString('id-ID');
      const totalTextWidth = doc.getTextWidth(totalText);
      doc.text(totalText, tableEnd - 5 - totalTextWidth, rowY + 8);
    });
    
    // Table bottom line
    const tableEndY = currentRowY + (order.orderItems.length * rowHeight) + rowHeight;
    doc.line(col1, tableEndY, tableEnd, tableEndY);
    
    // Total - right aligned dan bold
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const totalLabel = 'TOTAL:';
    const totalValue = `Rp ${totalAmount.toLocaleString('id-ID')}`;
    
    const totalLabelWidth = doc.getTextWidth(totalLabel);
    const totalValueWidth = doc.getTextWidth(totalValue);
    
    doc.text(totalLabel, col4 - 10 - totalLabelWidth, tableEndY + 12);
    doc.text(totalValue, tableEnd - 5 - totalValueWidth, tableEndY + 12);
    
    // Informasi Pembayaran - mentok kiri
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const infoStartY = tableEndY + 30;
    
    doc.text('Informasi Pembayaran:', 10, infoStartY);
    doc.text('Status: LUNAS', 10, infoStartY + 7);
    
    const payment = order.payments?.[0];
    if (payment) {
      doc.text(`Metode: ${getPaymentMethodLabel(payment.method)}`, 10, infoStartY + 14);
      if (payment.paidAt) {
        doc.text(`Tanggal Bayar: ${new Date(payment.paidAt).toLocaleDateString('id-ID')}`, 10, infoStartY + 21);
      }
    }
    
    // Rekening Pembayaran
    doc.text('Rekening Pembayaran:', 10, infoStartY + 35);
    doc.text('Bank: BCA', 10, infoStartY + 42);
    doc.text('No. Rekening: 1234567890', 10, infoStartY + 49);
    doc.text('A/N: CV Hutama Mandiri Indotech', 10, infoStartY + 56);
    
    // Footer - left dan right aligned
    doc.setFontSize(8);
    doc.text('Terima kasih atas kepercayaan Anda', 10, 280);
    
    const footerText = `Dicetak pada: ${currentDate.toLocaleString('id-ID')}`;
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, 200 - footerWidth, 280);

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${order.orderNumber}.pdf"`
      }
    });

  } catch (error) {
    console.error("Download invoice error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getPaymentMethodLabel(method: string): string {
  const methodLabels = {
    CASH: 'Tunai',
    BANK_TRANSFER: 'Transfer Bank',
    CREDIT_CARD: 'Kartu Kredit',
    E_WALLET: 'E-Wallet',
    COD: 'Bayar di Tempat'
  };
  return methodLabels[method as keyof typeof methodLabels] || method;
}