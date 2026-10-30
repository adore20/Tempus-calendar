import type { CSSProperties } from 'react'
import type { CalendarEvent } from '../types'
import {
  compareEvents,
  eventOverlapsDay,
  formatTime,
  isSameDay,
  monthGridDays,
  weekDays,
} from '../dateUtils'

const MAX_VISIBLE = 3

interface Props {
  date: Date
  events: CalendarEvent[]
  onCreate: (day: Date) => void
  onEdit: (event: CalendarEvent) => void
  onOpenDay: (day: Date) => void
}

export function MonthView({ date, events, onCreate, onEdit, onOpenDay }: Props) {
  const days = monthGridDays(date)
  const today = new Date()

  return (
    <div className="month">
      <div className="month-header">
        {weekDays(date).map((d) => (
          <div key={d.getDay()} className="month-weekday">
            {d.toLocaleDateString(undefined, { weekday: 'short' })}
          </div>
        ))}
      </div>
      <div className="month-grid">
        {days.map((day) => {
          const dayEvents = events.filter((e) => eventOverlapsDay(e, day)).sort(compareEvents)
          const hidden = dayEvents.length - MAX_VISIBLE
          const classes = ['month-cell']
          if (day.getMonth() !== date.getMonth()) classes.push('outside')
          if (isSameDay(day, today)) classes.push('today')

          return (
            <div
              key={day.toISOString()}
              className={classes.join(' ')}
              onClick={() => onCreate(day)}
            >
              <button
                className="month-date"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenDay(day)
                }}
                aria-label={day.toLocaleDateString(undefined, { dateStyle: 'full' })}
              >
                {day.getDate()}
              </button>
              <div className="month-events">
                {dayEvents.slice(0, hidden > 0 ? MAX_VISIBLE - 1 : MAX_VISIBLE).map((event) => (
                  <button
                    key={event.id}
                    className={event.allDay ? 'chip chip-allday' : 'chip'}
                    style={{ '--event-color': event.color } as CSSProperties}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(event)
                    }}
                    title={event.title}
                  >
                    {!event.allDay && <span className="chip-dot" />}
                    {!event.allDay && (
                      <span className="chip-time">{formatTime(new Date(event.start))}</span>
                    )}
                    <span className="chip-title">{event.title || '(No title)'}</span>
                  </button>
                ))}
                {hidden > 0 && (
                  <button
                    className="month-more"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenDay(day)
                    }}
                  >
                    +{hidden + 1} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
