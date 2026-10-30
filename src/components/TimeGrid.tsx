import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import type { CalendarEvent } from '../types'
import {
  MS_PER_MINUTE,
  addDays,
  compareEvents,
  eventOverlapsDay,
  formatHour,
  formatTime,
  isSameDay,
  startOfDay,
} from '../dateUtils'

const HOUR_HEIGHT = 48
const MINUTES_PER_DAY = 24 * 60
const MIN_EVENT_MINUTES = 20
const HOURS = Array.from({ length: 24 }, (_, h) => h)

interface Props {
  days: Date[]
  events: CalendarEvent[]
  onCreate: (start: Date, allDay: boolean) => void
  onEdit: (event: CalendarEvent) => void
  onOpenDay: (day: Date) => void
}

interface PlacedEvent {
  event: CalendarEvent
  top: number
  height: number
  lane: number
  lanes: number
}

/** Positions a day's timed events, splitting overlapping events into side-by-side lanes. */
function layoutDay(day: Date, events: CalendarEvent[]): PlacedEvent[] {
  const dayStart = startOfDay(day).getTime()
  const dayEnd = addDays(startOfDay(day), 1).getTime()
  const items = events
    .map((event) => {
      const start = Math.max(new Date(event.start).getTime(), dayStart)
      const end = Math.min(new Date(event.end).getTime(), dayEnd)
      const startMin = (start - dayStart) / MS_PER_MINUTE
      const endMin = Math.max((end - dayStart) / MS_PER_MINUTE, startMin + MIN_EVENT_MINUTES)
      return { event, startMin, endMin: Math.min(endMin, MINUTES_PER_DAY) }
    })
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin)

  const placed: PlacedEvent[] = []
  let cluster: { item: (typeof items)[number]; lane: number }[] = []
  let laneEnds: number[] = []
  let clusterEnd = -1

  const flush = () => {
    for (const { item, lane } of cluster) {
      placed.push({
        event: item.event,
        top: (item.startMin / 60) * HOUR_HEIGHT,
        height: ((item.endMin - item.startMin) / 60) * HOUR_HEIGHT,
        lane,
        lanes: laneEnds.length,
      })
    }
    cluster = []
    laneEnds = []
  }

  for (const item of items) {
    if (item.startMin >= clusterEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= item.startMin)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(item.endMin)
    } else {
      laneEnds[lane] = item.endMin
    }
    cluster.push({ item, lane })
    clusterEnd = Math.max(clusterEnd, item.endMin)
  }
  flush()
  return placed
}

function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function TimeGrid({ days, events, onCreate, onEdit, onOpenDay }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollbar, setScrollbar] = useState(0)
  const now = useNow()
  const columns = { '--days': days.length } as CSSProperties

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Start the view at 7am rather than midnight.
    el.scrollTop = HOUR_HEIGHT * 7 - 8
    // Pad the header by the scrollbar width so its columns line up with the body.
    setScrollbar(el.offsetWidth - el.clientWidth)
  }, [])

  const handleGridClick = (day: Date, e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const minutes = ((e.clientY - rect.top) / HOUR_HEIGHT) * 60
    const snapped = Math.floor(minutes / 30) * 30
    const start = startOfDay(day)
    start.setMinutes(snapped)
    onCreate(start, false)
  }

  return (
    <div className="timegrid" style={{ '--scrollbar': `${scrollbar}px` } as CSSProperties}>
      <div className="timegrid-head" style={columns}>
        <div className="gutter" />
        {days.map((day) => (
          <button
            key={day.toISOString()}
            className={isSameDay(day, now) ? 'timegrid-day today' : 'timegrid-day'}
            onClick={() => onOpenDay(day)}
          >
            <span className="timegrid-weekday">
              {day.toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
            <span className="timegrid-date">{day.getDate()}</span>
          </button>
        ))}
      </div>

      <div className="timegrid-allday" style={columns}>
        <div className="gutter allday-label">All day</div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="allday-cell"
            onClick={() => onCreate(startOfDay(day), true)}
          >
            {events
              .filter((e) => e.allDay && eventOverlapsDay(e, day))
              .sort(compareEvents)
              .map((event) => (
                <button
                  key={event.id}
                  className="chip chip-allday"
                  style={{ '--event-color': event.color } as CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(event)
                  }}
                  title={event.title}
                >
                  <span className="chip-title">{event.title || '(No title)'}</span>
                </button>
              ))}
          </div>
        ))}
      </div>

      <div className="timegrid-scroll" ref={scrollRef}>
        <div className="timegrid-body" style={columns}>
          <div className="gutter hours">
            {HOURS.map((h) => (
              <div key={h} className="hour-label" style={{ height: HOUR_HEIGHT }}>
                {h > 0 && <span>{formatHour(h)}</span>}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const timed = events.filter((e) => !e.allDay && eventOverlapsDay(e, day))
            const showNow = isSameDay(day, now)
            const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT
            return (
              <div
                key={day.toISOString()}
                className="day-column"
                style={{ height: HOUR_HEIGHT * 24 }}
                onClick={(e) => handleGridClick(day, e)}
              >
                {layoutDay(day, timed).map(({ event, top, height, lane, lanes }) => (
                  <button
                    key={event.id}
                    className={height < HOUR_HEIGHT * 0.75 ? 'block compact' : 'block'}
                    style={
                      {
                        '--event-color': event.color,
                        top,
                        height,
                        left: `calc(${(lane / lanes) * 100}% + 2px)`,
                        width: `calc(${100 / lanes}% - 4px)`,
                      } as CSSProperties
                    }
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(event)
                    }}
                    title={event.title}
                  >
                    <span className="block-title">{event.title || '(No title)'}</span>
                    <span className="block-time">
                      {formatTime(new Date(event.start))} – {formatTime(new Date(event.end))}
                    </span>
                  </button>
                ))}
                {showNow && <div className="now-line" style={{ top: nowTop }} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
