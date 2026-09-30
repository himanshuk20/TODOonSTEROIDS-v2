const INDIA_TIME_ZONE = 'Asia/Kolkata';

export function getIndiaDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatIndiaDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getIndiaGreeting(date: Date): string {
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date));

  if (hour >= 4 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 16) return 'Good afternoon';
  if (hour >= 16 && hour < 20) return 'Good evening';
  return 'Good night';
}
