# Tempus Calendar

A clean, fast calendar web app built with React, TypeScript and Vite.

## Features

- **Month, week and day views**, with today highlighted and a live "now" line
- **Create, edit and delete events**: click any day or time slot, or use **+ New event**
- **All-day and multi-day events**
- **Overlapping events** are shown side by side
- **Six event colors** and an optional description
- **Saves automatically** in your browser (localStorage)
- **Light and dark mode** that follow your system setting
- **Works on phones and desktops**

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `M` / `W` / `D` | Month / week / day view |
| `T` | Jump to today |
| `←` / `→` | Previous / next period |
| `N` | New event |
| `Esc` | Close the event editor |

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run build    # type-check and build for production into dist/
npm run preview  # serve the production build
npm run lint     # lint with oxlint
```

## Project structure

```
src/
  App.tsx                  toolbar, navigation, view switching, shortcuts
  types.ts                 CalendarEvent type and color palette
  dateUtils.ts             date math and formatting helpers
  useEvents.ts             event state persisted to localStorage
  components/
    MonthView.tsx          6-week month grid
    TimeGrid.tsx           week and day views (hourly grid, overlap layout)
    EventModal.tsx         create / edit / delete form
  index.css                all styles
```
