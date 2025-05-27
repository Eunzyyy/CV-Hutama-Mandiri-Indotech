// src/app/customer/orders/page.tsx - FIXED
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ShoppingBag, 
  Package, 
  Eye, 
  Calendar,
  Filter,
  Plus,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderItems: Array<{
    id: number;
    quantity: number;
    product?: {
      name: string;
      images: { url: string }[];
    };
    service?: {
      name: string;
      images: { url: string }[];
    };
  }>;
  payments?: Array<{
    status: string;
  }>;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });
      
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/customer/orders?${params}`);
      
      if (response.ok) {
        const data: OrdersResponse = await response.json();
        setOrders(data.orders || []);
        setPagination(data.pagination);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Gagal memuat pesanan");
      }
    } catch (error: any) {
      console.error("Fetch orders error:", error);
      toast.error(error.message || "Gagal memuat data pesanan");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", label: "Menunggu" },
      PROCESSING: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400", label: "Diproses" },
      SHIPPED: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400", label: "Dikirim" },
      DELIVERED: { color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", label: "Selesai" },
      CANCELLED: { color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400", label: "Dibatalkan" },
    }[status] || { color: "bg-gray-100 text-gray-800", label: status };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long", 
      year: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <ShoppingBag size={28} className="mr-3" />
            Pesanan Saya
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Pantau status dan riwayat pesanan Anda
          </p>
        </div>
        <Link
          href="/customer/orders/create"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} className="mr-2" />
          Belanja Lagi
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <Filter size={20} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="PROCESSING">Diproses</option>
            <option value="SHIPPED">Dikirim</option>
            <option value="DELIVERED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">#{order.orderNumber}</h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar size={16} className="mr-1" />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex -space-x-2">
                    {order.orderItems.slice(0, 3).map((item, index) => {
                      const itemData = item.product || item.service;
                      return (
                        <div key={index} className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-white dark:border-gray-800 overflow-hidden">
                          {itemData?.images?.[0] ? (
                            <Image
                              src={itemData.images[0].url}
                              alt={itemData.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                    </p>
                    {order.orderItems.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{order.orderItems.length - 3} item lainnya
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                    <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                      Rp {order.totalAmount.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Link
                    href={`/customer/orders/${order.id}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Eye size={16} className="mr-2" />
                    Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Tidak ada pesanan
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Anda belum memiliki pesanan. Mulai berbelanja sekarang!
          </p>
          <Link
            href="/customer/orders/create"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={20} className="mr-2" />
            Buat Pesanan Pertama
          </Link>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-md ${
                page === currentPage
                  ? "bg-primary-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}