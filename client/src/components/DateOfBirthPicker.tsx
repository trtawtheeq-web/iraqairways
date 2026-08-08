import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../contexts/LanguageContext';

interface Props {
  value: string; // stored as "YYYY-MM-DD"
  onChange: (value: string) => void;
}

type View = 'year' | 'month' | 'day';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(year: number, month: number): number {
  // month: 0-11
  return new Date(year, month + 1, 0).getDate();
}

function formatDisplay(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return '';
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

// stored "YYYY-MM-DD" -> typed text "DD/MM/YYYY"
function valueToText(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return '';
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}

// auto-format digits as the user types: DD/MM/YYYY
function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter((p) => p.length > 0);
  return parts.join('/');
}

// validate "DD/MM/YYYY" and convert to stored "YYYY-MM-DD" (or null)
function textToValue(text: string): string | null {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const d = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const y = parseInt(match[3], 10);
  const now = new Date();
  if (m < 1 || m > 12) return null;
  if (y < 1900 || y > now.getFullYear()) return null;
  const dim = new Date(y, m, 0).getDate();
  if (d < 1 || d > dim) return null;
  const candidate = new Date(y, m - 1, d);
  if (candidate > now) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const DateOfBirthPicker = ({ value, onChange }: Props) => {
  const { isAr } = useLang();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('year');

  const parsed = useMemo(() => {
    const [y, m, d] = value ? value.split('-').map((x) => parseInt(x, 10)) : [];
    return { y: y || undefined, m: m || undefined, d: d || undefined };
  }, [value]);

  const currentYear = new Date().getFullYear();
  // page start for the year grid (12 years per page, ending at a multiple-ish range)
  const [yearPageStart, setYearPageStart] = useState<number>(() => {
    const baseYear = parsed.y ?? currentYear - 12;
    return baseYear - ((baseYear) % 12) - 0; // align
  });

  const [selYear, setSelYear] = useState<number | undefined>(parsed.y);
  const [selMonth, setSelMonth] = useState<number | undefined>(parsed.m ? parsed.m - 1 : undefined);

  const [text, setText] = useState<string>(() => valueToText(value));

  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 320 });

  const updatePos = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (b) {
      const width = Math.max(300, Math.min(360, b.width));
      let left = b.left;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      setPos({ top: b.bottom + 6, left, width });
    }
  };

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current && ref.current.contains(t)) return;
      if (panelRef.current && panelRef.current.contains(t)) return;
      setOpen(false);
    };
    const onReposition = () => updatePos();
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open]);

  const openPicker = () => {
    // reset view to year and align page when opening
    setView('year');
    const base = parsed.y ?? currentYear - 18;
    setYearPageStart(base - (((base % 12) + 12) % 12));
    setSelYear(parsed.y);
    setSelMonth(parsed.m ? parsed.m - 1 : undefined);
    setOpen(true);
  };

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 12; i++) arr.push(yearPageStart + i);
    return arr;
  }, [yearPageStart]);

  const pickYear = (y: number) => {
    setSelYear(y);
    setView('month');
  };

  const pickMonth = (mIdx: number) => {
    setSelMonth(mIdx);
    setView('day');
  };

  const pickDay = (d: number) => {
    if (selYear == null || selMonth == null) return;
    const val = `${selYear}-${String(selMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onChange(val);
    setOpen(false);
  };

  const display = formatDisplay(value);

  // keep typed text in sync when value changes from the calendar
  useEffect(() => {
    setText(valueToText(value));
  }, [value]);

  const handleTextChange = (raw: string) => {
    const masked = maskDateInput(raw);
    setText(masked);
    const v = textToValue(masked);
    if (v) onChange(v);
    else if (masked === '') onChange('');
  };

  const headerLabel =
    view === 'year'
      ? `${years[0]}-${years[years.length - 1]}`
      : view === 'month'
      ? `${selYear ?? ''}`
      : `${MONTHS_FULL[selMonth ?? 0]} ${selYear ?? ''}`;

  const goPrev = () => {
    if (view === 'year') setYearPageStart((s) => s - 12);
    else if (view === 'month') setSelYear((y) => (y ? y - 1 : currentYear));
    else if (view === 'day') setView('month');
  };
  const goNext = () => {
    if (view === 'year') setYearPageStart((s) => s + 12);
    else if (view === 'month') setSelYear((y) => (y ? y + 1 : currentYear));
    else if (view === 'day') setView('month');
  };

  const headerClickable = view !== 'year';
  const onHeaderClick = () => {
    if (view === 'month') setView('year');
    else if (view === 'day') setView('month');
  };

  const dayCount = selYear != null && selMonth != null ? daysInMonth(selYear, selMonth) : 31;

  return (
    <div className="relative" ref={ref}>
      <div
        ref={btnRef}
        className="w-full bg-[#f4f7fb] border border-[#e3eaf2] rounded-xl px-4 py-4 text-[#0a2540] focus-within:border-[#0a72c0] flex items-center justify-between"
      >
        <input
          type="text"
          inputMode="numeric"
          value={text}
          placeholder={isAr ? 'تاريخ الميلاد *' : 'Date of birth *'}
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => setOpen(false)}
          className="flex-1 bg-transparent outline-none text-[#0a2540] placeholder-[#8a99a8]"
        />
        <button
          type="button"
          aria-label="Open calendar"
          onClick={() => (open ? setOpen(false) : openPicker())}
          className="ml-2 shrink-0"
        >
          <svg className="w-5 h-5 text-[#0a72c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
          className="z-[9999] bg-white rounded-2xl shadow-xl border border-[#e3eaf2] p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={onHeaderClick}
              className={`text-lg font-semibold text-[#0a2540] ${headerClickable ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
            >
              {headerLabel}
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#0a2540] hover:bg-[#eef5fc]"
                aria-label="Previous"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#0a2540] hover:bg-[#eef5fc]"
                aria-label="Next"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {/* Year grid */}
          {view === 'year' && (
            <div className="grid grid-cols-4 gap-y-4 gap-x-2 py-2">
              {years.map((y) => {
                const isSel = y === selYear;
                const isFuture = y > currentYear;
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={isFuture}
                    onClick={() => pickYear(y)}
                    className={`mx-auto px-3 py-1.5 rounded-lg text-base transition-colors ${
                      isSel
                        ? 'bg-[#0a72c0] text-white font-bold'
                        : isFuture
                        ? 'text-[#c2ccd6] cursor-not-allowed'
                        : 'text-[#0a2540] hover:bg-[#eef5fc]'
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* Month grid */}
          {view === 'month' && (
            <div className="grid grid-cols-4 gap-y-4 gap-x-2 py-2">
              {MONTHS.map((m, idx) => {
                const isSel = idx === selMonth;
                const isFuture = selYear === currentYear && idx > new Date().getMonth();
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={isFuture}
                    onClick={() => pickMonth(idx)}
                    className={`mx-auto px-3 py-1.5 rounded-lg text-base transition-colors ${
                      isSel
                        ? 'bg-[#0a72c0] text-white font-bold'
                        : isFuture
                        ? 'text-[#c2ccd6] cursor-not-allowed'
                        : 'text-[#0a2540] hover:bg-[#eef5fc]'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* Day grid */}
          {view === 'day' && (
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 py-2">
              {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => {
                const isSel = d === parsed.d && selYear === parsed.y && selMonth === (parsed.m ? parsed.m - 1 : undefined);
                const isFuture =
                  selYear === currentYear &&
                  selMonth === new Date().getMonth() &&
                  d > new Date().getDate();
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={isFuture}
                    onClick={() => pickDay(d)}
                    className={`w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm transition-colors ${
                      isSel
                        ? 'bg-[#0a72c0] text-white font-bold'
                        : isFuture
                        ? 'text-[#c2ccd6] cursor-not-allowed'
                        : 'text-[#0a2540] hover:bg-[#eef5fc]'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default DateOfBirthPicker;
