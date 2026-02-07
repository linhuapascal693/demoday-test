import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StarfieldBackground } from "@/components/StarfieldBackground";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "知识领航员 | 智能学习导航工具",
  description: "通过AI生成动态知识全景图，建立上帝视角，让学习更高效",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <StarfieldBackground />
          <Navigation />
          <main className="relative z-10 min-h-screen pt-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
