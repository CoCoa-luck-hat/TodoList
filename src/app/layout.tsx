import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./context/ToastContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: "Premium TodoList Dashboard",
  description: "A world-class, modern, cute and premium task management dashboard with LINE and Email notifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
