import type { CalendarEvent } from './types'

export const MS_PER_MINUTE = 60_000

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes())
}

export function addMonths(d: Date, n: number): Date {
  // Clamp to the last day of the target month so Jan 31 + 1 month lands on Feb 28/29.
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), lastDay))
  return target
}

export function startOfWeek(d: Date): Date {
  const day = startOfDay(d)
  return addDays(day, -day.getDay())
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** The 42 days (6 weeks) shown in a month grid, starting on a Sunday. */
export function monthGridDays(d: Date): Date[] {
  const first = startOfWeek(new Date(d.getFullYear(), d.getMonth(), 1))
  return Array.from({ length: 42 }, (_, i) => addDays(first, i))
}

export function weekDays(d: Date): Date[] {
  const first = startOfWeek(d)
  return Array.from({ length: 7 }, (_, i) => addDays(first, i))
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** YYYY-MM-DD in local time, for <input type="date">. */
export function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** HH:MM in local time, for <input type="time">. */
export function toTimeInput(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromInputs(date: string, time: string): Date {
  const [y, m, day] = date.split('-').map(Number)
  const [h, min] = (time || '00:00').split(':').map(Number)
  return new Date(y, m - 1, day, h, min)
}

export function eventOverlapsDay(event: CalendarEvent, day: Date): boolean {
  const dayStart = startOfDay(day).getTime()
  const dayEnd = addDays(startOfDay(day), 1).getTime()
  const start = new Date(event.start).getTime()
  const end = new Date(event.end).getTime()
  // Zero-length events still show on their start day.
  return start < dayEnd && (end > dayStart || (end === start && start >= dayStart))
}

export function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
  return a.start.localeCompare(b.start) || b.end.localeCompare(a.end)
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const hourFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric' })

export function formatTime(d: Date): string {
  return timeFormat.format(d)
}

export function formatHour(hour: number): string {
  return hourFormat.format(new Date(2000, 0, 1, hour))
}

export function formatTitle(d: Date, view: 'month' | 'week' | 'day'): string {
  if (view === 'month') {
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }
  if (view === 'day') {
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }
  const days = weekDays(d)
  const first = days[0]
  const last = days[6]
  if (first.getMonth() === last.getMonth()) {
    return `${first.toLocaleDateString(undefined, { month: 'long' })} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`
  }
  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const sameYear = first.getFullYear() === last.getFullYear()
  return `${first.toLocaleDateString(undefined, sameYear ? fmt : { ...fmt, year: 'numeric' })} – ${last.toLocaleDateString(undefined, { ...fmt, year: 'numeric' })}`
}
