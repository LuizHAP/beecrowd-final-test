import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Commerce AI Support",
  description: "Order management with AI-powered support agent",
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
