"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProviderCard } from "@/components/provider-card";
import { RequestDialog } from "@/components/request-dialog";
import { useFarar } from "@/components/app-provider";
import { CITIES, PROFESSIONS } from "@/lib/demo-data";
import { hasAvailability, weekdayLabel } from "@/lib/availability";
import type { Provider } from "@/lib/types";

const CATEGORIES = [
  { icon: "⌁", label: "كهربائي" },
  { icon: "◉", label: "سباك" },
  { icon: "▤", label: "تنظيف المنازل" },
  { icon: "⌂", label: "نجار" },
  { icon: "✳", label: "مصممة ديكور" },
  { icon: "✦", label: "حلاقة وتجميل" },
];

export default function HomePage() {
  const { providers, ready } = useFarar();
  const [profession, setProfession] = useState("");
  const [city, setCity] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceTime, setServiceTime] = useState("");
  const [travelOnly, setTravelOnly] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [searched, setSearched] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const filteredProviders = useMemo(() => providers.filter((provider) => {
    if (!provider.profession || !provider.city) return false;
    const professionMatches = !profession || provider.profession === profession;
    const cityMatches = !city || provider.city.toLocaleLowerCase("ar").includes(city.trim().toLocaleLowerCase("ar"));
    const travelMatches = !travelOnly || provider.travelsToClient;
    const timeMatches = !serviceDate || !serviceTime || hasAvailability(provider, serviceDate, serviceTime);
    return professionMatches && cityMatches && travelMatches && timeMatches;
  }), [providers, profession, city, serviceDate, serviceTime, travelOnly]);

  function runSearch() {
    if (Boolean(serviceDate) !== Boolean(serviceTime)) {
      setAvailabilityError("باش نقلبو على وقت الفراغ، اختار التاريخ والساعة بجوج.");
      return;
    }
    setAvailabilityError("");
    setSearched(true);
    document.getElementById("providers")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-inner page-container">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow"><span className="eyebrow-dot" /> خدمات قريبة، من ناس فمدينتك</span>
            <h1>اللي محتاجو<br /><span>كاين قريب منك.</span></h1>
            <p className="hero-description">قلب على مقدّم الخدمة المناسب فمدينتك. شوف التجارب، قارن، وصيفط طلبك فدقايق.</p>
            <div className="hero-actions">
              <a className="button button-primary button-large" href="#search">قلب على خدمة <span aria-hidden="true">←</span></a>
              <Link className="button button-glass button-large" href="/auth?mode=signup">قدّم خدماتك</Link>
            </div>
            <div className="hero-trust">
              <div className="trust-avatars" aria-hidden="true"><span>م</span><span>ي</span><span>س</span><span>+</span></div>
              <p><strong>ناس من مدينتك</strong><br />خدمات قريبة وبطريقة واضحة</p>
            </div>
          </div>
          <div className="hero-art" aria-label="مثال على ملف مقدّم خدمة">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-spark spark-one">✦</div>
            <div className="art-spark spark-two">✳</div>
            <div className="hero-service-card">
              <div className="service-card-top"><span className="live-dot" /> متاح هاد الأسبوع <span className="service-more">•••</span></div>
              <div className="hero-provider-face">ي</div>
              <div className="hero-provider-info"><strong>يوسف العلوي</strong><span>كهربائي · الدار البيضاء</span></div>
              <div className="hero-card-rating"><span>★ 4.9</span><span>38 تقييم</span></div>
              <div className="hero-card-divider" />
              <div className="hero-card-bottom"><span className="tiny-check">✓</span> كيمشي حتى لعندك <span className="mini-arrow">↗</span></div>
            </div>
            <div className="floating-note note-location"><span className="note-icon">⌖</span><span><strong>قريب ليك</strong><small>نفس المدينة</small></span></div>
            <div className="floating-note note-matches"><span className="matches-icon">✦</span><span><strong>مطابقة مناسبة</strong><small>على حسب طلبك</small></span></div>
          </div>
        </div>

        <div className="search-wrap page-container" id="search">
          <form className="search-panel" onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
            <label className="search-field profession-field">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <span className="search-label">شنو الخدمة اللي محتاج؟</span>
              <select aria-label="اختار نوع الخدمة" value={profession} onChange={(event) => setProfession(event.target.value)}>
                <option value="">جميع الخدمات</option>
                {PROFESSIONS.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
            <label className="search-field city-field">
              <span className="search-icon location-search" aria-hidden="true">⌖</span>
              <span className="search-label">فين بغيتي الخدمة؟</span>
              <select aria-label="اختار المدينة" value={city} onChange={(event) => setCity(event.target.value)}>
                <option value="">جميع المدن</option>
                {CITIES.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
            <label className="search-field date-field">
              <span className="search-icon date-search-icon" aria-hidden="true">▦</span>
              <span className="search-label">نهار الخدمة</span>
              <input aria-label="اختار تاريخ الخدمة" type="date" min={localDateString()} value={serviceDate} onChange={(event) => { setServiceDate(event.target.value); setAvailabilityError(""); }} />
            </label>
            <label className="search-field time-field">
              <span className="search-icon time-search-icon" aria-hidden="true">◷</span>
              <span className="search-label">الساعة</span>
              <input aria-label="اختار وقت الخدمة" type="time" value={serviceTime} onChange={(event) => { setServiceTime(event.target.value); setAvailabilityError(""); }} />
            </label>
            <label className="travel-switch">
              <input type="checkbox" checked={travelOnly} onChange={(event) => setTravelOnly(event.target.checked)} />
              <span className="switch-track"><span /></span>
              <span>يجي لعندي</span>
            </label>
            <button className="button button-primary search-button" type="submit">بحث <span aria-hidden="true">⌕</span></button>
          </form>
          {availabilityError ? <p className="search-error-panel" role="alert">{availabilityError}</p> : null}
          <p className="search-caption"><span className="caption-star">✳</span> اختار تاريخاً وساعة باش تشوف شكون متاح لمدة ساعة</p>
        </div>
      </section>

      <section className="category-section page-container">
        <div className="section-heading category-heading">
          <div><p className="eyebrow">خدمات كتحتاجها كل نهار</p><h2>اختار منين تبدا</h2></div>
          <a className="text-link" href="#providers">شوف جميع الخدمات <span aria-hidden="true">←</span></a>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((category, index) => (
            <button className={`category-card category-${index + 1}`} key={category.label} type="button" onClick={() => { setProfession(category.label); runSearch(); }}>
              <span className="category-icon" aria-hidden="true">{category.icon}</span>
              <span>{category.label}</span>
              <span className="category-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section className="providers-section" id="providers">
        <div className="page-container">
          <div className="section-heading providers-heading">
            <div><p className="eyebrow">اختار اللي يناسبك</p><h2>{searched ? "النتائج اللي لقينا ليك" : "ناس خدامين مزيان"}</h2><p className="section-subtitle">{serviceDate && serviceTime ? `متاحين حسب الأوقات المحددة: ${weekdayLabel(serviceDate)} ${serviceDate} مع ${serviceTime}. الموعد كيتأكد من بعد قبول الطلب.` : "شوف الملفات والأوقات اللي صرّحو بها، واختار اللي يناسبك."}</p></div>
            <div className="results-count"><span className="results-count-dot" /> {ready ? `${filteredProviders.length} مقدّم خدمة` : "كنوجدو النتائج..."}</div>
          </div>
          {!ready ? (
            <div className="loading-panel"><span className="loading-spinner" /> كنوجدو ليك مقدّمي الخدمات...</div>
          ) : filteredProviders.length ? (
            <div className="provider-grid">{filteredProviders.map((provider) => <ProviderCard key={provider.id} provider={provider} selectedDate={serviceDate} selectedTime={serviceTime} onRequest={setSelectedProvider} />)}</div>
          ) : (
            <div className="empty-state"><div className="empty-icon">⌕</div><h3>ما لقيناش نتائج بهاد الاختيارات</h3><p>جرّب مدينة أو خدمة أخرى أو وقتاً مختلفاً.</p><button className="button button-outline" type="button" onClick={() => { setProfession(""); setCity(""); setServiceDate(""); setServiceTime(""); setTravelOnly(false); setAvailabilityError(""); }}>حيّد الفلاتر</button></div>
          )}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="page-container">
          <div className="section-heading how-heading"><div><p className="eyebrow">بكل بساطة</p><h2>ثلاث خطوات وكتلقى اللي محتاج</h2></div><p className="section-subtitle">من البحث حتى إرسال الطلب، كلشي واضح وساهل.</p></div>
          <div className="steps-grid">
            <article className="step-card"><span className="step-number">01</span><div className="step-icon step-icon-search">⌕</div><h3>قلب على الخدمة</h3><p>اختار نوع الخدمة والمدينة، وزيد واش بغيتي مقدّم الخدمة يجي لعندك.</p></article>
            <article className="step-card"><span className="step-number">02</span><div className="step-icon step-icon-profile">▣</div><h3>شوف الملفات</h3><p>قرا على التجربة والخدمات، واختار الشخص اللي كيناسب احتياجك.</p></article>
            <article className="step-card"><span className="step-number">03</span><div className="step-icon step-icon-message">↗</div><h3>صيفط طلبك</h3><p>شرح شنو محتاج وتابع حالة الطلب ديالك من لوحة الحساب.</p></article>
          </div>
        </div>
      </section>

      <section className="join-banner page-container">
        <div className="join-banner-content"><span className="eyebrow join-eyebrow">كتقدّم شي خدمة؟</span><h2>خلي الناس يلقاوك<br />وتواصل مع زبناء جداد.</h2><p>أنشئ ملفك فـ faraghe وعرّف الناس بالخدمة ديالك والمدينة اللي كتخدم فيها.</p><Link className="button button-light button-large" href="/auth?mode=signup">سجّل كمقدّم خدمة <span aria-hidden="true">←</span></Link></div>
        <div className="join-banner-art" aria-hidden="true"><div className="join-circle join-circle-large" /><div className="join-circle join-circle-small" /><div className="join-card"><span className="join-card-icon">✓</span><div><strong>ملفك واجد</strong><small>خلي خدمتك تبان</small></div></div><span className="join-spark">✦</span></div>
      </section>

      {selectedProvider ? <RequestDialog provider={selectedProvider} preferredDate={serviceDate} preferredTime={serviceTime} onClose={() => setSelectedProvider(null)} /> : null}
    </>
  );
}

function localDateString() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}
