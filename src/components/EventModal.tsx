import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { EVENT_COLORS } from '../types'
import type { CalendarEvent } from '../types'
import { addDays, fromInputs, startOfDay, toDateInput, toTimeInput } from '../dateUtils'

interface Props {
  event: CalendarEvent
  isNew: boolean
  onSave: (event: CalendarEvent) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function EventModal({ event, isNew, onSave, onDelete, onClose }: Props) {
  const start = new Date(event.start)
  // All-day events store an exclusive end; the form shows the last day inclusively.
  const end = event.allDay ? addDays(new Date(event.end), -1) : new Date(event.end)

  const [title, setTitle] = useState(event.title)
  const [allDay, setAllDay] = useState(event.allDay)
  const [startDate, setStartDate] = useState(toDateInput(start))
  const [startTime, setStartTime] = useState(event.allDay ? '09:00' : toTimeInput(start))
  const [endDate, setEndDate] = useState(toDateInput(end))
  const [endTime, setEndTime] = useState(event.allDay ? '10:00' : toTimeInput(end))
  const [color, setColor] = useState(event.color)
  const [description, setDescription] = useState(event.description)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleStartDateChange = (value: string) => {
    // Keep the event's length when the start date moves.
    if (value && startDate && endDate) {
      const shift = fromInputs(value, '00:00').getTime() - fromInputs(startDate, '00:00').getTime()
      const days = Math.round(shift / 86_400_000)
      setEndDate(toDateInput(addDays(fromInputs(endDate, '00:00'), days)))
    }
    setStartDate(value)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError('Please choose a start and end date.')
      return
    }
    let startAt: Date
    let endAt: Date
    if (allDay) {
      startAt = startOfDay(fromInputs(startDate, '00:00'))
      endAt = addDays(startOfDay(fromInputs(endDate, '00:00')), 1)
    } else {
      startAt = fromInputs(startDate, startTime)
      endAt = fromInputs(endDate, endTime)
    }
    if (endAt.getTime() < startAt.getTime() || (allDay && endAt <= startAt)) {
      setError('The event must end after it starts.')
      return
    }
    onSave({
      ...event,
      title: title.trim(),
      allDay,
      start: startAt.toISOString(),
      end: endAt.toISOString(),
      color,
      description: description.trim(),
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'New event' : 'Edit event'}
      >
        <input
          ref={titleRef}
          className="modal-title"
          placeholder="Add title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="checkbox">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
          All day
        </label>

        <div className="field-row">
          <label>
            Starts
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </label>
          {!allDay && (
            <label>
              &nbsp;
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
          )}
        </div>
        <div className="field-row">
          <label>
            Ends
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          {!allDay && (
            <label>
              &nbsp;
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          )}
        </div>

        <fieldset className="colors">
          <legend>Color</legend>
          {EVENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={c === color ? 'swatch selected' : 'swatch'}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={c === color}
            />
          ))}
        </fieldset>

        <label>
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          {!isNew && (
            <button type="button" className="btn danger" onClick={() => onDelete(event.id)}>
              Delete
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
