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

export function getDateDaysAgo(days: number) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return formatter.format(cutoff)
}

// Every YYYY-MM-DD between start and end, inclusive — used to scaffold a full
// calendar range for time-series charts so days with no data show as zero
// rather than creating a gap.
export function getDateRange(start: string, end: string): string[] {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  const startUTC = Date.UTC(startYear, startMonth - 1, startDay)
  const endUTC = Date.UTC(endYear, endMonth - 1, endDay)

  const dates: string[] = []
  for (let t = startUTC; t <= endUTC; t += 24 * 60 * 60 * 1000) {
    dates.push(formatter.format(new Date(t)))
  }
  return dates
}

// How far back staff can log their own entries (My Entries / My Stock Entries) — a
// same-week correction window, not unlimited backdating. Admin isn't bound by this.
export const ENTRY_BACKDATE_WINDOW_DAYS = 7

export function getEarliestEntryDateString() {
  return getDateDaysAgo(ENTRY_BACKDATE_WINDOW_DAYS)
}

export function isWithinEntryWindow(date: string) {
  return date >= getEarliestEntryDateString() && date <= getTodayDateString()
}
