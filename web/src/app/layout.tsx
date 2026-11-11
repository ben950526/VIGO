import type { Metadata } from "next";
import { Suspense } from "react";
import { BugFixConfirmHost } from "@/components/bugs/BugFixConfirmHost";
import { HelpFab } from "@/components/feedback/HelpFab";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import { siteUrl } from "@/lib/email/config";
import "./globals.css";

export const metadata: Metadata = {
  // 讓 canonical、分享圖等相對網址都以正式站網址為準
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} · 短影音接案媒合`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen antialiased">
        <Navbar />
        <Suspense fallback={null}>
          <BugFixConfirmHost />
        </Suspense>
        <main>{children}</main>
        <Footer />
        <HelpFab />
      </body>
    </html>
  );
}
