import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SessionProvider } from "@/hooks/use-session";
import "./globals.css";

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
      <body className="font-sans antialiased">
        <SessionProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </SessionProvider>
      </body>
    </html>
  );
}
