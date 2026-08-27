import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@descope/nextjs-sdk";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { PWAProvider } from "@/context/pwa-context";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Calby — Your Conversational Personal Assistant",
  description:
    "Tell Calby what you need to remember, schedule, organize, and follow up. Manage your calendar, tasks, money ledger, reminders, contacts, and reports through natural conversation.",
  keywords: [
    "AI assistant",
    "personal assistant",
    "conversational AI",
    "calendar assistant",
    "task manager",
    "money ledger",
    "reminders",
    "automated reports",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Calby",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const projectId = process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID ?? "";

  const cookieOptions = {
    sameSite: "Lax" as const,
    secure: process.env.NODE_ENV !== "development",
  };

  return (
    <AuthProvider
      projectId={projectId}
      sessionTokenViaCookie={cookieOptions}
      refreshTokenViaCookie={cookieOptions}
    >
      <html lang="en" className={sans.variable}>
        <body className="min-h-svh bg-background font-sans text-foreground antialiased selection:bg-lime-400 selection:text-zinc-950">
          <PWAProvider>
            <ServiceWorkerRegister />
            {children}
          </PWAProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
