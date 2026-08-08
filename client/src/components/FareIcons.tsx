import React from 'react';

// SVG icons matching the original Jazeera Airways fare bundle icons exactly
// All are 22x22, dark navy outline (#1a2b4a), thin stroke style

/** Cabin Baggage - padlock icon (lock with keyhole) */
export const IconCabinBag = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2b4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M12 17v2"/>
  </svg>
);

/** Checked Baggage - suitcase with handle and grid lines */
export const IconCheckedBag = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2b4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="12" height="15" rx="2"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    <path d="M6 11h12"/>
    <path d="M6 16h12"/>
    <path d="M10 21v1M14 21v1"/>
  </svg>
);

/** Meal - fork and spoon/knife */
export const IconMeal = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2b4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3v4a3 3 0 0 0 3 3v0"/>
    <path d="M7 7h3"/>
    <path d="M8.5 10v11"/>
    <path d="M16 3c0 0 1.5 1 1.5 4s-1.5 4-1.5 4"/>
    <path d="M16 11v10"/>
  </svg>
);

/** Seat - person sitting in seat icon */
export const IconSeat = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2b4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 11V6a2 2 0 0 1 2-2h2"/>
    <path d="M6 11h10a2 2 0 0 1 2 2v3H6v-5z"/>
    <path d="M6 16h12v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2z"/>
    <path d="M18 13V8"/>
    <circle cx="12" cy="4" r="2"/>
  </svg>
);

/** Priority - person walking icon */
export const IconPriority = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2b4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13" cy="4" r="2"/>
    <path d="M10 10l-2 8"/>
    <path d="M14 10l2 8"/>
    <path d="M10 10h4"/>
    <path d="M9 6l-2 4"/>
    <path d="M15 6l2 4"/>
  </svg>
);

/** Flight Change - calendar with circular arrows */
export const IconFlightChange = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2b4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2"/>
    <path d="M3 9h18"/>
    <path d="M8 2v4"/>
    <path d="M16 2v4"/>
    <path d="M9 15l2-2-2-2"/>
    <path d="M15 13l-2 2 2 2"/>
    <path d="M11 13h4"/>
    <path d="M9 15h4"/>
  </svg>
);

/** Flight Cancellation - calendar with X */
export const IconCancellation = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2b4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2"/>
    <path d="M3 9h18"/>
    <path d="M8 2v4"/>
    <path d="M16 2v4"/>
    <path d="M10 13l4 4"/>
    <path d="M14 13l-4 4"/>
  </svg>
);

// Map icon keys to components
export const FARE_ICON_MAP: Record<string, React.FC> = {
  'cabin': IconCabinBag,
  'checked': IconCheckedBag,
  'meal': IconMeal,
  'seat': IconSeat,
  'priority': IconPriority,
  'change': IconFlightChange,
  'cancellation': IconCancellation,
};

// Which icons each bundle shows (matching original Jazeera site exactly)
// Basic: cabin bag + flight change
// Comfort: cabin bag + checked bag + seat + flight change
// Flex: cabin bag + checked bag + meal + seat + flight change + cancellation
// Flex Plus: cabin bag + checked bag + meal + seat + priority + flight change + cancellation
export const BUNDLE_ICONS: Record<string, string[]> = {
  'Basic': ['cabin', 'change'],
  'Comfort': ['cabin', 'checked', 'seat', 'change'],
  'Flex': ['cabin', 'checked', 'meal', 'seat', 'change', 'cancellation'],
  'Flex Plus': ['cabin', 'checked', 'meal', 'seat', 'priority', 'change', 'cancellation'],
};
