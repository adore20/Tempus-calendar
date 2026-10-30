export type ViewMode = 'month' | 'week' | 'day'

export interface CalendarEvent {
  id: string
  title: string
  /** ISO timestamp. For all-day events this is local midnight of the first day. */
  start: string
  /** ISO timestamp, exclusive. For all-day events this is local midnight after the last day. */
  end: string
  allDay: boolean
  color: string
  description: string
}

export const EVENT_COLORS = [
  '#4f6bed',
  '#0f9d76',
  '#e8833a',
  '#d64561',
  '#8e5bd6',
  '#5a6b7d',
] as const
