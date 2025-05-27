// src/app/finance/layout.tsx
import Sidebar from "@/components/dashboard/sidebar";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect jika tidak ada session
  if (!session) {
    redirect("/login");
  }

  // Cek apakah user memiliki akses ke finance dashboard
  if (!["FINANCE", "ADMIN", "OWNER"].includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar userRole={session.user.role} />
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}