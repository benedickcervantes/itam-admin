import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SessionExpiredModal from "@/components/SessionExpiredModal";
import { DISPLAY_SCALE_BOOTSTRAP } from "@/lib/display-scale";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "IT Asset Management",
  description: "IT Hardware Asset Management Admin Portal",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: DISPLAY_SCALE_BOOTSTRAP }} />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        {children}
        <SessionExpiredModal />
      </body>
    </html>
  );
}
