import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "HireLens — Beyond Resumes. Proving Skills.",
  description:
    "AI-powered recruitment and adaptive interview platform designed to evaluate skills through evidence and transparent scoring rubrics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#26212A] selection:bg-[#FFF0F5] selection:text-[#BE356D]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
