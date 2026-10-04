"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useFarar } from "@/components/app-provider";
import { validateAvailability, WEEKDAYS } from "@/lib/availability";
import { CITIES, PROFESSIONS } from "@/lib/demo-data";
import type { MatchRequest, ProviderDraft } from "@/lib/types";

const EMPTY_PROFILE: ProviderDraft = {
  fullName: "",
  profession: "",
  city: "",
  bio: "",
  yearsExperience: 0,
  travelsToClient: false,
  availability: [],
};

function statusText(status: MatchRequest["status"]) {
  if (status === "accepted") return "تقبل الطلب";
  if (status === "declined") return "مرفوض";
  return "كنستناو الجواب";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, providers, requests, ready, saveProvider, updateRequestStatus } = useFarar();
  const [profile, setProfile] = useState<ProviderDraft>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [updatingRequest, setUpdatingRequest] = useState("");

  const isAdmin = user?.email === "Tahmira600@gmail.com";

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    const existing = providers.find((item) => item.id === user.id);
    if (existing) {
      setProfile({
        fullName: existing.fullName,
        profession: existing.profession,
        city: existing.city,
        bio: existing.bio,
        yearsExperience: existing.yearsExperience,
        travelsToClient: existing.travelsToClient,
        availability: existing.availability ?? [],
      });
    } else {
      setProfile({ ...EMPTY_PROFILE, fullName: user.name });
    }
  }, [ready, user, providers, router]);

  if (!ready || !user) return <div className="page-container"><div className="loading-panel dashboard-loading"><span className="loading-spinner" /> كنوجدو لوحة الحساب...</div></div>;

  const displayRequests = isAdmin ? requests : requests.filter((request) => user.role === "provider" ? request.providerId === user.id : request.clientId === user.id);

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile.availability.length) {
      setError("زيد على الأقل فترة وحدة ديال وقت الفراغ باش الزبناء يقدرو يلقاو المواعيد المناسبة.");
      setMessage("");
      return;
    }
    const scheduleError = validateAvailability(profile.availability);
    if (scheduleError) {
      setError(scheduleError);
      setMessage("");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await saveProvider(profile);
      setMessage("تحفظ الملف ديالك بنجاح. دابا يقدر يبان فنتائج البحث.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ما قدرناش نحفظو الملف.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(requestId: string, status: "accepted" | "declined") {
    setUpdatingRequest(requestId);
    setError("");
    try {
      await updateRequestStatus(requestId, status);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ما قدرناش نحدّثو الطلب.");
    } finally {
      setUpdatingRequest("");
    }
  }

  function addAvailability(weekday: number) {
    setProfile((current) => ({
      ...current,
      availability: [...current.availability, { weekday, start: "09:00", end: "17:00" }],
    }));
  }

  function updateAvailability(index: number, field: "start" | "end", value: string) {
    setProfile((current) => ({
      ...current,
      availability: current.availability.map((slot, slotIndex) => slotIndex === index ? { ...slot, [field]: value } : slot),
    }));
  }

  function removeAvailability(index: number) {
    setProfile((current) => ({ ...current, availability: current.availability.filter((_, slotIndex) => slotIndex !== index) }));
  }

  return (
    <section className="dashboard-page page-container">
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">لوحة الحساب</p>
          <h1>مرحبا، {user.name} {isAdmin && "(المشرف العام)"}</h1>
          <p>{isAdmin ? "لوحة التحكم الخاصة بإدارة المنصة ومتابعة المسجلين والطلبات." : user.role === "provider" ? "كمّل الملف ديالك باش الزبناء يلقاو الخدمة ديالك." : "تابع طلبات الخدمات اللي صيفطتي."}</p>
        </div>
        <Link className="button button-outline" href="/">رجوع للرئيسية <span aria-hidden="true">↗</span></Link>
      </div>

      {/* لوحة تحكم المشرف (تظهر لك وحدك وبشكل واضح) */}
      {isAdmin && (
        <div style={{ background: "#1e293b", color: "#fff", padding: "24px", borderRadius: "12px", marginBottom: "28px", border: "2px solid #3b82f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <span style={{ background: "#3b82f6", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>مشرف المنصة (Admin Panel)</span>
              <h2 style={{ margin: "10px 0 4px", fontSize: "22px" }}>إدارة منصة Faraghe</h2>
              <p style={{ margin: 0, color: "#cbd5e1" }}>أنت تملك صلاحيات المشرف الكاملة على المنصة.</p>
            </div>
            <div style={{ fontSize: "32px" }}>⚡</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
            <div style={{ background: "#0f172a", padding: "15px", borderRadius: "8px", border: "1px solid #334155" }}>
              <p style={{ margin: "0 0 5px", color: "#94a3b8", fontSize: "14px" }}>إجمالي مقدمي الخدمات</p>
              <h3 style={{ margin: 0, fontSize: "24px", color: "#38bdf8" }}>{providers.length}</h3>
            </div>
            <div style={{ background: "#0f172a", padding: "15px", borderRadius: "8px", border: "1px solid #334155" }}>
              <p style={{ margin: "0 0 5px", color: "#94a3b8", fontSize: "14px" }}>إجمالي الطلبات في المنصة</p>
              <h3 style={{ margin: 0, fontSize: "24px", color: "#38bdf8" }}>{requests.length}</h3>
            </div>
          </div>

          <div style={{ background: "#0f172a", padding: "15px", borderRadius: "8px", border: "1px solid #334155" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "16px", color: "#f8fafc" }}>قائمة مقدمي الخدمات المسجلين حالياً:</h3>
            {providers.length > 0 ? (
              <ul style={{ margin: 0, paddingRight: "20px", color: "#e2e8f0" }}>
                {providers.map((p) => (
                  <li key={p.id} style={{ marginBottom: "8px" }}>
                    <strong>{p.fullName}</strong> — <span style={{ color: "#38bdf8" }}>{p.profession}</span> ({p.city}) - سنين الخبرة: {p.yearsExperience}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: "#94a3b8" }}>لا يوجد مقدمو خدمات مسجلون حتى الآن.</p>
            )}
          </div>
        </div>
      )}

      {/* استمارة الملف المهني (تظهر فقط للمزودين العاديين، ومخفية عنك تماماً) */}
      {!isAdmin && user.role === "provider" && (
        <div className="dashboard-grid">
          <section className="dashboard-panel profile-panel">
            <div className="panel-heading"><div><p className="eyebrow">الملف المهني</p><h2>عرّف الناس بخدمتك</h2></div><span className="panel-step">1 / 1</span></div>
            <p className="panel-intro">المعلومات اللي هنا غادي تبان فملفك للناس اللي كيقلبو على خدمات فمدينتك.</p>
            <form className="stacked-form profile-form" onSubmit={handleProfileSave}>
              <div className="form-row"><div><label htmlFor="profile-name">الاسم الكامل</label><input id="profile-name" required minLength={2} value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} /></div><div><label htmlFor="profile-profession">المهنة أو نوع الخدمة</label><select id="profile-profession" required value={profile.profession} onChange={(event) => setProfile({ ...profile, profession: event.target.value })}><option value="">اختار المهنة</option>{PROFESSIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>
              <div className="form-row"><div><label htmlFor="profile-city">المدينة</label><select id="profile-city" required value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })}><option value="">اختار المدينة</option>{CITIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div><label htmlFor="profile-experience">سنين الخبرة</label><input id="profile-experience" type="number" min="0" max="60" value={profile.yearsExperience} onChange={(event) => setProfile({ ...profile, yearsExperience: Number(event.target.value) })} /></div></div>
              <div><label htmlFor="profile-bio">نبذة على الخدمة</label><textarea id="profile-bio" required minLength={20} maxLength={500} rows={5} value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="شرح شنو كتقدّم، كيفاش كتخدم، وأي تفاصيل تعاون الزبناء ياخذو فكرة..." /><small className="field-hint">{profile.bio.length} / 500 حرف</small></div>
              <section className="availability-editor" aria-labelledby="availability-heading">
                <div className="availability-editor-heading"><div><label id="availability-heading">أوقات الفراغ الأسبوعية</label><p>دخل الفترات اللي كتكون فيها متاح. تقدر تزيد أكثر من فترة فالنهار.</p></div><span className="schedule-required">مطلوب</span></div>
                <div className="schedule-day-list">{WEEKDAYS.map((day) => {
                  const slots = profile.availability.map((slot, index) => ({ slot, index })).filter(({ slot }) => slot.weekday === day.weekday);
                  return (
                    <div className="schedule-day-row" key={day.weekday}>
                      <div className="schedule-day-name">{day.label}</div>
                      <div className="schedule-slots">
                        {slots.length ? slots.map(({ slot, index }) => (
                          <div className="schedule-slot" key={`${day.weekday}-${index}`}>
                            <input aria-label={`بداية التوفر يوم ${day.label}`} type="time" required value={slot.start} onChange={(event) => updateAvailability(index, "start", event.target.value)} />
                            <span>حتى</span>
                            <input aria-label={`نهاية التوفر يوم ${day.label}`} type="time" required value={slot.end} onChange={(event) => updateAvailability(index, "end", event.target.value)} />
                            <button className="remove-slot" type="button" aria-label={`حذف الفترة يوم ${day.label}`} onClick={() => removeAvailability(index)}>×</button>
                          </div>
                        )) : <span className="no-day-hours">ما كاينش وقت محدد</span>}
                        <button className="add-slot" type="button" onClick={() => addAvailability(day.weekday)}>+ زيد فترة</button>
                      </div>
                    </div>
                  );
                })}</div>
                <small className="field-hint">مثال: الاثنين من 18:00 حتى 21:00. الموعد كيتحجز لمدة ساعة وكيحتاج تأكيد مقدّم الخدمة.</small>
              </section>
              <label className="checkbox-field"><input type="checkbox" checked={profile.travelsToClient} onChange={(event) => setProfile({ ...profile, travelsToClient: event.target.checked })} /><span className="custom-checkbox">✓</span><span>نقدر نمشي عند الزبون فمدينتي</span></label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {message ? <p className="form-notice" role="status">{message}</p> : null}
              <button className="button button-primary" type="submit" disabled={saving}>{saving ? "كنحفظو..." : "حفظ الملف"}<span aria-hidden="true">←</span></button>
            </form>
          </section>
          <aside className="dashboard-side">
            <div className="dashboard-tip"><span className="tip-icon">✳</span><p className="eyebrow">نصيحة صغيرة</p><h3>النبذة الواضحة كتعاون الزبون يختارك</h3><p>ذكر الخدمات اللي كتقدّم، المدن أو الأحياء اللي كتخدم فيهم، والمدة اللي عندك فالخدمة.</p></div>
            <div className="dashboard-summary"><span className="summary-icon">▣</span><div><strong>{profile.profession && profile.city ? "ملفك واجد للظهور" : "كمّل معلومات الملف"}</strong><p>{profile.profession && profile.city ? "يقدر يبان فنتائج البحث." : "اختار المهنة والمدينة باش يبان الملف."}</p></div></div>
          </aside>
        </div>
      )}

      {/* ملاحظة الزبون العادي */}
      {!isAdmin && user.role === "client" && (
        <div className="client-note"><span className="client-note-icon">⌕</span><div><h2>قلب على الخدمة اللي محتاج</h2><p>اختار مقدّم خدمة وصيفط طلب، وغادي تلقى الحالة ديالو هنا.</p></div><Link className="button button-primary" href="/#providers">قلب على خدمة <span aria-hidden="true">←</span></Link></div>
      )}

      {/* قسم الطلبات (يظهر للمشرف وللجميع) */}
      <section className="requests-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">تواصل وطلبات</p>
            <h2>{isAdmin ? "جميع طلبات المنصة (متابعة المشرف)" : user.role === "provider" ? "الطلبات اللي وصلوك" : "الطلبات ديالك"}</h2>
          </div>
          <span className="request-count">{displayRequests.length} طلب</span>
        </div>
        {error && user.role === "provider" ? <p className="form-error" role="alert">{error}</p> : null}
        {displayRequests.length ? (
          <div className="request-list">
            {displayRequests.map((request) => (
              <article className="request-row" key={request.id}>
                <div className="request-row-icon" aria-hidden="true">{request.clientName.slice(0, 1)}</div>
                <div className="request-main">
                  <div className="request-title-row">
                    <h3>{request.clientName} ➔ {request.providerName}</h3>
                    <span className={`status-pill status-${request.status}`}>{statusText(request.status)}</span>
                  </div>
                  <p>{request.message}</p>
                  <span className="request-date">موعد الخدمة: {request.preferredDate} مع {request.preferredTime.slice(0, 5)}</span>
                </div>
                {(isAdmin || user.role === "provider") && request.status === "pending" ? (
                  <div className="request-actions">
                    <button className="button button-outline" type="button" disabled={updatingRequest === request.id} onClick={() => handleStatus(request.id, "declined")}>اعتذار</button>
                    <button className="button button-primary" type="button" disabled={updatingRequest === request.id} onClick={() => handleStatus(request.id, "accepted")}>قبول</button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-request"><span aria-hidden="true">✦</span><p>ما كاين حتى طلب دابا. ملي يكون شي تحديث، غادي يبان هنا.</p></div>
        )}
      </section>
    </section>
  );
}
