# Extras Page - Original Design vs Current

## Original Design (from screenshot):
- Mobile: Back arrow + "Extras" title (large, dark navy/blue, bold)
- Service cards: Full-width image on top, then "Added ✓" badge, then bold title, then bullet points
- Bottom: Trip Summary bottom sheet with:
  - "Trip summary" title + chevron down (collapsible)
  - "Total" left + "KWD 162.250" right in blue
  - Checkbox: "By continuing to the next page, you agree to our Insurance Details and Policy Terms"
  - Continue button (gray when disabled, blue when enabled)

## Current Implementation:
- Has mobile top bar with logo + currency
- Service cards: image + content side by side on mobile (should be stacked)
- Trip summary is a sidebar on desktop, fixed bottom on mobile
- Has Flights/Add-ons/Taxes/Discount sections in trip summary (too complex for mobile)

## Changes Needed:
1. Mobile header: just back arrow + "Extras" title (large)
2. Service cards: image full width on top, then content below (mobile)
3. Mobile bottom: simplified Trip Summary sheet:
   - "Trip summary" + chevron (expandable)
   - Total + price
   - Checkbox + agreement text
   - Continue button
4. Keep desktop layout as-is (sidebar)
