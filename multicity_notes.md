# Multi-city page comparison

## Original design (from screenshot):
- Header: back arrow (left) + "Flying to?" title (left) + "Multi-city" pill (right)
- Background: light blue (#EBF3FF)
- Flight cards: white rounded cards, each with:
  - "Flight 1" / "Flight 2" label in navy blue (top-left)
  - 3 fields stacked vertically:
    - From: plane takeoff icon + "From: -" text
    - To: plane landing icon + "To: -" text
    - Date: calendar icon + "-" text
  - Each field has rounded border, gray text
- Bottom: "Add a flight" button (navy blue, full width with + icon) + arrow circle button (right)
- NO top pills (One way / Passenger / Promo) visible on mobile
- Clean, minimal design

## Current implementation (lines 1586-1638):
- Has top-right pills (One way / Passenger / Promo) - REMOVE on mobile
- Flight cards with From/To/Date fields - MATCHES but layout needs tweaking
- "Add a flight" button + arrow search button - MATCHES

## Changes needed:
1. Title should be "Flying to?" not "Multi-city" on mobile (when mcEdit is null)
2. Hide the top-right pills on mobile (md:flex only)
3. Make sure the field layout matches: stacked vertically on mobile
4. The "From:" and "To:" text format matches: "From: -" when empty
5. The "Multi-city" pill should appear top-right on mobile header
