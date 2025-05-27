// src/components/dashboard/layout.tsx (UPDATE - tanpa framer motion)
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/sidebar";
import NotificationHeader from "@/components/admin/notification-header";
import NotificationFloating from "@/components/admin/notification-floating";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Deteksi ukuran layar untuk layout responsif
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Toggle sidebar collapse untuk desktop
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Toggle sidebar untuk mobile
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };
  
  // Redirect jika tidak terotentikasi
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }
  
  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const userRole = session?.user?.role || "CUSTOMER";
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar untuk Desktop */}
      <div className={`hidden lg:block h-full`}>
        <Sidebar 
          userRole={userRole} 
          collapsed={sidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
        />
      </div>
      
      {/* Mobile Sidebar (overlay) */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
            onClick={toggleMobileSidebar}
          ></div>
          
          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 h-full">
            <Sidebar 
              userRole={userRole} 
              collapsed={false} 
              toggleSidebar={toggleMobileSidebar} 
            />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className={`flex flex-col flex-1 overflow-hidden`}>
        {/* Mobile Header with hamburger menu */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 px-4 lg:hidden">
          <div className="flex items-center justify-between">
            <button 
              onClick={toggleMobileSidebar}
              className="text-gray-600 dark:text-gray-300 focus:outline-none"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              CV Hutama Mandiri
            </h1>
            <div className="w-6"></div> {/* Spacer for alignment */}
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Notification Components - pilih salah satu */}
      <NotificationHeader />
      {/* <NotificationFloating /> */}
    </div>
  );
}