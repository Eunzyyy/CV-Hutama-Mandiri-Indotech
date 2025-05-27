// src/app/admin/orders/[id]/page.tsx - UPDATED untuk sesuai dengan create order
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Edit, 
  Loader2, 
  Package,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Wrench
} from "lucide-react";
import { toast } from "react-hot-toast";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    publicId: string;
    name: string;
    price: number;
    images: { url: string }[];
    category: { name: string };
  };
  service?: {
    id: number;
    publicId: string;
    name: string;
    price: number;
    images: { url: string }[];
    category: { name: string };
  };
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  notes?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  orderItems: OrderItem[];
  payments?: Payment[];
}

const statusConfig = {
  PENDING: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", icon: Clock, label: "Menunggu" },
  PROCESSING: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400", icon: Package, label: "Diproses" },
  SHIPPED: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400", icon: Truck, label: "Dikirim" },
  DELIVERED: { color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle, label: "Selesai" },
  CANCELLED: { color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400", icon: XCircle, label: "Dibatalkan" },
};

const paymentMethodLabels = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer Bank",
  CREDIT_CARD: "Kartu Kredit",
  E_WALLET: "E-Wallet",
  COD: "Bayar di Tempat",
};

export default function ViewOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        toast.error("Pesanan tidak ditemukan");
        router.push("/admin/orders");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Gagal memuat pesanan");
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${statusConfig[newStatus as keyof typeof statusConfig]?.label}?`)) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/orders/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Status pesanan berhasil diupdate");
        fetchOrder();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengupdate status");
      }
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error(error.message || "Gagal mengupdate status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Pesanan tidak ditemukan</h2>
        <Link
          href="/admin/orders"
          className="inline-flex items-center px-4 py-2 bg-primary-600 rounded-md text-white"
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/admin/orders"
            className="mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Detail Pesanan</h1>
            <p className="text-gray-500 dark:text-gray-400">
              #{order.orderNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Status Pesanan</h2>
              <span className={`px-3 py-1 inline-flex items-center text-sm font-medium rounded-full ${statusConfig[order.status as keyof typeof statusConfig]?.color}`}>
                <StatusIcon size={14} className="mr-1" />
                {statusConfig[order.status as keyof typeof statusConfig]?.label}
              </span>
            </div>

            {/* Status Update Buttons */}
            <div className="flex flex-wrap gap-2">
              {order.status === "PENDING" && (
                <button
                  onClick={() => updateOrderStatus("PROCESSING")}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isUpdating && <Loader2 size={16} className="mr-2 animate-spin" />}
                  <Package size={16} className="mr-2" />
                  Proses Pesanan
                </button>
              )}
              {order.status === "PROCESSING" && (
                <button
                  onClick={() => updateOrderStatus("SHIPPED")}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center"
                >
                  {isUpdating && <Loader2 size={16} className="mr-2 animate-spin" />}
                  <Truck size={16} className="mr-2" />
                  Kirim Pesanan
                </button>
              )}
              {order.status === "SHIPPED" && (
                <button
                  onClick={() => updateOrderStatus("DELIVERED")}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {isUpdating && <Loader2 size={16} className="mr-2 animate-spin" />}
                  <CheckCircle size={16} className="mr-2" />
                  Selesaikan Pesanan
                </button>
              )}
              {["PENDING", "PROCESSING"].includes(order.status) && (
                <button
                  onClick={() => updateOrderStatus("CANCELLED")}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {isUpdating && <Loader2 size={16} className="mr-2 animate-spin" />}
                  <XCircle size={16} className="mr-2" />
                  Batalkan Pesanan
                </button>
              )}
            </div>
          </div>

          {/* Payment Method (BARU) */}
          {order.paymentMethod && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard size={20} className="mr-2" />
                Metode Pembayaran
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Metode:</span>
                <span className="font-medium text-primary-600 dark:text-primary-400">
                  {paymentMethodLabels[order.paymentMethod as keyof typeof paymentMethodLabels] || order.paymentMethod}
                </span>
              </div>
              {order.payments && order.payments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status Pembayaran:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.payments[0].status === 'PAID' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {order.payments[0].status === 'PAID' ? 'Sudah Dibayar' : 'Menunggu Pembayaran'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Items - UPDATED DESIGN */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Item Pesanan ({order.orderItems.length})</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {order.orderItems.map((item) => {
                const isProduct = !!item.product;
                const itemData = isProduct ? item.product : item.service;
                
                return (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Item Image */}
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                        {itemData?.images?.[0] ? (
                          <Image
                            src={itemData.images[0].url}
                            alt={itemData.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {isProduct ? (
                              <Package size={24} className="text-gray-400" />
                            ) : (
                              <Wrench size={24} className="text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-white">
                              {itemData?.name}
                            </h3>
                            <div className="mt-1 flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                isProduct 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              }`}>
                                {isProduct ? 'Produk' : 'Jasa'}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {itemData?.category?.name}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>Qty: {item.quantity} × Rp {item.price.toLocaleString("id-ID")}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              Rp {(item.quantity * item.price).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Order Total - UPDATED */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold">Total Pesanan:</span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  Rp {order.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Notes - UPDATED */}
          {order.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FileText size={20} className="mr-2" />
                Catatan Pesanan
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                <p className="text-gray-700 dark:text-gray-300">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - UPDATED */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <User size={20} className="mr-2 text-gray-400" />
              <h3 className="text-lg font-semibold">Info Pelanggan</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{order.user.name}</p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <Mail size={14} className="mr-1" />
                  {order.user.email}
                </div>
                {(order.user.phone || order.user.phoneNumber) && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <Phone size={14} className="mr-1" />
                    {order.user.phone || order.user.phoneNumber}
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/admin/users/view/${order.user.id}`}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  Lihat Profile Lengkap →
                </Link>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <MapPin size={20} className="mr-2 text-gray-400" />
                <h3 className="text-lg font-semibold">Alamat Pengiriman</h3>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                <p className="text-gray-700 dark:text-gray-300">{order.shippingAddress}</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Calendar size={20} className="mr-2 text-gray-400" />
              <h3 className="text-lg font-semibold">Timeline</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Pesanan Dibuat</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Terakhir Diupdate</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(order.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Aksi Cepat</h3>
            <div className="space-y-3">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Print Pesanan
              </button>
              <Link
                href={`/admin/orders/${order.id}/edit`}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Pesanan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}