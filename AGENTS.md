# AGENTS.md — jazeera-repo

## Project
- Vite + React + TS app (root = `client/`, output = `dist/`).
- Deployed to Netlify site `jazera` (id `8239e587-e149-404b-9554-eff592287b0b`), domain https://jazera.netlify.app
- Repo connected to Netlify via GitHub (`fanarali881-eng/jazeera`, branch `main`).
- **Hosting-agnostic structure (works on BOTH Cloudflare Pages and Netlify, 2026-06-22):**
  - `client/public/index.html` = static Jazeera landing page (served at `/` automatically by both hosts).
  - `client/app.html` = React SPA entry (Vite `rollupOptions.input` points here; builds to `dist/app.html`).
  - `dist/_redirects` lists each React route (`/flight-search`, `/passenger-details`, ... `/final-page`, `/404`) -> `/app.html` 200. Do NOT use a catch-all `/* -> /app.html` (it would shadow the static home and static assets). When adding a new React route in `client/src/App.tsx`, also add it to `client/public/_redirects`.
  - Home search button (`jz-search-wiring.js`) navigates to `/flight-search?...`.
  - Avoid `_routes.json` (caused Cloudflare redirect loops).

## Deploy workflow (IMPORTANT — read before deploying)
Two recurring traps caused stale deploys (old bundle served despite new code):

1. **Background `vite dev` overwrites `dist/index.html`.**
   - A leftover `pnpm dev` / `vite --host` process rewrites `dist/index.html` to reference an OLD bundle a few seconds after `npm run build`.
   - Before building/deploying: `ps aux | grep -E 'vite|pnpm dev|serve.js' | grep -v grep` and kill any such PIDs.

2. **Netlify "same commits" dedup skips file uploads.**
   - `netlify deploy --prod --dir=dist` and GitHub auto-build may report *"All files already uploaded by a previous deploy with the same commits"* and reuse OLD stored files (index.html never replaced).
   - Reliable fix: manual **file-digest deploy** via API (forces upload of changed files). Use `manual_deploy.py`.

### Reliable deploy steps
```bash
cd /home/ubuntu/jazeera-repo
# 1. kill stray dev servers
ps aux | grep -E 'vite|pnpm dev|serve.js' | grep -v grep   # then kill -9 <pids>
# 2. clean build + immediate manual deploy (atomic, no gap)
rm -rf dist && npm run build && \
  NETLIFY_AUTH_TOKEN=<token> python3 manual_deploy.py
# 3. verify
curl -sL "https://jazera.netlify.app/index.html?cb=$(date +%s%N)" | grep -o 'index-[A-Za-z0-9_-]*\.js'
```
Confirm the served bundle hash matches `dist/index.html`.

## Pages
- `client/src/pages/PassengerDetails.tsx` — passenger form; "Continue" stores `tripSummary` in sessionStorage and routes to `/seat-customization`. Stores `bundleName` (fare), legs, primaryName, base totals.
- `client/src/pages/EmergencyContact.tsx` — standalone page matching original Jazeera design.
- `client/src/pages/SeatCustomization.tsx` — seat map matching original.

## Seat pricing logic (matches original Jazeera, fare-bundle dependent)
- Per-zone base prices (KWD): Quick Exit (rows 1-3) = 13, Best Value Up Front (4-11) = 5, Extra Legroom in Middle (12-13) = 12, Best Value in Middle (14-20) = 3, Back Seats Big Value (21-30) = 2.
- If `bundleName` is **Flex Plus** -> all seats **Included** (price 0, total unchanged); banners show no price suffix; summary shows "Seating … Included".
- Other fares (Basic/Comfort/Flex) -> seat is **paid** per zone, added to total; banners show `(KWD X.000+)`.
- Passenger chip shows `<seat> | <name>` with remove (x); `Skip Seat(s)` link above Continue.

