export interface CalendarEventDetails {
  title: string;
  description?: string;
  location?: string;
  date?: string; // e.g. "Sat, Oct 18" or "2026-10-18"
  time?: string; // e.g. "9:00 AM"
}

function parseEventDateTimes(dateStr?: string, timeStr?: string): { startIso: string; endIso: string } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate() + ((6 - now.getDay() + 7) % 7 || 7); // Default to upcoming Saturday

  if (dateStr) {
    const parts = dateStr.match(/(\w+)\s+(\d+)/);
    if (parts) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const mIdx = monthNames.indexOf(parts[1].toLowerCase().slice(0, 3));
      if (mIdx !== -1) month = mIdx;
      day = parseInt(parts[2], 10);
    }
  }

  let hour = 10;
  let minute = 0;
  if (timeStr) {
    const tParts = timeStr.match(/(\d+):?(\d+)?\s*(am|pm)?/i);
    if (tParts) {
      hour = parseInt(tParts[1], 10);
      minute = tParts[2] ? parseInt(tParts[2], 10) : 0;
      const isPm = tParts[3]?.toLowerCase() === 'pm';
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour === 12 && tParts[3]) hour = 0;
    }
  }

  const startDate = new Date(year, month, day, hour, minute);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours duration

  const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  return {
    startIso: formatGCal(startDate),
    endIso: formatGCal(endDate),
  };
}

export function createGoogleCalendarUrl(event: CalendarEventDetails): string {
  const { startIso, endIso } = parseEventDateTimes(event.date, event.time);
  const text = encodeURIComponent(event.title || 'Weekend Quest Adventure');
  const details = encodeURIComponent(
    (event.description || 'Planned on Weekend Quest — Make this weekend count!') +
      '\n\nOrganized via Weekend Quest: Lock plans by Thursday night, adventures on Saturday.'
  );
  const location = encodeURIComponent(event.location || 'Local Meetup');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

export function downloadIcsFile(event: CalendarEventDetails): void {
  const { startIso, endIso } = parseEventDateTimes(event.date, event.time);
  const uid = `quest-${Date.now()}@weekend.quest`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Weekend Quest//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${startIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${event.title || 'Weekend Quest'}`,
    `DESCRIPTION:${(event.description || 'Weekend Quest adventure').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || 'Meetup'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${(event.title || 'weekend-quest').toLowerCase().replace(/\s+/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
