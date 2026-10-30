import { useCallback, useEffect, useState } from 'react'
import { EVENT_COLORS } from './types'
import type { CalendarEvent, ViewMode } from './types'
import { addDays, addMonths, formatTitle, startOfDay, weekDays } from './dateUtils'
import { newEventId, useEvents } from './useEvents'
import { MonthView } from './components/MonthView'
import { TimeGrid } from './components/TimeGrid'
import { EventModal } from './components/EventModal'

const VIEWS: { mode: ViewMode; label: string; key: string }[] = [
  { mode: 'month', label: 'Month', key: 'm' },
  { mode: 'week', label: 'Week', key: 'w' },
  { mode: 'day', label: 'Day', key: 'd' },
]

interface Editing {
  event: CalendarEvent
  isNew: boolean
}

function draftEvent(start: Date, allDay: boolean): CalendarEvent {
  const end = allDay ? addDays(start, 1) : new Date(start.getTime() + 60 * 60_000)
  return {
    id: newEventId(),
    title: '',
    start: start.toISOString(),
    end: end.toISOString(),
    allDay,
    color: EVENT_COLORS[0],
    description: '',
  }
}

export default function App() {
  const { events, saveEvent, deleteEvent } = useEvents()
  const [view, setView] = useState<ViewMode>('month')
  const [date, setDate] = useState(() => startOfDay(new Date()))
  const [editing, setEditing] = useState<Editing | null>(null)

  const step = useCallback(
    (dir: 1 | -1) => {
      setDate((d) =>
        view === 'month' ? addMonths(d, dir) : addDays(d, view === 'week' ? 7 * dir : dir),
      )
    },
    [view],
  )

  const create = useCallback((start: Date, allDay: boolean) => {
    setEditing({ event: draftEvent(start, allDay), isNew: true })
  }, [])

  const createAtNextHour = useCallback(() => {
    const now = new Date()
    const start = new Date(date)
    start.setHours(Math.min(now.getHours() + 1, 23), 0, 0, 0)
    create(start, false)
  }, [date, create])

  const openDay = (day: Date) => {
    setDate(startOfDay(day))
    setView('day')
  }

  const closeModal = useCallback(() => setEditing(null), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select')) return
      const key = e.key.toLowerCase()
      const match = VIEWS.find((v) => v.key === key)
      if (match) setView(match.mode)
      else if (key === 't') setDate(startOfDay(new Date()))
      else if (key === 'n' || key === 'c') createAtNextHour()
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'ArrowRight') step(1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, step, createAtNextHour])

  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="4.5" width="18" height="16" rx="3" />
            <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
          </svg>
          Tempus
        </div>
        <button className="btn" onClick={() => setDate(startOfDay(new Date()))} title="Today (T)">
          Today
        </button>
        <div className="nav">
          <button className="icon-btn" onClick={() => step(-1)} aria-label="Previous">
            ‹
          </button>
          <button className="icon-btn" onClick={() => step(1)} aria-label="Next">
            ›
          </button>
        </div>
        <h1 className="title">{formatTitle(date, view)}</h1>
        <span className="spacer" />
        <div className="segmented" role="tablist">
          {VIEWS.map((v) => (
            <button
              key={v.mode}
              role="tab"
              aria-selected={view === v.mode}
              className={view === v.mode ? 'active' : ''}
              onClick={() => setView(v.mode)}
              title={`${v.label} (${v.key.toUpperCase()})`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button className="btn primary" onClick={createAtNextHour} title="New event (N)">
          + New event
        </button>
      </header>

      <main className="main">
        {view === 'month' ? (
          <MonthView
            date={date}
            events={events}
            onCreate={(day) => {
              const start = new Date(day)
              start.setHours(9)
              create(start, false)
            }}
            onEdit={(event) => setEditing({ event, isNew: false })}
            onOpenDay={openDay}
          />
        ) : (
          <TimeGrid
            days={view === 'week' ? weekDays(date) : [date]}
            events={events}
            onCreate={create}
            onEdit={(event) => setEditing({ event, isNew: false })}
            onOpenDay={openDay}
          />
        )}
      </main>

      {editing && (
        <EventModal
          key={editing.event.id}
          event={editing.event}
          isNew={editing.isNew}
          onSave={(event) => {
            saveEvent(event)
            setEditing(null)
          }}
          onDelete={(id) => {
            deleteEvent(id)
            setEditing(null)
          }}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
