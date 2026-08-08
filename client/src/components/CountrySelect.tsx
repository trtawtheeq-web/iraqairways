import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { COUNTRIES } from './CountryCodePicker';

function flagUrl(iso2: string): string {
  return `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`;
}

const Flag = ({ iso2 }: { iso2: string }) => (
  <img
    src={flagUrl(iso2)}
    srcSet={`https://flagcdn.com/w80/${iso2.toLowerCase()}.png 2x`}
    alt={iso2}
    width={20}
    height={14}
    loading="lazy"
    className="inline-block w-5 h-3.5 object-cover rounded-[2px] shrink-0"
  />
);

interface Props {
  value: string; // selected country name, e.g. "Kuwait"
  onChange: (name: string) => void;
  placeholder?: string;
}

const CountrySelect = ({ value, onChange, placeholder = 'Select country' }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 288 });

  const updatePos = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (b) {
      const width = Math.max(b.width, 240);
      let left = b.left;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      setPos({ top: b.bottom + 4, left, width });
    }
  };

  const selected = useMemo(() => COUNTRIES.find((c) => c.name === value) ?? null, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

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

  return (
    <div className="relative w-full" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-[#f4f7fb] border border-[#e3eaf2] rounded-xl px-5 py-4 text-left focus:outline-none focus:border-[#0a72c0]"
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected && <Flag iso2={selected.iso2} />}
          <span className={`truncate text-[15px] ${selected ? 'text-[#0a2540]' : 'text-[#8a99a8]'}`}>
            {selected ? selected.name : placeholder}
          </span>
        </span>
        <svg
          className={`w-4 h-4 text-[#6b7b8b] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
          className="z-[9999] max-w-[90vw] bg-white rounded-xl shadow-xl border border-[#e3eaf2] overflow-hidden"
        >
          <div className="p-3 border-b border-[#eef2f7]">
            <div className="flex items-center gap-2 bg-white border border-[#d7e2ee] rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-[#8a99a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                autoFocus
                type="text"
                placeholder="Search countries..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 text-sm text-[#0a2540] placeholder-[#8a99a8] focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.map((c) => (
              <li key={c.iso2}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.name);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f4f7fb] ${
                    c.name === value ? 'bg-[#eef5fc]' : ''
                  }`}
                >
                  <Flag iso2={c.iso2} />
                  <span className="truncate text-[#0a2540] text-sm">{c.name}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-[#8a99a8]">No countries found</li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CountrySelect;
