import type { Metadata } from "next";
import { sans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "AUTOALIGN C2",
  description: "Automated Multi-Modal Lunar Image Registration for Chandrayaan-2 Sensors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#07060c]">
      <body className={`${sans.className} antialiased bg-[#07060c] text-white m-0 p-0 overflow-x-hidden min-h-screen font-sans selection:bg-cyan-500/20 selection:text-cyan-200`}>
        {children}
      </body>
    </html>
  );
}
