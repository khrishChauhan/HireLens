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

export const metadata: Metadata = {
  title: "HireLens — Beyond Resumes. Proving Skills.",
  description:
    "AI-powered recruitment intelligence and adaptive technical interview platform. Upload a resume, discover relevant roles, complete an adaptive interview, and receive an evidence-based evaluation.",
};

import { Providers } from "@/components/Providers";

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
      <body className="min-h-full flex flex-col bg-white text-[#28232B] selection:bg-[#FFF0F5] selection:text-[#BE356D]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
