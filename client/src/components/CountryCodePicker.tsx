import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface Country {
  name: string;
  dial: string;
  iso2: string;
}

// ISO2 -> real flag image (works on all OS, unlike emoji flags on Windows)
function flagUrl(iso2: string): string {
  return `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`;
}

const Flag = ({ iso2, className = '' }: { iso2: string; className?: string }) => (
  <img
    src={flagUrl(iso2)}
    srcSet={`https://flagcdn.com/w80/${iso2.toLowerCase()}.png 2x`}
    alt={iso2}
    width={20}
    height={14}
    loading="lazy"
    className={`inline-block w-5 h-3.5 object-cover rounded-[2px] shrink-0 ${className}`}
  />
);

export const COUNTRIES: Country[] = [
  { name: 'Afghanistan', dial: '+93', iso2: 'AF' },
  { name: 'Albania', dial: '+355', iso2: 'AL' },
  { name: 'Algeria', dial: '+213', iso2: 'DZ' },
  { name: 'American Samoa', dial: '+1-684', iso2: 'AS' },
  { name: 'Andorra', dial: '+376', iso2: 'AD' },
  { name: 'Angola', dial: '+244', iso2: 'AO' },
  { name: 'Anguilla', dial: '+1-264', iso2: 'AI' },
  { name: 'Antigua and Barbuda', dial: '+1-268', iso2: 'AG' },
  { name: 'Argentina', dial: '+54', iso2: 'AR' },
  { name: 'Armenia', dial: '+374', iso2: 'AM' },
  { name: 'Aruba', dial: '+297', iso2: 'AW' },
  { name: 'Australia', dial: '+61', iso2: 'AU' },
  { name: 'Austria', dial: '+43', iso2: 'AT' },
  { name: 'Azerbaijan', dial: '+994', iso2: 'AZ' },
  { name: 'Bahamas', dial: '+1-242', iso2: 'BS' },
  { name: 'Bahrain', dial: '+973', iso2: 'BH' },
  { name: 'Bangladesh', dial: '+880', iso2: 'BD' },
  { name: 'Barbados', dial: '+1-246', iso2: 'BB' },
  { name: 'Belarus', dial: '+375', iso2: 'BY' },
  { name: 'Belgium', dial: '+32', iso2: 'BE' },
  { name: 'Belize', dial: '+501', iso2: 'BZ' },
  { name: 'Benin', dial: '+229', iso2: 'BJ' },
  { name: 'Bermuda', dial: '+1-441', iso2: 'BM' },
  { name: 'Bhutan', dial: '+975', iso2: 'BT' },
  { name: 'Bolivia', dial: '+591', iso2: 'BO' },
  { name: 'Bosnia and Herzegovina', dial: '+387', iso2: 'BA' },
  { name: 'Botswana', dial: '+267', iso2: 'BW' },
  { name: 'Brazil', dial: '+55', iso2: 'BR' },
  { name: 'British Indian Ocean Territory', dial: '+246', iso2: 'IO' },
  { name: 'British Virgin Islands', dial: '+1-284', iso2: 'VG' },
  { name: 'Brunei', dial: '+673', iso2: 'BN' },
  { name: 'Bulgaria', dial: '+359', iso2: 'BG' },
  { name: 'Burkina Faso', dial: '+226', iso2: 'BF' },
  { name: 'Burundi', dial: '+257', iso2: 'BI' },
  { name: 'Cambodia', dial: '+855', iso2: 'KH' },
  { name: 'Cameroon', dial: '+237', iso2: 'CM' },
  { name: 'Canada', dial: '+1', iso2: 'CA' },
  { name: 'Cape Verde', dial: '+238', iso2: 'CV' },
  { name: 'Cayman Islands', dial: '+1-345', iso2: 'KY' },
  { name: 'Central African Republic', dial: '+236', iso2: 'CF' },
  { name: 'Chad', dial: '+235', iso2: 'TD' },
  { name: 'Chile', dial: '+56', iso2: 'CL' },
  { name: 'China', dial: '+86', iso2: 'CN' },
  { name: 'Colombia', dial: '+57', iso2: 'CO' },
  { name: 'Comoros', dial: '+269', iso2: 'KM' },
  { name: 'Congo (DRC)', dial: '+243', iso2: 'CD' },
  { name: 'Congo (Republic)', dial: '+242', iso2: 'CG' },
  { name: 'Cook Islands', dial: '+682', iso2: 'CK' },
  { name: 'Costa Rica', dial: '+506', iso2: 'CR' },
  { name: "Cote d'Ivoire", dial: '+225', iso2: 'CI' },
  { name: 'Croatia', dial: '+385', iso2: 'HR' },
  { name: 'Cuba', dial: '+53', iso2: 'CU' },
  { name: 'Cyprus', dial: '+357', iso2: 'CY' },
  { name: 'Czech Republic', dial: '+420', iso2: 'CZ' },
  { name: 'Denmark', dial: '+45', iso2: 'DK' },
  { name: 'Djibouti', dial: '+253', iso2: 'DJ' },
  { name: 'Dominica', dial: '+1-767', iso2: 'DM' },
  { name: 'Dominican Republic', dial: '+1-809', iso2: 'DO' },
  { name: 'Ecuador', dial: '+593', iso2: 'EC' },
  { name: 'Egypt', dial: '+20', iso2: 'EG' },
  { name: 'El Salvador', dial: '+503', iso2: 'SV' },
  { name: 'Equatorial Guinea', dial: '+240', iso2: 'GQ' },
  { name: 'Eritrea', dial: '+291', iso2: 'ER' },
  { name: 'Estonia', dial: '+372', iso2: 'EE' },
  { name: 'Eswatini', dial: '+268', iso2: 'SZ' },
  { name: 'Ethiopia', dial: '+251', iso2: 'ET' },
  { name: 'Fiji', dial: '+679', iso2: 'FJ' },
  { name: 'Finland', dial: '+358', iso2: 'FI' },
  { name: 'France', dial: '+33', iso2: 'FR' },
  { name: 'French Polynesia', dial: '+689', iso2: 'PF' },
  { name: 'Gabon', dial: '+241', iso2: 'GA' },
  { name: 'Gambia', dial: '+220', iso2: 'GM' },
  { name: 'Georgia', dial: '+995', iso2: 'GE' },
  { name: 'Germany', dial: '+49', iso2: 'DE' },
  { name: 'Ghana', dial: '+233', iso2: 'GH' },
  { name: 'Gibraltar', dial: '+350', iso2: 'GI' },
  { name: 'Greece', dial: '+30', iso2: 'GR' },
  { name: 'Greenland', dial: '+299', iso2: 'GL' },
  { name: 'Grenada', dial: '+1-473', iso2: 'GD' },
  { name: 'Guam', dial: '+1-671', iso2: 'GU' },
  { name: 'Guatemala', dial: '+502', iso2: 'GT' },
  { name: 'Guinea', dial: '+224', iso2: 'GN' },
  { name: 'Guinea-Bissau', dial: '+245', iso2: 'GW' },
  { name: 'Guyana', dial: '+592', iso2: 'GY' },
  { name: 'Haiti', dial: '+509', iso2: 'HT' },
  { name: 'Honduras', dial: '+504', iso2: 'HN' },
  { name: 'Hong Kong', dial: '+852', iso2: 'HK' },
  { name: 'Hungary', dial: '+36', iso2: 'HU' },
  { name: 'Iceland', dial: '+354', iso2: 'IS' },
  { name: 'India', dial: '+91', iso2: 'IN' },
  { name: 'Indonesia', dial: '+62', iso2: 'ID' },
  { name: 'Iran', dial: '+98', iso2: 'IR' },
  { name: 'Iraq', dial: '+964', iso2: 'IQ' },
  { name: 'Ireland', dial: '+353', iso2: 'IE' },
  { name: 'Israel', dial: '+972', iso2: 'IL' },
  { name: 'Italy', dial: '+39', iso2: 'IT' },
  { name: 'Jamaica', dial: '+1-876', iso2: 'JM' },
  { name: 'Japan', dial: '+81', iso2: 'JP' },
  { name: 'Jordan', dial: '+962', iso2: 'JO' },
  { name: 'Kazakhstan', dial: '+7', iso2: 'KZ' },
  { name: 'Kenya', dial: '+254', iso2: 'KE' },
  { name: 'Kiribati', dial: '+686', iso2: 'KI' },
  { name: 'Kuwait', dial: '+965', iso2: 'KW' },
  { name: 'Kyrgyzstan', dial: '+996', iso2: 'KG' },
  { name: 'Laos', dial: '+856', iso2: 'LA' },
  { name: 'Latvia', dial: '+371', iso2: 'LV' },
  { name: 'Lebanon', dial: '+961', iso2: 'LB' },
  { name: 'Lesotho', dial: '+266', iso2: 'LS' },
  { name: 'Liberia', dial: '+231', iso2: 'LR' },
  { name: 'Libya', dial: '+218', iso2: 'LY' },
  { name: 'Liechtenstein', dial: '+423', iso2: 'LI' },
  { name: 'Lithuania', dial: '+370', iso2: 'LT' },
  { name: 'Luxembourg', dial: '+352', iso2: 'LU' },
  { name: 'Macau', dial: '+853', iso2: 'MO' },
  { name: 'Madagascar', dial: '+261', iso2: 'MG' },
  { name: 'Malawi', dial: '+265', iso2: 'MW' },
  { name: 'Malaysia', dial: '+60', iso2: 'MY' },
  { name: 'Maldives', dial: '+960', iso2: 'MV' },
  { name: 'Mali', dial: '+223', iso2: 'ML' },
  { name: 'Malta', dial: '+356', iso2: 'MT' },
  { name: 'Marshall Islands', dial: '+692', iso2: 'MH' },
  { name: 'Mauritania', dial: '+222', iso2: 'MR' },
  { name: 'Mauritius', dial: '+230', iso2: 'MU' },
  { name: 'Mexico', dial: '+52', iso2: 'MX' },
  { name: 'Micronesia', dial: '+691', iso2: 'FM' },
  { name: 'Moldova', dial: '+373', iso2: 'MD' },
  { name: 'Monaco', dial: '+377', iso2: 'MC' },
  { name: 'Mongolia', dial: '+976', iso2: 'MN' },
  { name: 'Montenegro', dial: '+382', iso2: 'ME' },
  { name: 'Montserrat', dial: '+1-664', iso2: 'MS' },
  { name: 'Morocco', dial: '+212', iso2: 'MA' },
  { name: 'Mozambique', dial: '+258', iso2: 'MZ' },
  { name: 'Myanmar', dial: '+95', iso2: 'MM' },
  { name: 'Namibia', dial: '+264', iso2: 'NA' },
  { name: 'Nauru', dial: '+674', iso2: 'NR' },
  { name: 'Nepal', dial: '+977', iso2: 'NP' },
  { name: 'Netherlands', dial: '+31', iso2: 'NL' },
  { name: 'New Caledonia', dial: '+687', iso2: 'NC' },
  { name: 'New Zealand', dial: '+64', iso2: 'NZ' },
  { name: 'Nicaragua', dial: '+505', iso2: 'NI' },
  { name: 'Niger', dial: '+227', iso2: 'NE' },
  { name: 'Nigeria', dial: '+234', iso2: 'NG' },
  { name: 'North Korea', dial: '+850', iso2: 'KP' },
  { name: 'North Macedonia', dial: '+389', iso2: 'MK' },
  { name: 'Norway', dial: '+47', iso2: 'NO' },
  { name: 'Oman', dial: '+968', iso2: 'OM' },
  { name: 'Pakistan', dial: '+92', iso2: 'PK' },
  { name: 'Palau', dial: '+680', iso2: 'PW' },
  { name: 'Palestine', dial: '+970', iso2: 'PS' },
  { name: 'Panama', dial: '+507', iso2: 'PA' },
  { name: 'Papua New Guinea', dial: '+675', iso2: 'PG' },
  { name: 'Paraguay', dial: '+595', iso2: 'PY' },
  { name: 'Peru', dial: '+51', iso2: 'PE' },
  { name: 'Philippines', dial: '+63', iso2: 'PH' },
  { name: 'Poland', dial: '+48', iso2: 'PL' },
  { name: 'Portugal', dial: '+351', iso2: 'PT' },
  { name: 'Puerto Rico', dial: '+1-787', iso2: 'PR' },
  { name: 'Qatar', dial: '+974', iso2: 'QA' },
  { name: 'Romania', dial: '+40', iso2: 'RO' },
  { name: 'Russia', dial: '+7', iso2: 'RU' },
  { name: 'Rwanda', dial: '+250', iso2: 'RW' },
  { name: 'Saint Kitts and Nevis', dial: '+1-869', iso2: 'KN' },
  { name: 'Saint Lucia', dial: '+1-758', iso2: 'LC' },
  { name: 'Saint Vincent and the Grenadines', dial: '+1-784', iso2: 'VC' },
  { name: 'Samoa', dial: '+685', iso2: 'WS' },
  { name: 'San Marino', dial: '+378', iso2: 'SM' },
  { name: 'Sao Tome and Principe', dial: '+239', iso2: 'ST' },
  { name: 'Saudi Arabia', dial: '+966', iso2: 'SA' },
  { name: 'Senegal', dial: '+221', iso2: 'SN' },
  { name: 'Serbia', dial: '+381', iso2: 'RS' },
  { name: 'Seychelles', dial: '+248', iso2: 'SC' },
  { name: 'Sierra Leone', dial: '+232', iso2: 'SL' },
  { name: 'Singapore', dial: '+65', iso2: 'SG' },
  { name: 'Slovakia', dial: '+421', iso2: 'SK' },
  { name: 'Slovenia', dial: '+386', iso2: 'SI' },
  { name: 'Solomon Islands', dial: '+677', iso2: 'SB' },
  { name: 'Somalia', dial: '+252', iso2: 'SO' },
  { name: 'South Africa', dial: '+27', iso2: 'ZA' },
  { name: 'South Korea', dial: '+82', iso2: 'KR' },
  { name: 'South Sudan', dial: '+211', iso2: 'SS' },
  { name: 'Spain', dial: '+34', iso2: 'ES' },
  { name: 'Sri Lanka', dial: '+94', iso2: 'LK' },
  { name: 'Sudan', dial: '+249', iso2: 'SD' },
  { name: 'Suriname', dial: '+597', iso2: 'SR' },
  { name: 'Sweden', dial: '+46', iso2: 'SE' },
  { name: 'Switzerland', dial: '+41', iso2: 'CH' },
  { name: 'Syria', dial: '+963', iso2: 'SY' },
  { name: 'Taiwan', dial: '+886', iso2: 'TW' },
  { name: 'Tajikistan', dial: '+992', iso2: 'TJ' },
  { name: 'Tanzania', dial: '+255', iso2: 'TZ' },
  { name: 'Thailand', dial: '+66', iso2: 'TH' },
  { name: 'Timor-Leste', dial: '+670', iso2: 'TL' },
  { name: 'Togo', dial: '+228', iso2: 'TG' },
  { name: 'Tonga', dial: '+676', iso2: 'TO' },
  { name: 'Trinidad and Tobago', dial: '+1-868', iso2: 'TT' },
  { name: 'Tunisia', dial: '+216', iso2: 'TN' },
  { name: 'Turkey', dial: '+90', iso2: 'TR' },
  { name: 'Turkmenistan', dial: '+993', iso2: 'TM' },
  { name: 'Turks and Caicos Islands', dial: '+1-649', iso2: 'TC' },
  { name: 'Tuvalu', dial: '+688', iso2: 'TV' },
  { name: 'Uganda', dial: '+256', iso2: 'UG' },
  { name: 'Ukraine', dial: '+380', iso2: 'UA' },
  { name: 'United Arab Emirates', dial: '+971', iso2: 'AE' },
  { name: 'United Kingdom', dial: '+44', iso2: 'GB' },
  { name: 'United States', dial: '+1', iso2: 'US' },
  { name: 'Uruguay', dial: '+598', iso2: 'UY' },
  { name: 'Uzbekistan', dial: '+998', iso2: 'UZ' },
  { name: 'Vanuatu', dial: '+678', iso2: 'VU' },
  { name: 'Vatican City', dial: '+379', iso2: 'VA' },
  { name: 'Venezuela', dial: '+58', iso2: 'VE' },
  { name: 'Vietnam', dial: '+84', iso2: 'VN' },
  { name: 'Yemen', dial: '+967', iso2: 'YE' },
  { name: 'Zambia', dial: '+260', iso2: 'ZM' },
  { name: 'Zimbabwe', dial: '+263', iso2: 'ZW' },
];

