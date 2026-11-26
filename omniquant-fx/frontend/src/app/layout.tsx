import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OMNIQUANT FX | Autonomous Forex Intelligence",
  description:
    "Institutional Quantitative Forex Terminal — Price Trend, Tick Volume, Indicator Comparison, Pattern Matching & Session/News Shield",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="hud-bg min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-100">
        {children}
      </body>
    </html>
  );
}
