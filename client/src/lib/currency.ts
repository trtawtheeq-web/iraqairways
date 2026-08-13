// Shared currency helper for converting and formatting prices.
// Rates express how many units of the currency equal 1 KWD.
// Source: open.er-api.com (updated 17 Jun 2026).

export interface CurrencyInfo {
  code: string;
  label: string;
  rate: number;
  decimals: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'IQD', label: 'Iraqi Dinar', rate: 1, decimals: 2 },
  { code: 'USD', label: 'US Dollar', rate: 0.000763, decimals: 2 },
  { code: 'KWD', label: 'Kuwaiti Dinar', rate: 0.000235, decimals: 3 },
  { code: 'AED', label: 'UAE Dirham', rate: 0.002801, decimals: 2 },
  { code: 'SAR', label: 'Saudi Riyal', rate: 0.002861, decimals: 2 },
  { code: 'QAR', label: 'Qatari Riyal', rate: 0.002777, decimals: 2 },
  { code: 'BHD', label: 'Bahraini Dinar', rate: 0.000287, decimals: 3 },
  { code: 'OMR', label: 'Omani Rial', rate: 0.000293, decimals: 3 },
  { code: 'JOD', label: 'Jordanian Dinar', rate: 0.000541, decimals: 3 },
  { code: 'EGP', label: 'Egyptian Pound', rate: 0.03845, decimals: 2 },
  { code: 'INR', label: 'Indian Rupee', rate: 0.07237, decimals: 2 },
  { code: 'EUR', label: 'Euro', rate: 0.000658, decimals: 2 },
  { code: 'GBP', label: 'British Pound', rate: 0.000569, decimals: 2 },
  { code: 'RUB', label: 'Russian Ruble', rate: 0.05674, decimals: 2 },
  { code: 'LKR', label: 'Sri Lankan Rupee', rate: 0.25334, decimals: 2 },
];

import { globalDiscount } from './store';

// Site-wide promotional discount applied to displayed fares.
export const DISCOUNT_RATE = 0.25;

// Apply the promotional discount to a KWD amount.
export function applyDiscount(amountKWD: number): number {
  if (!globalDiscount.value) return amountKWD;
  return amountKWD * (1 - DISCOUNT_RATE);
}

// Format the discounted price for a KWD amount.
export function formatDiscountedPrice(amountKWD: number, code?: string | null): string {
  return formatPrice(applyDiscount(amountKWD), code);
}

export function getCurrency(code?: string | null): CurrencyInfo {
  const c = (code || '').toUpperCase();
  return CURRENCIES.find((x) => x.code === c) || CURRENCIES[0];
}

// Convert an amount expressed in KWD to the target currency.
export function convertFromKWD(amountKWD: number, code?: string | null): number {
  const cur = getCurrency(code);
  const v = amountKWD * cur.rate;
  const f = Math.pow(10, cur.decimals);
  return Math.round(v * f) / f;
}

// Format a KWD amount in the target currency, e.g. "USD 126.49".
export function formatPrice(amountKWD: number, code?: string | null): string {
  const cur = getCurrency(code);
  const v = convertFromKWD(amountKWD, code);
  return `${cur.code} ${v.toLocaleString('en-US', {
    minimumFractionDigits: cur.decimals,
    maximumFractionDigits: cur.decimals,
  })}`;
}
