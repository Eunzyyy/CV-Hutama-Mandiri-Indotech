// src/app/customer/orders/[id]/page.tsx - UPDATED with upload proof & download invoice
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Package, 
  Wrench,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  CreditCard
} from "lucide-react";
import { toast } from "react-hot-toast";

interface OrderDetail {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: Array<{
    id: number;
    quantity: number;
    price: number;
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
    id: number;
    status: string;
    method: string;
    paymentProof?: string;
    proofFileName?: string;
  }>;
}

export default function CustomerOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchOrderDetail();
  }, [params.id]);

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/customer/orders/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        toast.error("Pesanan tidak ditemukan");
        router.push("/customer/orders");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Gagal memuat data pesanan");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPaymentProof = async () => {
    if (!selectedFile) {
      toast.error("Pilih file bukti pembayaran");
      return;
    }

    const formData = new FormData();
    formData.append('paymentProof', selectedFile);

    try {
      setIsUploading(true);
      const response = await fetch(`/api/customer/orders/${params.id}/payment-proof`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success("Bukti pembayaran berhasil diupload");
        setSelectedFile(null);
        fetchOrderDetail();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Gagal upload bukti pembayaran");
      }
    } catch (error: any) {
      console.error("Error uploading proof:", error);
      toast.error(error.message || "Gagal upload bukti pembayaran");
    } finally {
      setIsUploading(false);
    }
  };

// Update function di src/app/customer/orders/[id]/page.tsx
const downloadInvoice = async () => {
  try {
    setIsDownloading(true);
    console.log("Downloading invoice for order:", params.id);
    
    const response = await fetch(`/api/customer/orders/${params.id}/invoice`);
    console.log("Response status:", response.status);
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${order?.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Invoice berhasil didownload");
    } else {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(errorData.error || "Gagal generate invoice");
    }
  } catch (error: any) {
    console.error("Error downloading invoice:", error);
    toast.error(error.message || "Gagal download invoice");
  } finally {
    setIsDownloading(false);
  }
};

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", icon: Clock, label: "Menunggu" },
      PROCESSING: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400", icon: Package, label: "Diproses" },
      SHIPPED: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400", icon: Package, label: "Dikirim" },
      DELIVERED: { color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle, label: "Selesai" },
      CANCELLED: { color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400", icon: XCircle, label: "Dibatalkan" },
    }[status] || { color: "bg-gray-100 text-gray-800", icon: Clock, label: status };

    const Icon = statusConfig.icon;

    return (
      <span className={`px-3 py-1 inline-flex items-center text-sm font-medium rounded-full ${statusConfig.color}`}>
        <Icon size={14} className="mr-1" />
        {statusConfig.label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      CASH: "Tunai",
      BANK_TRANSFER: "Transfer Bank",
      CREDIT_CARD: "Kartu Kredit",
      E_WALLET: "E-Wallet",
      COD: "Bayar di Tempat",
    };
    return methods[method as keyof typeof methods] || method;
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
          href="/customer/orders"
          className="inline-flex items-center px-4 py-2 bg-primary-600 rounded-md text-white"
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  const payment = order.payments?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/customer/orders"
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
        <div className="flex space-x-2">
          {(order.status === "DELIVERED" || payment?.status === "PAID") && (
            <button
              onClick={downloadInvoice}
              disabled={isDownloading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Download size={16} className="mr-2" />
              )}
              Download Invoice
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Status Pesanan</h2>
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* Payment Info & Upload */}
          {order.paymentMethod && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard size={20} className="mr-2" />
                Informasi Pembayaran
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Metode</label>
                  <p className="font-medium">{getPaymentMethodLabel(order.paymentMethod)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                  <p className="font-medium">
                    {payment?.status === "PAID" ? "Sudah Dibayar" : "Menunggu Pembayaran"}
                  </p>
                </div>
              </div>

              {/* Bank Transfer Info */}
              {order.paymentMethod === "BANK_TRANSFER" && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-3">Informasi Transfer</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Bank:</span>
                      <span className="font-medium">BCA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>No. Rekening:</span>
                      <span className="font-medium">1234567890</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A/N:</span>
                      <span className="font-medium">CV Hutama</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jumlah:</span>
                      <span className="font-medium text-primary-600">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Payment Proof */}
              {payment?.status !== "PAID" && order.paymentMethod !== "COD" && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="font-medium mb-4">Upload Bukti Pembayaran</h3>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    {selectedFile && (
                      <button
                        onClick={uploadPaymentProof}
                        disabled={isUploading}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                          <Upload size={16} className="mr-2" />
                        )}
                        Upload Bukti
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Show uploaded proof */}
              {payment?.paymentProof && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="font-medium mb-4">Bukti Pembayaran</h3>
                  <div className="flex justify-center">
                    <Image
                      src={payment.paymentProof}
                      alt="Bukti Pembayaran"
                      width={300}
                      height={200}
                      className="max-w-full h-auto rounded-md border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2 text-center">
                    ✓ Bukti pembayaran telah diupload
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Order Items - same as admin view */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Item Pesanan ({order.orderItems.length})</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {order.orderItems.map((item) => {
                const itemData = item.product || item.service;
                const isProduct = !!item.product;
                
                return (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-white">
                              {itemData?.name}
                            </h3>
                            <div className="mt-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                isProduct 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              }`}>
                                {isProduct ? 'Produk' : 'Jasa'}
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
            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold">Total Pesanan:</span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  Rp {order.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
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

        {/* Sidebar - Shipping & Timeline */}
        <div className="space-y-6">
          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Alamat Pengiriman</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                <p className="text-gray-700 dark:text-gray-300">{order.shippingAddress}</p>
              </div>
            </div>
          )}

          {/* Order Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Timeline Pesanan</h3>
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
        </div>
      </div>
    </div>
  );
}