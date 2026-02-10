import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Game Engine - 创造你的独特游戏",
  description: "一个生成游戏的游戏。通过选择和混沌，创造独一无二的可玩体验。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-pixel-black">
        <Header />
        <main className="min-h-[calc(100vh-52px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
