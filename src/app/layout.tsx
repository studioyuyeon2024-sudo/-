import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "결혼식 사회 대본 생성기",
  description: "식순과 특이사항을 입력하면 맞춤형 결혼식 사회 대본을 AI가 자동으로 생성합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
