// prisma/seed.ts - UPDATED untuk schema terbaru
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Mulai seeding database...')

  // Hapus data lama dengan urutan yang benar (foreign key constraints)
  console.log('🗑️ Menghapus data lama...')
  await prisma.notification.deleteMany()
  await prisma.review.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.serviceImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.service.deleteMany()
  await prisma.category.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Hash passwords
  const adminPass = await bcrypt.hash('admin123', 10)
  const ownerPass = await bcrypt.hash('owner123', 10)
  const financePass = await bcrypt.hash('finance123', 10)
  const customerPass = await bcrypt.hash('customer123', 10)

  console.log('👤 Membuat users...')

  // Buat admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Hutama',
      email: 'admin@hutama.com',
      password: adminPass,
      role: 'ADMIN',
      phoneNumber: '081234567890',
      phone: '081234567890',
      address: 'Jl. Admin No. 1, Jakarta Pusat, DKI Jakarta 10110',
      emailVerified: new Date()
    }
  })

  // Buat owner user
  const owner = await prisma.user.create({
    data: {
      name: 'Owner Hutama',
      email: 'owner@hutama.com',
      password: ownerPass,
      role: 'OWNER',
      phoneNumber: '081234567891',
      phone: '081234567891',
      address: 'Jl. Owner No. 2, Jakarta Selatan, DKI Jakarta 12345',
      emailVerified: new Date()
    }
  })

  // Buat finance user
  const finance = await prisma.user.create({
    data: {
      name: 'Finance Hutama',
      email: 'finance@hutama.com',
      password: financePass,
      role: 'FINANCE',
      phoneNumber: '081234567892',
      phone: '081234567892',
      address: 'Jl. Finance No. 3, Jakarta Barat, DKI Jakarta 11111',
      emailVerified: new Date()
    }
  })

  // Buat customer 1
  const customer1 = await prisma.user.create({
    data: {
      name: 'Customer Test',
      email: 'customer@gmail.com', 
      password: customerPass,
      role: 'CUSTOMER',
      phoneNumber: '081111111111',
      phone: '081111111111',
      address: 'Jl. Dago No. 123, Bandung, Jawa Barat 40123',
      emailVerified: new Date()
    }
  })

  // Buat customer 2
  const customer2 = await prisma.user.create({
    data: {
      name: 'Customer 2',
      email: 'customer2@gmail.com', 
      password: customerPass,
      role: 'CUSTOMER',
      phoneNumber: '08494723',
      phone: '08494723',
      address: 'Jl. Sudirman No. 456, Surabaya, Jawa Timur 60123',
      emailVerified: new Date()
    }
  })

  console.log('📦 Membuat kategori...')

  // Buat kategori produk
  const kategoriSparePart = await prisma.category.create({
    data: {
      name: 'Spare Part',
      description: 'Suku cadang mesin industri',
      type: 'PRODUCT'
    }
  })

  const kategoriTools = await prisma.category.create({
    data: {
      name: 'Tools',
      description: 'Peralatan kerja dan mesin',
      type: 'PRODUCT'
    }
  })

  // Buat kategori jasa
  const kategoriJasaBubut = await prisma.category.create({
    data: {
      name: 'Jasa Bubut',
      description: 'Layanan bubut dan machining',
      type: 'SERVICE'
    }
  })

  const kategoriJasaRepair = await prisma.category.create({
    data: {
      name: 'Jasa Repair',
      description: 'Layanan perbaikan mesin',
      type: 'SERVICE'
    }
  })

  console.log('🔧 Membuat produk...')

  // Buat produk-produk
  const produk1 = await prisma.product.create({
    data: {
      name: 'Neckring M50',
      description: 'Neckring berkualitas tinggi untuk mesin',
      price: 20000,
      stock: 46,
      categoryId: kategoriSparePart.id,
      sku: 'NK001',
      weight: 150
    }
  })

  const produk2 = await prisma.product.create({
    data: {
      name: 'Bearing SKF',
      description: 'Bearing berkualitas tinggi untuk mesin industri',
      price: 150000,
      stock: 49,
      categoryId: kategoriSparePart.id,
      sku: 'BRG001',
      weight: 300
    }
  })

  const produk3 = await prisma.product.create({
    data: {
      name: 'Obeng',
      description: 'Obeng multifungsi berkualitas tinggi',
      price: 20000,
      stock: 9,
      categoryId: kategoriTools.id,
      sku: 'OBG001',
      weight: 100
    }
  })

  // Buat gambar produk
  await prisma.productImage.createMany({
    data: [
      { url: '/images/neckring.jpg', productId: produk1.id },
      { url: '/images/bearing.jpg', productId: produk2.id },
      { url: '/images/obeng.jpg', productId: produk3.id }
    ]
  })

  console.log('⚙️ Membuat jasa...')

  // Buat jasa-jasa
  const jasa1 = await prisma.service.create({
    data: {
      name: 'Jasa Repair Dies Blanking',
      description: 'Layanan perbaikan dies blanking dengan presisi tinggi',
      price: 500000,
      categoryId: kategoriJasaRepair.id
    }
  })

  const jasa2 = await prisma.service.create({
    data: {
      name: 'Bubut CNC',
      description: 'Jasa bubut presisi tinggi menggunakan mesin CNC',
      price: 300000,
      categoryId: kategoriJasaBubut.id
    }
  })

  // Buat gambar jasa
  await prisma.serviceImage.createMany({
    data: [
      { url: '/images/repair.jpg', serviceId: jasa1.id },
      { url: '/images/bubut.jpg', serviceId: jasa2.id }
    ]
  })

  console.log('🛒 Membuat pesanan...')

  // Buat contoh pesanan 1 (DELIVERED dengan payment PAID)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1748268483374-PKMKR',
      userId: customer2.id,
      totalAmount: 10190000,
      status: 'DELIVERED',
      paymentMethod: 'BANK_TRANSFER',
      shippingAddress: 'Jl. Sudirman No. 456, Surabaya, Jawa Timur 60123',
      notes: 'Pesanan urgent, mohon diprioritaskan'
    }
  })

  // Buat order items untuk pesanan 1
  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        productId: produk1.id, // Neckring
        quantity: 1,
        price: 20000
      },
      {
        orderId: order1.id,
        productId: produk2.id, // Bearing
        quantity: 1,
        price: 150000
      },
      {
        orderId: order1.id,
        serviceId: jasa1.id, // Repair Dies
        quantity: 1,
        price: 500000
      }
    ]
  })

  // Buat payment untuk pesanan 1
  await prisma.payment.create({
    data: {
      orderId: order1.id,
      amount: 10190000,
      method: 'BANK_TRANSFER',
      status: 'PAID',
      paidAt: new Date(),
      verifiedAt: new Date(),
      verifiedBy: admin.id,
      notes: 'Pembayaran telah dikonfirmasi'
    }
  })

  // Buat contoh pesanan 2 (PENDING)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      userId: customer1.id,
      totalAmount: 170000,
      status: 'PENDING',
      paymentMethod: 'BANK_TRANSFER',
      shippingAddress: 'Jl. Dago No. 123, Bandung, Jawa Barat 40123',
      notes: 'Kirim segera ya'
    }
  })

  // Buat order items untuk pesanan 2
  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order2.id,
        productId: produk1.id, // Neckring
        quantity: 1,
        price: 20000
      },
      {
        orderId: order2.id,
        productId: produk2.id, // Bearing
        quantity: 1,
        price: 150000
      }
    ]
  })

  // Buat payment untuk pesanan 2 (menunggu pembayaran)
  await prisma.payment.create({
    data: {
      orderId: order2.id,
      amount: 170000,
      method: 'BANK_TRANSFER',
      status: 'PENDING'
    }
  })

  console.log('⚙️ Membuat pengaturan...')

  // Buat settings
  await prisma.setting.createMany({
    data: [
      {
        key: 'company_name',
        value: 'CV Hutama Mandiri',
        description: 'Nama perusahaan'
      },
      {
        key: 'company_address',
        value: 'Jl. Industri Raya No. 123, Jakarta',
        description: 'Alamat perusahaan'
      },
      {
        key: 'company_phone',
        value: '021-1234567',
        description: 'Nomor telepon perusahaan'
      },
      {
        key: 'bank_account',
        value: '1234567890',
        description: 'Nomor rekening bank'
      },
      {
        key: 'bank_name',
        value: 'BCA',
        description: 'Nama bank'
      },
      {
        key: 'account_holder',
        value: 'CV Hutama Mandiri',
        description: 'Nama pemegang rekening'
      }
    ]
  })

  console.log('🔔 Membuat notifikasi...')

  // Buat contoh notifikasi
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: 'ORDER_CREATED',
        title: 'Pesanan Baru',
        message: `Pesanan baru ${order2.orderNumber} telah dibuat`,
        data: { orderId: order2.id }
      },
      {
        userId: admin.id,
        type: 'PAYMENT_RECEIVED',
        title: 'Pembayaran Diterima',
        message: `Pembayaran untuk pesanan ${order1.orderNumber} telah dikonfirmasi`,
        data: { orderId: order1.id }
      }
    ]
  })

  console.log('✅ Seeding berhasil!')
  console.log('')
  console.log('=== AKUN LOGIN ===')
  console.log('👤 Admin    : admin@hutama.com / admin123')
  console.log('👤 Owner    : owner@hutama.com / owner123')
  console.log('👤 Finance  : finance@hutama.com / finance123')
  console.log('👤 Customer 1: customer@gmail.com / customer123')
  console.log('👤 Customer 2: customer2@gmail.com / customer123')
  console.log('')
  console.log('=== DATA YANG DIBUAT ===')
  console.log('📦 Kategori: 4 buah (2 produk, 2 jasa)')
  console.log('🔧 Produk: 3 buah dengan gambar')
  console.log('⚙️ Jasa: 2 buah dengan gambar')
  console.log('🛒 Pesanan: 2 buah dengan items')
  console.log('💰 Payment: 2 buah (1 paid, 1 pending)')
  console.log('⚙️ Settings: 6 pengaturan dasar')
  console.log('🔔 Notifikasi: 2 contoh')
  console.log('')
  console.log('🎯 Database siap digunakan!')
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })