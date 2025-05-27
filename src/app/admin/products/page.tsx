// src/app/admin/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Category {
  id: number;
  publicId: string;
  name: string;
}

interface ProductImage {
  id: number;
  url: string;
}

interface Product {
  id: number;
  publicId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  category: Category;
  images: ProductImage[];
  createdAt: string;
  sku?: string | null;
  weight?: number | null;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]); // PASTIKAN ARRAY
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch data
// src/app/admin/products/page.tsx (TAMBAH DEBUG INFO)
// Tambahkan ini di dalam useEffect fetchData:

useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching categories and products...');
        
        // Fetch categories
        const categoriesRes = await fetch("/api/categories?type=PRODUCT");
        console.log('Categories response status:', categoriesRes.status);
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          console.log('Categories data:', categoriesData);
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        }
        
        // Fetch products
        const productsRes = await fetch("/api/products");
        console.log('Products response status:', productsRes.status);
        
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          console.log('Products data:', productsData);
          console.log('First product publicId:', productsData[0]?.publicId);
          
          // PASTIKAN DATA ADALAH ARRAY
          setProducts(Array.isArray(productsData) ? productsData : []);
        } else {
          throw new Error("Failed to fetch products");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data");
        // SET ARRAY KOSONG JIKA ERROR
        setProducts([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fungsi pencarian dan filter - TAMBAH SAFETY CHECK
  const filteredProducts = Array.isArray(products) ? products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === null || product.category?.publicId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) : [];

  // Handle hapus produk
  const handleDeleteProduct = async (publicId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${publicId}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus produk");
      }
      
      toast.success("Produk berhasil dihapus");
      
      // Update state to remove the product
      setProducts(prevProducts => 
        Array.isArray(prevProducts) 
          ? prevProducts.filter(product => product.publicId !== publicId)
          : []
      );
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Gagal menghapus produk");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fungsi pencarian
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get("search") as string;
    setSearchQuery(query);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manajemen Produk</h1>
        <Link
          href="/admin/products/create"
          className="flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
        >
          <Plus size={18} className="mr-2" />
          Tambah Produk
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Search Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                name="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk..."
                className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <button
                type="submit"
                className="absolute right-3 top-2 bg-primary-600 hover:bg-primary-700 text-white py-1 px-3 rounded text-sm"
              >
                Cari
              </button>
            </form>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-4">
            <div className="relative">
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">Semua Kategori</option>
                {Array.isArray(categories) && categories.map((category) => (
                  <option key={category.id} value={category.publicId}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Harga
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tanggal Dibuat
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.publicId}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                        {product.category?.name || "Tidak ada kategori"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      Rp {product.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {product.stock}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(product.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/products/view/${product.publicId}`}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/admin/products/edit/${product.publicId}`}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product.publicId)}
                          disabled={isDeleting}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Tidak Ada Produk</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery
                ? `Tidak ada produk yang sesuai dengan pencarian "${searchQuery}"`
                : "Tidak ada produk yang tersedia"}
            </p>
            <Link
              href="/admin/products/create"
              className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
            >
              <Plus size={18} className="mr-2" />
              Tambah Produk Baru
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}