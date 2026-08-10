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
  { code: 'KWD', label: 'Kuwaiti Dinar', rate: 1, decimals: 3 },
  { code: 'IQD', label: 'Iraqi Dinar', rate: 4250, decimals: 0 },
  { code: 'USD', label: 'US Dollar', rate: 3.24341, decimals: 2 },
  { code: 'AED', label: 'UAE Dirham', rate: 11.911405, decimals: 2 },
  { code: 'SAR', label: 'Saudi Riyal', rate: 12.162769, decimals: 2 },
  { code: 'QAR', label: 'Qatari Riyal', rate: 11.805995, decimals: 2 },
  { code: 'BHD', label: 'Bahraini Dinar', rate: 1.21952, decimals: 3 },
  { code: 'OMR', label: 'Omani Rial', rate: 1.24708, decimals: 3 },
  { code: 'JOD', label: 'Jordanian Dinar', rate: 2.299574, decimals: 3 },
  { code: 'EGP', label: 'Egyptian Pound', rate: 163.418782, decimals: 2 },
  { code: 'INR', label: 'Indian Rupee', rate: 307.833864, decimals: 2 },
  { code: 'EUR', label: 'Euro', rate: 2.798705, decimals: 2 },
  { code: 'GBP', label: 'British Pound', rate: 2.420466, decimals: 2 },
  { code: 'RUB', label: 'Russian Ruble', rate: 241.15, decimals: 2 },
  { code: 'LKR', label: 'Sri Lankan Rupee', rate: 1076.70, decimals: 2 },
];

// Site-wide promotional discount applied to displayed fares.
export const DISCOUNT_RATE = 0.35;

// Apply the promotional discount to a KWD amount.
export function applyDiscount(amountKWD: number): number {
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