## Clickable home cards -> detail pages (added 2026-06-21)
- Every banner/card image on the static home (`client/public/jazeera-home.html`) is clickable and opens a dedicated detail page, like the original site.
- `client/public/detail.html` — single bilingual (EN/AR, RTL-aware) detail page. Reads `?item=<slug>` and renders title/tag/intro/sections/CTA. Language read from `localStorage.jzPref.lang` / `jzPrevLang` (same keys as the home).
- `client/public/jz-detail-data.js` — bilingual content catalog keyed by slug (offers, 10 destinations, 5 "all you need to know", 10 services, 3 aviation, membership, 8 promo banners). Exposed as `window.JZ_DETAIL_DATA`.
- Wiring lives in `client/public/jz-carousel.js`: `wireCardLinks()` (called from `wireAll()`, which re-runs via interval + MutationObserver). Maps cards to slugs by stable image basename (`JZ_IMG_SLUG`, suffix-normalized EN/AR) and by offer title (`JZ_TITLE_SLUG`). Clicks on carousel arrow `<button>`s are ignored.
- After editing these files, bump the `jz-carousel.js?v=` query in `jazeera-home.html` to bust cache, then rebuild + deploy.


## Mobile homepage match (2026-06-23)
- `client/public/home.html` (served at `/home` and `/`) is a saved snapshot of the original desktop Jazeera site; it lacked the original site's mobile chrome.
- Injected (search markers in the file):
  - `MOBILE-MATCH-FIX` style: `@media (max-width:1023px)` hides `.agent-sidebar-nav` and `.agent-sidebar-toggle` (the desktop left sidebar) on mobile.
  - `MOBILE-TOP-HEADER-CSS` + `MOBILE-TOP-HEADER-INJECT`: a fixed blue (`#004a97`) top header `#jzMobileTopHeader` (height 64px, z-index 1004) shown only `<=1023px`, with white logo left + white pill currency button (KW flag + KWD) + round white hamburger right. Body gets `padding-top:64px` on mobile.
- White logo asset: `client/public/jazeera_files/J920_Logo_white.svg` (generated from `J920_Logo.svg` by forcing all fills/gradients/stops to `#ffffff`).
- Desktop (>=1024px) is unchanged: all injected rules are mobile-only.
- The existing mobile bottom nav (Home/Book/My Trip/Login, `lg:hidden fixed bottom-0`) and hero banner mobile variant (`lg:hidden`) were already present and correct.

## Multi City screen (added 2026-06-24)
- Live host CONFIRMED = Cloudflare Pages `https://jazeera.pages.dev` (auto-builds from GitHub `main`). Netlify `jazera.netlify.app` is NOT used (404).
- `client/src/pages/HomePage.tsx`: dedicated Multi City modal. State `mcLegs: McLeg[]` (default Flight 1 KWI + empty Flight 2), `mcEdit` tracks {idx, field}. Clicking From/To while Multi City tab active opens the modal.
- Auto-advance flow per leg: origin -> destination ("Flying to?") -> date ("When do you want to go?") -> back to leg overview. Calendar opens at current month.
- `Add a flight` (addLeg, max 5; new leg origin = previous leg destination). Delete (X) appears when legs > 2. Search arrow builds `?tripType=multicity&segments=ORIGIN-DEST-YYYY-MM-DD,...` -> FlightSearchResults.
- Airport list item layout fixed to match original LTR: thumbnail LEFT, city+country (bold) + airport name (gray) MIDDLE, IATA RIGHT; "All airports" left-aligned.
- i18n keys added: `airport.flight`, `airport.addFlight`, `common.done`.

## Airport picker card redesign + From/To exclusion (2026-06-25)
- `client/src/pages/HomePage.tsx` airport list now matches the ORIGINAL exactly: each row is its own white card (`rounded-2xl`, shadow `0_2px_11px_0_rgba(0,74,151,0.15)`, `p-4`, `mt-3`), image `88x68` `rounded-2xl`, city+country `text-[16px] font-extrabold #001326`, airport name `text-[15px] #555659`, IATA `text-[14px] font-extrabold` on the right. "All airports" heading sits inside an outer white container (`shadow 0_2px_11px_0_rgba(0,74,151,0.10)`).
- From/To exclusion: inside the `picker` IIFE, `excludeIata` hides the opposite leg's airport (origin picker hides current destination; destination picker hides current origin; multicity uses `mcLegs[mcEdit.idx]`). List rendered from `airportList` (filteredAirports minus excludeIata). Verified live: picking AUH as From removes AUH from the To list.
- Works on mobile too (cards + exclusion); mobile chrome already matched original.
