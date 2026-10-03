import type { AvailabilitySlot, Provider } from "@/lib/types";

export const WEEKDAYS = [
  { weekday: 1, label: "الاثنين" },
  { weekday: 2, label: "الثلاثاء" },
  { weekday: 3, label: "الأربعاء" },
  { weekday: 4, label: "الخميس" },
  { weekday: 5, label: "الجمعة" },
  { weekday: 6, label: "السبت" },
  { weekday: 7, label: "الأحد" },
];

export function hasAvailability(provider: Provider, date: string, time: string, durationMinutes = 60) {
  return Boolean(matchingAvailability(provider, date, time, durationMinutes));
}

export function matchingAvailability(provider: Provider, date: string, time: string, durationMinutes = 60) {
  if (!date || !time || !provider.availability?.length) return undefined;
  const selectedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(selectedDate.getTime())) return undefined;
  const weekday = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
  const [hours, minutes] = time.split(":").map(Number);
  const requestedStart = hours * 60 + minutes;
  const requestedEnd = requestedStart + durationMinutes;
  return provider.availability.find((slot) =>
    slot.weekday === weekday &&
    toMinutes(slot.start) <= requestedStart &&
    toMinutes(slot.end) >= requestedEnd,
  );
}

export function validateAvailability(slots: AvailabilitySlot[]) {
  for (const slot of slots) {
    if (!slot.start || !slot.end || toMinutes(slot.end) <= toMinutes(slot.start)) {
      return "تأكد أن وقت النهاية جاي من بعد وقت البداية.";
    }
  }

  for (const day of WEEKDAYS) {
    const daySlots = slots.filter((slot) => slot.weekday === day.weekday).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let index = 1; index < daySlots.length; index += 1) {
      if (toMinutes(daySlots[index].start) < toMinutes(daySlots[index - 1].end)) {
        return `كاين تداخل بين أوقات ${day.label}. عدّل الفترات باش ما يتداخلوش.`;
      }
    }
  }
  return "";
}

export function weekdayLabel(date: string) {
  const selectedDate = new Date(`${date}T12:00:00`);
  const weekday = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
  return WEEKDAYS.find((day) => day.weekday === weekday)?.label ?? "";
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
