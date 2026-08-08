# Original Jazeera header layout — Arabic (RTL) vs English (LTR)

## Arabic (RTL) — observed from ar-jo/flights
- **Logo (J920 + 20 badge):** TOP-RIGHT corner.
- **Capsule:** centered, but pills order is MIRRORED (reading right-to-left):
  - Rightmost pill: KWI (takeOff)
  - then line
  - BOM (landing)
  - then line
  - 9 يول (calendar)
  - then line
  - 1 (passenger)
  - then the two circular buttons (pencil edit + rail-arrow) on the LEFT side of capsule
- **AR-JO language pill:** TOP-LEFT corner (mirrored from English which is top-right).
- **Title "الكويت إلى مومباي":** on the RIGHT side, with plane icon to its right and the circular back arrow (→ pointing right) further right. Title text right-aligned.
- **Back arrow circle:** points RIGHT (→) in Arabic (fwd direction reversed).
- **Date strip:** runs right-to-left. Right arrow circle on the RIGHT (prev), left arrow circle on the LEFT (next). Dates read right-to-left: الإثنين 06 (rightmost) ... الأحد 12 (leftmost).
  - Prev-days arrow (→) is on the RIGHT side.
  - Next-days arrow (←) is on the LEFT side.
- **Sort/Direct buttons:** on the LEFT side (mirrored from English right).
- **"لا توجد رحلات متاحة" (No flights):** on the RIGHT side.

## English (LTR) — observed earlier
- Logo: TOP-LEFT
- Capsule: centered, order KWI line BOM line date line pax, then pencil/search on RIGHT
- EN-JO pill: TOP-RIGHT
- Title: LEFT, plane icon left, back arrow (←) circle to its left
- Date strip: left-to-right, prev arrow (←) LEFT, next arrow (→) RIGHT
- Sort/Direct: RIGHT
- "No flights available": LEFT

## Implementation approach
The whole header/main should respond to `dir` automatically. Currently we hard-coded `right:24px` and `dir="ltr"` on the language pill which BREAKS Arabic (it should go top-LEFT in Arabic).

Fix: Remove forced ltr / fixed right. Use logical positioning so:
- Logo: inset-inline-start (start) — start = left in LTR, right in RTL. Logo is top-LEFT in EN, top-RIGHT in AR => logo should be at INLINE-START.
- Language pill: top-RIGHT in EN, top-LEFT in AR => INLINE-END.
- Let flex containers and `dir` handle pill/title/date-strip/buttons mirroring automatically.
- Date strip arrows: use logical or swap based on isAr.
