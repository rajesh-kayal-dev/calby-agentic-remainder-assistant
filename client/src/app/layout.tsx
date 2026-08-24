import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@descope/nextjs-sdk";
import { cn } from "@/lib/utils";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Calby",
  description: "Calby is your intelligent calendar assistant.",
  icons: {
    icon: "/Calby.png",
    shortcut: "/Calby.png",
    apple: "/Calby.png",
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
          {children}
        </body>
      </html>
    </AuthProvider>
  );
}
