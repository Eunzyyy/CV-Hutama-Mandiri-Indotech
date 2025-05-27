// src/components/customer/confirm-payment-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Upload } from "lucide-react";

interface ConfirmPaymentFormProps {
  orderId: number;
  remainingAmount: number;
}

export default function ConfirmPaymentForm({
  orderId,
  remainingAmount,
}: ConfirmPaymentFormProps) {
  const [amount, setAmount] = useState(remainingAmount);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setPaymentProof(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentProof) {
      toast.error("Bukti pembayaran harus diunggah");
      return;
    }
    
    if (amount <= 0 || amount > remainingAmount) {
      toast.error(`Jumlah tidak valid. Sisa pembayaran: Rp ${remainingAmount.toLocaleString("id-ID")}`);
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare form data for file upload
      const formData = new FormData();
      formData.append("orderId", orderId.toString());
      formData.append("amount", amount.toString());
      formData.append("paymentProof", paymentProof);
      
      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit payment");
      }
      
      toast.success("Bukti pembayaran berhasil dikirim");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat mengirim bukti pembayaran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold">Konfirmasi Pembayaran</h2>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Jumlah yang Dibayar (Rp)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              max={remainingAmount}
              className="block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bukti Pembayaran
            </label>
            <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-6">
              {previewUrl ? (
                <div className="w-full text-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-48 mx-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentProof(null);
                      setPreviewUrl(null);
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <Upload
                    className="mx-auto h-12 w-12 text-gray-400"
                    strokeWidth={1}
                  />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus-within:outline-none"
                    >
                      <span>Unggah bukti</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                      />
                    </label>
                    <p className="pl-1">atau drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF hingga 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !paymentProof}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Mengirim..." : "Kirim Bukti Pembayaran"}
          </button>
        </form>
      </div>
    </div>
  );
}