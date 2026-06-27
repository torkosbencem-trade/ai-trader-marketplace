import type { Metadata } from "next";
import "./globals.css";
import PlatformNav from "../components/platform-nav";

export const metadata: Metadata = {
  title: "StrataOS — Backtest stress testing",
  description:
    "Stress-test a systematic strategy's backtest and surface the red flags a tough reviewer would find. Not a stamp of approval, not investment advice.",
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