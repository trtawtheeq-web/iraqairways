# Multi-city picker screen - current vs original

## Current multi-city "From" picker:
- Title: "Flying from?" 
- Top-right: "Multi City" pill + "Add prom..." pill + X button
- Progress pills: From: Kuwait, KWI | To: - | calendar: - | 1 Passenger | Search →
- Search input: "Search for airports"
- Airport list with images

## What user wants:
The multi-city From/To/Date/Passengers screens should look EXACTLY like the One Way screens.

## One Way "From" screen (what it should look like):
- Same title "Flying from?" 
- Same airport list
- BUT the top-right should NOT show "Multi City" and "Add promo" pills
- The progress pills should match One Way format

## Key differences to fix on mobile:
1. Hide "Multi City" and "Add promo code" pills on mobile when in picker mode (mcEdit is set)
2. The progress pills (From/To/Date/Passenger/Search) - these are the same between One Way and Multi-city, so they should be fine
3. The airport list is the same
4. The date picker should be the same
5. The passenger picker should be the same

Actually looking more carefully - the current multi-city picker already shows the same airport list, same search, same format. The only visual difference is:
- The "Multi City" and "Add promo code" pills in the top-right header area
- These should be hidden on mobile when in picker mode (editing a field)

Let me check what One Way looks like for comparison.
