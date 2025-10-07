# Design Tokens

This document captures the canonical design tokens used across the application. All values should be referenced by token in components; avoid raw px/hex when a token exists (or should exist).

## Calendar Tokens

Frame & Layout
- --cal-frame-radius: outer frame corner radius for calendar views
- --cal-frame-border: outer frame border color (subtle)
- --cal-bg: calendar surface background
- --cal-header-h: weekday header height (Month/Week/Day)
- --cal-hour-row-h: vertical scale for Week/Day hour rows
- --cal-cell-min-h: Month cell minimum height (ensures 6 fixed rows)
- --cal-rail-w: time rail width in Week/Day
- --calendar-min-h: minimum view height (e.g., viewport height minus header)

Lines & Rings
- --cal-gridline: internal gridline color (hairline)
- --cal-ring: focus/today/selected ring color
- --cal-hover: light hover tint (used on cells and event hover)

Outside-Month Ink
- --cal-outside-ink: opacity for days outside the active month

Now Indicator (Week/Day)
- --cal-now-line: 1px line color for current time
- --cal-now-dot: dot color for current time

Event Tokens (shared)
- --event-pill-r: event pill border radius
- --event-pill-px: horizontal padding inside event pills
- --event-pill-py: vertical padding inside event pills
- --event-gap: vertical gap between stacked pills (Month)
- --event-overlap-gap: horizontal gap used when sharing width for overlapping timed events (Week/Day)

Usage Principles
- Use a single contiguous frame per view with rounded corners and a subtle border.
- Do not create gutters between cells/columns; use hairline gridlines only.
- Represent today/selected/focus with thin rings; avoid solid fills.
- Event pills are single-line, low-ink, and rely on chip tokens for tone.
