# PassengerDetails screenshot findings

## Source screenshots
- `/home/ubuntu/upload/pasted_file_aLhuAi_image.png`
- `/home/ubuntu/upload/pasted_file_u1WWzf_image.png`
- `/home/ubuntu/upload/pasted_file_xIQaEP_image.png`
- `/home/ubuntu/upload/pasted_file_gZkeGM_image.png`

## Mobile layout findings

### Overall page
- Background is a very light bluish gray.
- There is **no mobile top navbar/logo/currency/menu bar**.
- At the top there is only a simple row with:
  - circular back button with thin gray border
  - blue title: `Who's flying today?`
- Title row sits directly on page background with generous top padding.

### Cancel for Any Reason card
- White card with large radius and very subtle border/shadow.
- Top row contains a pale blue rounded-square icon container with a blue shield icon.
- Heading is large, bold, and dark blue.
- There is a thin divider line under the heading row.
- Bullet list uses cyan/light-blue checkmarks.
- Text is dark gray, not bold.
- `View Terms` is dark blue, underlined, and semibold.
- Two stacked option boxes follow.
- Each option is a large white rounded rectangle with thin blue border.
- Radio indicator is on the far right, empty circle in blue.
- Primary option text: `80% refundable`.
- Secondary line: `+KWD 23.000/passenger`.
- Second option text: `No thanks`.

### Trip summary bottom sheet (collapsed)
- Appears as a sticky bottom sheet with large top-left/top-right radius.
- White background.
- Collapsed state shows:
  - row with `Trip summary` in dark blue and chevron on right
  - row with `Total` on left and price on right in blue
  - full-width blue rounded `Continue` button below
- The sheet overlays the page content from the bottom.

### Trip summary expanded
- Expanded sheet rises upward but keeps same white card styling and top rounding.
- Under title row it shows:
  - passenger count row with blue outline passenger icon
  - trip type/date row with blue outline calendar icon
- Then a light gray inner panel for `Flights`, with price on right and chevron.
- When expanded, flight detail panel shows:
  - route line, e.g. `Kuwait - Cairo`
  - line with flight number, times, date
  - dark gray pill badge, e.g. `0 Stops | 3h 5m`
- In deeper expansion, a lighter gray full-width fare pill labeled `Basic`.
- Passenger price breakdown uses blue passenger icon and blue prices.
- `Taxes` row is another light gray rounded panel.
- `Total` row is plain white with larger text.
- `Continue` button remains at bottom of the sheet.

### Visual style notes
- Mobile-first spacing is compact but airy.
- Card radii are large and soft.
- Blue palette is close to Jazeera brand blues:
  - heading/title dark blue
  - accents medium blue
  - icons/checkmarks lighter cyan-blue
- Borders are thin and subtle.
- Typography is bold for headings/section labels, regular for descriptions.
- Expanded summary uses distinct nested rounded sections rather than plain separators.

## Key differences vs current implementation to address
- Remove current mobile top bar/logo/currency/menu entirely.
- Make top heading row visible on mobile, not desktop-only back button styling.
- Tune Cancel for Any Reason card to match icon box, divider, list spacing, and radio option styling.
- Ensure mobile trip summary is a true sticky bottom sheet matching screenshots.
- Make collapsed summary default to title + total + continue button only.
- Match light gray rounded boxes inside expanded summary for Flights and Taxes.
- Match nested Flights details and secondary expansion styling more closely.
- Preserve all existing pricing/state logic while changing only visual structure and mobile behavior.

## Non-relevant screenshot
- `/home/ubuntu/upload/pasted_file_AF4fnu_image.png` appears to be a Render dashboard screenshot and is unrelated to the PassengerDetails design target.
