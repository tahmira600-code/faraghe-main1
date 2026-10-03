"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useFarar } from "@/components/app-provider";
import { RequestDialog } from "@/components/request-dialog";
import { WEEKDAYS } from "@/lib/availability";
import { useState } from "react";
import type { Provider } from "@/lib/types";

export default function ProviderPage() {
  const params = useParams<{ id: string }>();
  const { providers, ready } = useFarar();
  const [selected, setSelected] = useState<Provider | null>(null);
  const provider = providers.find((item) => item.id === decodeURIComponent(params.id));

  if (!ready) return <div className="page-container"><div className="loading-panel dashboard-loading"><span className="loading-spinner" /> كنوجدو الملف...</div></div>;
  if (!provider) return <section className="not-found page-container"><span>⌕</span><h1>ما لقيناش هاد الملف</h1><p>يمكن الرابط ما بقاش صالح أو الملف تحيّد.</p><Link className="button button-primary" href="/">رجوع للصفحة الرئيسية</Link></section>;

  return (
    <section className="provider-detail page-container">
      <Link className="back-link" href="/#providers"><span aria-hidden="true">→</span> رجوع لمقدّمي الخدمات</Link>
      <div className="provider-detail-grid">
        <article className="detail-main-card">
          <div className="detail-cover"><span className="detail-cover-shape" /><span className="detail-cover-dot">✦</span></div>
          <div className="detail-profile-heading"><div className={`provider-avatar detail-avatar avatar-${provider.color}`}>{provider.fullName.slice(0, 1)}</div><div><p className="eyebrow">مقدّم خدمة على faraghe</p><h1>{provider.fullName}</h1><p className="detail-profession">{provider.profession}</p></div><span className="verified-badge detail-verified" title="ملف على faraghe">✦</span></div>
          <div className="detail-divider" />
          <div className="detail-facts"><div><span className="fact-icon">⌖</span><span><small>المدينة</small><strong>{provider.city}</strong></span></div><div><span className="fact-icon">◷</span><span><small>الخبرة</small><strong>{provider.yearsExperience ? `${provider.yearsExperience} سنين` : "ملف جديد"}</strong></span></div><div><span className="fact-icon fact-star">★</span><span><small>التقييم</small><strong>{provider.rating > 0 ? `${provider.rating.toFixed(1)} (${provider.reviewCount} تقييم)` : "مازال جديد"}</strong></span></div></div>
          <div className="detail-about"><p className="eyebrow">على الخدمة</p><h2>نبذة</h2><p>{provider.bio || "مقدّم الخدمة باقي ما كملش النبذة ديالو. صيفط طلب باش تسولو على التفاصيل."}</p></div>
          <div className="detail-schedule"><p className="eyebrow">الأوقات المتاحة</p><h2>البرنامج الأسبوعي</h2>
            {provider.availability?.length ? <div className="detail-schedule-list">{WEEKDAYS.map((day) => {
              const slots = provider.availability.filter((slot) => slot.weekday === day.weekday);
              if (!slots.length) return null;
              return <div className="detail-schedule-row" key={day.weekday}><strong>{day.label}</strong><span>{slots.map((slot) => `${slot.start}–${slot.end}`).join("، ")}</span></div>;
            })}</div> : <p className="detail-schedule-empty">مازال ما تحددوش أوقات الفراغ.</p>}
            <small>الموعد كيتأكد غير من بعد ما يقبل مقدّم الخدمة الطلب.</small>
          </div>
        </article>
        <aside className="detail-aside">
          <div className="contact-card"><p className="eyebrow">باغي الخدمة؟</p><h2>صيفط طلب<br />بلا التزام</h2><p>شرح شنو محتاج، واختار وقت مناسب. غادي تقدر تتابع الطلب من حسابك.</p><div className="contact-availability"><span className={provider.travelsToClient ? "availability-check" : "availability-dot"}>{provider.travelsToClient ? "✓" : "•"}</span><span>{provider.travelsToClient ? "مستعد يمشي عندك" : "الخدمة فمكان مقدّمها"}</span></div><button className="button button-primary button-full" type="button" onClick={() => setSelected(provider)}>طلب الخدمة <span aria-hidden="true">←</span></button><small className="contact-footnote">تواصل آمن عبر طلب الخدمة فـ faraghe.</small></div>
          <div className="detail-safety"><span className="safety-icon">✓</span><div><strong>طلبك واضح</strong><p>مقدّم الخدمة يقدر يقبل الطلب أو يعتذر من لوحة الحساب.</p></div></div>
        </aside>
      </div>
      {selected ? <RequestDialog provider={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
