# Original section notes

## Building Aviation Professionals
- Heading uses `text-[36px] md:text-[42px] lg:text-[48px] font-medium leading-none text-[#004a97] tracking-[-0.03em]`.
- Header row: `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8`.
- Arrow controls wrapper on desktop: `hidden md:flex flex-wrap items-center gap-4 text-[#001326]`, inner `flex items-center gap-1`.
- Each arrow button: `h-8 w-8 rounded-full flex items-center justify-center bg-[#004a97] hover:bg-[#003581] hover:scale-110 transition-all duration-200` with `/icons/arrow_back.svg` and `/icons/arrow_front.svg`.
- Carousel viewport: `dir="ltr" class="w-full py-4" style="overflow: hidden visible; touch-action: pan-y;"`.
- Track style: `display:flex; flex-direction:row; gap:24px; width:1974px; transform:translateX(0px); transition:transform 0.6s ease-in-out; will-change:transform;`.
- Cards are duplicated 2x (3 original cards repeated again) to enable looping.
- Each card width `309px`, height `clamp(280px, 30vw, 344px)`, border-radius `24px`, padding `24px`, `flex-shrink:0`, `overflow:hidden`, `display:flex`, `justify-content:flex-end`, cursor pointer.
- Card background uses `linear-gradient(transparent 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%), url(...)`, with `background-size:cover`, `background-position:center center`.
- Card hover class: `hover:scale-105 hover:shadow-2xl transition-transform duration-300 hover:z-10`.
- Text block: column gap 4px, color white, title `font-size:20px; font-weight:500; line-height:1; letter-spacing:-0.03em`, subtitle `font-size:16px; font-weight:800; line-height:1.3; letter-spacing:-0.03em; opacity:0.9`.

## Footer
- Footer background is solid `#004a97`.
- Top area starts with small Jazeera 20 years logo on the left.
- Five columns:
  1. `Jazeera`: About Us, Jazeera Air Cargo, Careers, Cabin Crew Course, Graduate Development Program, Aviation Course, Jazeera Charter, Investor Relations.
  2. `Where We Fly`: Africa, Asia, Europe, Middle East.
  3. `Help`: FAQ, Contact Us, Feedback.
  4. `Legal & Compliance`: Terms & Conditions, Privacy policy, Accessibility Statement.
  5. `News & Media`: Media Centre, Media Library.
- Bottom divider line above the copyright/social row.
- Bottom row has copyright on left: `© Jazeera Airways. All rights reserved.`
- Bottom row center links: `Terms and Condition`, `Privacy Policy`.
- Bottom row right: social icons in outlined circles for Facebook, YouTube, Instagram, LinkedIn.
- Footer text is white with slightly muted link color; headings are brighter/bolder.
- Screenshot confirms wide desktop layout with generous horizontal gaps and compact line spacing.

## Current task constraint
- Only modify the Building Aviation Professionals section and the footer to match the original; do not change anything else.

## Source files inspected
- `/home/ubuntu/browser_html/jazeeraairways_com_en-kw_1782305251096.html`
- `/home/ubuntu/browser_html/jazeeraairways_com_en-kw_1782305685651.html`
- `/home/ubuntu/page_texts/www.jazeeraairways.com_en-kw.md`
- browser screenshots at bottom section
