import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Line Sag Calculator",
  description: "Static Line Sag Calculator",
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
