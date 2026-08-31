const SHOWROOM_TIMEZONE = 'Asia/Kolkata'

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SHOWROOM_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function getTodayDateString() {
  return formatter.format(new Date())
}

export function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

// How far back staff can log their own entries (My Entries / My Stock Entries) — a
// same-week correction window, not unlimited backdating. Admin isn't bound by this.
export const ENTRY_BACKDATE_WINDOW_DAYS = 7

export function getEarliestEntryDateString() {
  const cutoff = new Date(Date.now() - ENTRY_BACKDATE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  return formatter.format(cutoff)
}

export function isWithinEntryWindow(date: string) {
  return date >= getEarliestEntryDateString() && date <= getTodayDateString()
}
