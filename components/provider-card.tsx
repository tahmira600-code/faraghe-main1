import Link from "next/link";
import { matchingAvailability, WEEKDAYS } from "@/lib/availability";
import type { Provider } from "@/lib/types";

export function ProviderCard({ provider, onRequest, selectedDate = "", selectedTime = "" }: { provider: Provider; onRequest: (provider: Provider) => void; selectedDate?: string; selectedTime?: string }) {
  const matchedSlot = matchingAvailability(provider, selectedDate, selectedTime);
  const hoursPreview = matchedSlot
    ? `${WEEKDAYS.find((day) => day.weekday === matchedSlot.weekday)?.label} ${matchedSlot.start}–${matchedSlot.end}`
    : provider.availability?.slice(0, 2).map((slot) => {
    const dayName = WEEKDAYS.find((day) => day.weekday === slot.weekday)?.label;
    return `${dayName} ${slot.start}–${slot.end}`;
  }).join(" · ");

  return (
    <article className="provider-card">
      <div className="provider-card-top">
        <div className={`provider-avatar avatar-${provider.color}`} aria-hidden="true">{provider.fullName.slice(0, 1)}</div>
        <div className="provider-identity">
          <h3>{provider.fullName}</h3>
          <p>{provider.profession}</p>
        </div>
        <span className="verified-badge" title="ملف على faraghe">✦</span>
      </div>
      <div className="provider-meta">
        <span><span aria-hidden="true">⌖</span> {provider.city || "المدينة غير محددة"}</span>
        <span className="rating"><span aria-hidden="true">★</span> {provider.rating > 0 ? provider.rating.toFixed(1) : "جديد"}<small>{provider.reviewCount ? ` (${provider.reviewCount})` : ""}</small></span>
      </div>
      <p className="provider-bio">{provider.bio || "هذا الملف باقي ما تكملش. تواصل مع مقدّم الخدمة للمزيد من المعلومات."}</p>
      <p className={`provider-hours ${matchedSlot ? "matched-hours" : ""}`}><span aria-hidden="true">◷</span><span>{matchedSlot ? `متاح فالوقت اللي اخترتي: ${hoursPreview}` : hoursPreview || "ما حدّدش أوقات الفراغ بعد"}</span></p>
      <div className="provider-tags">
        <span>{provider.yearsExperience ? `${provider.yearsExperience} سنين ديال الخبرة` : "ملف جديد"}</span>
        {provider.travelsToClient ? <span className="travel-tag"><span aria-hidden="true">➜</span> كيمشي عند الزبون</span> : <span>الخدمة فالمحل</span>}
      </div>
      <div className="provider-card-actions">
        <Link className="button button-outline" href={`/providers/${encodeURIComponent(provider.id)}`}>شوف الملف</Link>
        <button className="button button-primary" type="button" onClick={() => onRequest(provider)}>طلب الخدمة</button>
      </div>
    </article>
  );
}
