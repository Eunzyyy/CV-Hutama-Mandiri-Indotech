// src/app/owner/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  Bell,
  Star,
  Package,
  Wrench,
  Calendar,
  AlertTriangle,
  Activity,
  BarChart3,
  Clock,        // ← Tambahkan ini
  Settings      // ← Tambahkan ini
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface DashboardStats {
  totalRevenue: number;
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalServices: number;
  pendingOrders: number;
  pendingPayments: number;
  averageRating: number;
  monthlyGrowth: number;
  recentActivity: any[];
}

export default function OwnerDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/owner/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Owner
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Overview bisnis CV Hutama Mandiri Indotech
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center">
            <DollarSign size={32} className="mr-4" />
            <div>
              <p className="text-blue-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">
                Rp {stats?.totalRevenue?.toLocaleString('id-ID') || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center">
            <Users size={32} className="mr-4" />
            <div>
              <p className="text-green-100 text-sm">Total Users</p>
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center">
            <ShoppingCart size={32} className="mr-4" />
            <div>
              <p className="text-purple-100 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center">
            <TrendingUp size={32} className="mr-4" />
            <div>
              <p className="text-orange-100 text-sm">Monthly Growth</p>
              <p className="text-2xl font-bold">{stats?.monthlyGrowth || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Business Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Package size={24} className="mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Products</p>
                <p className="text-xl font-bold">{stats?.totalProducts || 0}</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Wrench size={24} className="mx-auto text-green-600 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Services</p>
                <p className="text-xl font-bold">{stats?.totalServices || 0}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Clock size={24} className="mx-auto text-yellow-600 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Orders</p>
                <p className="text-xl font-bold">{stats?.pendingOrders || 0}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Star size={24} className="mx-auto text-purple-600 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
                <p className="text-xl font-bold">{stats?.averageRating || 0}/5</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/owner/analytics"
                className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
              >
                <BarChart3 size={20} className="text-blue-600 mr-3" />
                <span className="font-medium">Analytics</span>
              </Link>
              <Link
                href="/owner/users"
                className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition"
              >
                <Users size={20} className="text-green-600 mr-3" />
                <span className="font-medium">User Management</span>
              </Link>
              <Link
                href="/owner/settings"
                className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
              >
                <Settings size={20} className="text-purple-600 mr-3" />
                <span className="font-medium">System Settings</span>
              </Link>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <AlertTriangle size={20} className="text-orange-500 mr-2" />
              Alerts
            </h3>
            <div className="space-y-2">
              {stats?.pendingPayments ? (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {stats.pendingPayments} pembayaran menunggu verifikasi
                  </p>
                </div>
              ) : null}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Sistem berjalan normal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Recent Activity</h2>
        </div>
        <div className="p-6">
          {stats?.recentActivity?.length ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Activity size={16} className="text-blue-600 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Tidak ada aktivitas terbaru
            </p>
          )}
        </div>
      </div>
    </div>
  );
}