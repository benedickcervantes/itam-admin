"use client";

import AdminSessionGuard from "@/components/AdminSessionGuard";
import { DisplayScaleFrame } from "@/components/DisplayScaleFrame";
import { MobileNavProvider } from "@/components/MobileNavContext";
import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionGuard>
      <MobileNavProvider>
        <DisplayScaleFrame>
          <div className="flex h-full min-h-0 min-w-0 overflow-hidden bg-[#0F172A]">
            <Sidebar />
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
          </div>
        </DisplayScaleFrame>
      </MobileNavProvider>
    </AdminSessionGuard>
  );
}
