import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "@/components/app-provider";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "faraghe | خدمات قريبة منك",
  description: "لقا مقدّمي الخدمات فمدينتك وطلب الخدمة بطريقة سهلة وآمنة.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProvider>
          <SiteHeader />
          <main>{children}</main>
          <footer className="site-footer">
            <div className="footer-inner">
              <div className="brand footer-brand"><span className="brand-mark" aria-hidden="true">ف</span><span>faraghe</span></div>
              <p>الخدمة المناسبة، قريبة منك.</p>
              <span className="footer-copy">© {new Date().getFullYear()} faraghe</span>
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
