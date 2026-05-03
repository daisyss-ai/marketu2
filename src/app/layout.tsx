import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "MARKETU",
  description: "MARKETPLACE PARA ESTUDANTES",

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={cn("font-mono")}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
      </head>
      <body className="antialiased">
        <Suspense fallback={null}>
          <ToastProvider />
          <Toaster />
        </Suspense>
        {children}

      </body>
    </html>
  );
}
