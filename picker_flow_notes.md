# Original Jazeera Search Flow (exact copy targets)

## Shared top ribbon (all 3 screens)
- Left: round back-arrow button + title (changes per screen):
  - From picker: "Flying from?"
  - To picker: "Flying to?"
  - Date: "When do you want to go?"
  - Passengers: "Solo, squad or family?"
- Right: "Add promo code" pill (icon + text) + round close (X) button.
- Pills row: From: <city, IATA> | To: <city, IATA> | <date e.g. "24 Jun" or "-"> | "1 Passenger" | Search button (yellow when ready, grey/disabled before).
- Active pill has cyan border (#41b4e6). Search button: blue gradient when enabled, grey when disabled.

## Flow / auto-advance
- Click From field -> opens "Flying from?" airport list.
- Pick origin -> auto-advance to "Flying to?" airport list.
- Pick destination -> auto-advance to "When do you want to go?" calendar.
- Pick date (One way): date highlighted cyan, Search enabled, stays on calendar (NOT auto to pax).
- Click Passenger pill -> "Solo, squad or family?" passengers screen.
- Click Search -> go to results.

## Calendar screen ("When do you want to go?")
- Tabs pill: "One way" (active blue) / "Round trip".
- Right side: currency dropdown (chevron) + "Reset Dates" link (underlined).
- Two months side by side: e.g. "June 2026" and "July 2026" (centered bold titles).
- Weekday headers: M T W T F S S (Monday-first).
- Past days (before today) are greyed/disabled. Today and future selectable (black).
- Selected day: solid cyan circle (#41b4e6-ish, actually a blue circle) with white text.
- Left round arrow (prev months) on far left; right round arrow (next months) on far right.
- White rounded card background.

## Passengers screen ("Solo, squad or family?")
- Tabs pill: "New" (active blue) / "Saved".
- Heading "Select a passenger".
- Rows (label + sublabel, then [-] count [+]):
  - Adult — Age 12+ (default 1)
  - Child — Age 2-11 (default 0)
  - Infant — Under 2 (default 0)
  - Senior citizen — Age 60+ (default 0)
  - Unaccompanied minors — Age 5-12 (3 per booking) (default 0)
- Bottom blue bar: "Keep the seat next to you free / Duo seat" + "Add Duo Seat" button.
- minus/plus circular icons.

## Notes for our implementation (simplify but match look)
- We will implement: From->To->Date(calendar)->(date selected, search enabled) and Passenger pill opens pax screen.
- Passengers: Adult/Child/Infant counters (keep our existing `passengers` total). Optionally add senior + UM.
- tripType tabs One way/Round trip on calendar must sync with home activeTab.