interface Props {
  value: string; // selected dial code, e.g. "+965"
  onChange: (dial: string) => void;
}

const CountryCodePicker = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 288 });

  const updatePos = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (b) {
      const width = 320;
      let left = b.left;
      // keep within viewport
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      setPos({ top: b.bottom + 4, left, width });
    }
  };

  const selected = useMemo(
    () => COUNTRIES.find((c) => c.dial === value) ?? COUNTRIES.find((c) => c.iso2 === 'KW')!,
    [value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.replace('+', '').includes(q.replace('+', ''))
    );
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
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 h-full min-h-[56px] focus:outline-none"
      >
        <Flag iso2={selected.iso2} />
        <span className="text-[#0a2540] text-sm font-medium">{selected.dial}</span>
        <svg
          className={`w-4 h-4 text-[#6b7b8b] transition-transform ${open ? 'rotate-180' : ''}`}
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
              <li key={c.iso2 + c.dial}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.dial);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[#f4f7fb] ${
                    c.dial === value ? 'bg-[#eef5fc]' : ''
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Flag iso2={c.iso2} />
                    <span className="text-sm text-[#0a2540] truncate">{c.name}</span>
                  </span>
                  <span className="text-sm text-[#6b7b8b] shrink-0">{c.dial}</span>
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

export default CountryCodePicker;
