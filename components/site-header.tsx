"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useFarar } from "@/components/app-provider";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useFarar();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setError("");
    try {
      await signOut();
      setMenuOpen(false);
      router.push("/");
    } catch {
      setError("ما قدرناش نسجلو الخروج دابا. عاود المحاولة.");
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="faraghe - الصفحة الرئيسية">
          <span className="brand-mark" aria-hidden="true">ف</span>
          <span>faraghe</span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="التنقل الرئيسي">
          <Link className={pathname === "/" ? "active" : ""} href="/" onClick={() => setMenuOpen(false)}>الرئيسية</Link>
          <Link href="/#providers" onClick={() => setMenuOpen(false)}>مقدّمو الخدمات</Link>
          <Link href="/#how-it-works" onClick={() => setMenuOpen(false)}>كيفاش كتخدم</Link>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link className="header-user" href="/dashboard" title="الملف الشخصي">
                <span className="mini-avatar">{user.name.slice(0, 1)}</span>
                <span className="header-user-name">{user.name}</span>
              </Link>
              <button className="button button-quiet header-signout" type="button" onClick={handleSignOut}>خروج</button>
            </>
          ) : (
            <>
              <Link className="button button-quiet header-login" href="/auth">دخول</Link>
              <Link className="button button-primary header-join" href="/auth?mode=signup">سجّل كمقدّم خدمة <span aria-hidden="true">↗</span></Link>
            </>
          )}
        </div>
      </div>
      {error ? <div className="header-error" role="status">{error}</div> : null}
    </header>
  );
}
