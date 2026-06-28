"use client";

import AdminSessionGuard from "@/components/AdminSessionGuard";
import { MobileNavProvider } from "@/components/MobileNavContext";
import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionGuard>
      <MobileNavProvider>
        <div className="flex h-dvh min-h-0 overflow-hidden bg-[#0F172A]">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
        </div>
      </MobileNavProvider>
    </AdminSessionGuard>
  );
}
