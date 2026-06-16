import type { Metadata } from "next";
import "./globals.css";
import PlatformNav from "../components/platform-nav";

export const metadata: Metadata = {
  title: "AI Trader Platform",
  description: "Institutional AI trading marketplace and execution platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#05070D] text-white antialiased">
        <PlatformNav />
        {children}
      </body>
    </html>
  );
}