import type { Metadata, Viewport } from "next";
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
  title: "문장정원",
  description: "읽은 만큼 자라는 나만의 독서 정원",
};

// 모바일 핀치 줌 차단 — 앱처럼 고정된 뷰포트
// viewportFit 은 안 씀 (iOS Safari 에서 노치 영역까지 확장돼 가로 쏠림 유발)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning — 브라우저 확장이 <html> 에 __gcrremoteframetoken
    // 등 속성을 주입해 SSR/CSR 트리가 달라지는 경우의 경고 억제 (앱 로직과 무관).
    // 이 옵션은 React 가 'html' 한 요소의 속성 mismatch 만 무시함. 자식 트리에는
    // 영향 없으니 컴포넌트 hydration 검사는 그대로 동작.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
