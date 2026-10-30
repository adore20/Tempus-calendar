import { useCallback, useEffect, useState } from 'react'
import type { CalendarEvent } from './types'

const STORAGE_KEY = 'tempus-calendar:events'

function load(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as CalendarEvent[]) : []
  } catch {
    return []
  }
}

export function newEventId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Events persisted to localStorage. */
export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
    } catch {
      // Storage may be unavailable (private mode, quota); keep working in memory.
    }
  }, [events])

  const saveEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => {
      const index = prev.findIndex((e) => e.id === event.id)
      if (index === -1) return [...prev, event]
      const next = prev.slice()
      next[index] = event
      return next
    })
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { events, saveEvent, deleteEvent }
}
