"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useFarar } from "@/components/app-provider";
import { hasAvailability } from "@/lib/availability";
import type { Provider } from "@/lib/types";

export function RequestDialog({ provider, preferredDate = "", preferredTime = "", onClose }: { provider: Provider; preferredDate?: string; preferredTime?: string; onClose: () => void }) {
  const { user, createRequest } = useFarar();
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(preferredDate);
  const [selectedTime, setSelectedTime] = useState(preferredTime);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setError("سجّل الدخول أو أنشئ حساب زبون قبل إرسال الطلب.");
      return;
    }
    if (!hasAvailability(provider, selectedDate, selectedTime)) {
      setError("هاد الساعة ما داخلاش فالأوقات اللي حدّدها مقدّم الخدمة. اختار موعداً آخر.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createRequest(provider, message.trim(), selectedDate, selectedTime);
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ما قدرناش نرسلو الطلب. عاود المحاولة.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="request-modal" role="dialog" aria-modal="true" aria-labelledby="request-title">
        <button className="modal-close" type="button" aria-label="إغلاق" onClick={onClose}>×</button>
        {sent ? (
          <div className="success-state">
            <div className="success-icon" aria-hidden="true">✓</div>
            <p className="eyebrow">توصلنا بالطلب</p>
            <h2 id="request-title">طلبك تصيفط بنجاح</h2>
            <p>غادي يبان ليك فلوحة الحساب، ومقدّم الخدمة يقدر يجاوبك من تما.</p>
            <button className="button button-primary button-full" type="button" onClick={onClose}>حسناً</button>
          </div>
        ) : (
          <>
              <p className="eyebrow">طلب مطابقة</p>
            <h2 id="request-title">تواصل مع {provider.fullName}</h2>
            <p className="modal-intro">شرح باختصار شنو محتاج، واختار الوقت اللي مناسب ليك.</p>
            {!user ? <div className="auth-hint">خاصك حساب باش تصيفط الطلب. <Link href="/auth">دخول أو تسجيل</Link></div> : null}
            <form className="stacked-form" onSubmit={handleSubmit}>
              <label htmlFor="request-message">تفاصيل الخدمة</label>
              <textarea id="request-message" required minLength={8} maxLength={2000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="مثلاً: محتاج نصلّح تسريب فالمطبخ..." />
              <label htmlFor="request-date">نهار الخدمة</label>
              <input id="request-date" type="date" required min={localDateString()} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              <label htmlFor="request-time">الساعة <span className="optional-label">(مدة الموعد ساعة)</span></label>
              <input id="request-time" type="time" required value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} />
              {selectedDate && selectedTime ? <p className={hasAvailability(provider, selectedDate, selectedTime) ? "form-notice" : "form-error"} role="status">{hasAvailability(provider, selectedDate, selectedTime) ? "مقدّم الخدمة متاح حسب البرنامج اللي حدّد." : "الساعة المختارة ما داخلاش فبرنامج مقدّم الخدمة."}</p> : null}
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="button button-primary button-full" type="submit" disabled={saving}>{saving ? "كنصيفطو الطلب..." : "صيفط الطلب"}</button>
            </form>
            <p className="privacy-note">طلب الموعد كيبقى معلّق حتى يقبلو مقدّم الخدمة. معلوماتك الشخصية ما كاتبانش للعموم.</p>
          </>
        )}
      </section>
    </div>
  );
}

function localDateString() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}
