import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "beecrowd Final Test",
  description: "Solutions for beecrowd programming test",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
