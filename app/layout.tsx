import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Từ Vựng — Ôn luyện từ vựng tiếng Anh",
  description: "Thêm, quản lý và ôn luyện từ vựng tiếng Anh theo chủ đề, với phát âm và theo dõi tiến độ.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen">{children}</body>
    </html>
  );
}
