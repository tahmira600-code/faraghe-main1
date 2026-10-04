"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useFarar } from "@/components/app-provider";
import { supabase } from "@/lib/supabase"; // استيراد عميل Supabase مباشرة
import type { UserRole } from "@/lib/types";

export default function AuthPage() {
  const router = useRouter();
  const { user, ready, demoMode, signIn, signUp } = useFarar();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<UserRole>("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "signup") {
      setMode("signup");
    }
  }, []);

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  function changeMode(next: "signin" | "signup") {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleGoogleLogin() {
    setError("");
    setNotice("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "وقع مشكل أثناء تسجيل الدخول بجوجل.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signup") {
        const loggedIn = await signUp(name.trim(), email.trim(), password, role);
        if (loggedIn) router.push("/dashboard");
        else setNotice("تسجل الحساب. تفقد البريد الإلكتروني ديالك باش تأكد الحساب، ومن بعد دخل.");
      } else {
        await signIn(email.trim(), password);
        router.push("/dashboard");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "وقع مشكل. عاود المحاولة.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="auth-page page-container">
      <div className="auth-shell">
        <div className="auth-aside">
          <Link href="/" className="brand auth-brand"><span className="brand-mark" aria-hidden="true">ف</span><span>faraghe</span></Link>
          <div className="auth-aside-copy"><p className="eyebrow">قريبين ليك</p><h1>الخدمة المناسبة<br />كتبدا من هنا.</h1><p>دخل لحسابك باش تطلب الخدمات أو تتابع الملف ديالك كمقدّم خدمة.</p></div>
          <div className="auth-aside-note"><span className="aside-note-icon">✦</span><span>خدمات من ناس<br /><strong>قريبين لمدينتك</strong></span></div>
          <div className="auth-decor auth-decor-one" /><div className="auth-decor auth-decor-two" />
        </div>
        <div className="auth-form-panel">
          <div className="auth-tabs" role="tablist" aria-label="الدخول أو إنشاء حساب">
            <button className={mode === "signin" ? "selected" : ""} type="button" role="tab" aria-selected={mode === "signin"} onClick={() => changeMode("signin")}>دخول</button>
            <button className={mode === "signup" ? "selected" : ""} type="button" role="tab" aria-selected={mode === "signup"} onClick={() => changeMode("signup")}>حساب جديد</button>
          </div>
          <div className="auth-title"><p className="eyebrow">مرحبا بيك</p><h2>{mode === "signin" ? "دخل لحسابك" : "أنشئ حساب faraghe"}</h2><p>{mode === "signin" ? "دخل المعلومات ديالك باش تكمل." : "بضع معلومات بسيطة وتكون واجد."}</p></div>
          {demoMode ? <div className="demo-banner"><span aria-hidden="true">◉</span> الوضع التجريبي شغال. الحسابات والطلبات كيتخزنو غير فهاد المتصفح.</div> : null}
          <form className="stacked-form auth-form" onSubmit={handleSubmit}>
            {mode === "signup" ? <>
              <label htmlFor="name">الاسم الكامل</label>
              <input id="name" autoComplete="name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="مثلاً: سلمى بناني" />
              <label>بغيت نستعمل faraghe كـ</label>
              <div className="role-choices">
                <label className={`role-choice ${role === "client" ? "role-selected" : ""}`}><input type="radio" name="role" value="client" checked={role === "client"} onChange={() => setRole("client")} /><span className="role-choice-icon">⌕</span><span><strong>زبون</strong><small>نقلب على الخدمات</small></span></label>
                <label className={`role-choice ${role === "provider" ? "role-selected" : ""}`}><input type="radio" name="role" value="provider" checked={role === "provider"} onChange={() => setRole("provider")} /><span className="role-choice-icon">✳</span><span><strong>مقدّم خدمة</strong><small>نعرّف الناس بخدمتي</small></span></label>
              </div>
            </> : null}
            <label htmlFor="email">البريد الإلكتروني</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr" />
            <label htmlFor="password">كلمة المرور</label>
            <input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 أحرف على الأقل" dir="ltr" />
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            {notice ? <p className="form-notice" role="status">{notice}</p> : null}
            <button className="button button-primary button-full auth-submit" type="submit" disabled={saving}>{saving ? "لحظة من فضلك..." : mode ===="signin" ? "دخول للحساب" : "أنشئ الحساب"}<span aria-hidden="true">←</span></button>
            
            <div style={{ display: "flex", alignItems: "center", margin: "12px 0", color: "#888" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
              <span style={{ padding: "0 10px", fontSize: "13px" }}>أو</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="button button-full"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                backgroundColor: "#fff",
                color: "#374151",
                border: "1px solid #d1d5db",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              المتابعة باستخدام جوجل
            </button>
          </form>
          <p className="auth-switch">{mode === "signin" ? "ما عندكش حساب؟" : "عندك حساب من قبل؟"} <button type="button" onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "سجّل دابا" : "دخل لحسابك"}</button></p>
          <p className="auth-terms">بالمتابعة، كتوافق تستعمل faraghe باحترام وبطريقة مسؤولة.</p>
        </div>
      </div>
    </section>
  );
}
