'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/Sidebar';
import React from 'react';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Jika di halaman login, jangan tampilkan sidebar dan layout dashboard
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-arena-900">
      <AdminSidebar />
      <div className="lg:pl-64">
        <main className="min-h-screen p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
