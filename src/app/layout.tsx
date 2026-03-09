import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "@/hooks/use-session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Social App",
  description: "A modern social media platform built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <SessionProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </SessionProvider>
      </body>
    </html>
  );
}
