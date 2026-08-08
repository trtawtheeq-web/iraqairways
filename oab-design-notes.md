# OAB iPay Original Design - Key Observations from User Screenshot

Based on the user's screenshot of https://securepayments.oabipay.com/trxns/paymentpage.htm:

## Background & Container
- Page background: very light gray/white (appears almost white, maybe #f5f5f5 or #f0f0f0)
- Container: white, rounded corners (about 8px), subtle shadow
- Container appears centered with good top margin

## Header
- OAB logo on the LEFT side
- Logo is relatively small (about 60-70px height)
- Clean white background, no border below header

## Sidebar (Left)
- "Payment Options" title - bold, dark, about 16px
- Active item "Credit / Debit / Prepaid Card" has blue left border (thick, about 4px)
- Card icon is a blue outlined credit card SVG
- "VISA, OMANNET, MASTERCARD" in gray below
- Samsung Pay item: green circle icon with "SP" or similar
- "Samsung Pay" text in blue
- "All major banks available" in gray
- NO visible right border on sidebar - the center section has its own left border

## Center Form Area
- Has a subtle left border (light gray, #e0e0e0 or similar)
- "← Back" link in blue at top
- Arrow is a proper left arrow (←)
- "Back" text next to it
- Form fields:
  - "Card Number" label - bold, dark
  - Input: full width, light gray border, rounded corners (about 6px), good padding
  - "Card Holders Name" - same style
  - "Expiry Date" and "CVV" side by side
  - Inputs have placeholder text in light gray
- Checkboxes section:
  - First checkbox has a "Click to Pay" icon (two arrows/waves icon) between checkbox and text
  - "Link this Card to Click to Pay (Terms & Conditions / Privacy Notice)"
  - Terms & Conditions and Privacy Notice are blue links
  - "(Card will be Linked with Click to Pay for fast and secure payment)" in gray
  - Second checkbox: "Tokenize this Card for future transaction"
  - "(Cardnumber will be stored for future reference)" in gray

## Right Panel
- Has a subtle left border
- Background appears very slightly blue-tinted (#f8fbff or similar)
- "Merchant" label - bold, dark
- "ROYAL OMAN POLICE" - gray value
- Horizontal divider line between each section
- "Website", "Track Id", "Terminal Info" sections
- "Amount" section with "OMR 10.000" in large bold text
- PAY button: Blue gradient (light blue to medium blue), pill shape, full width, "Pay" text
- CANCEL button: White/transparent with thin gray/blue border, pill shape, "Cancel" text

## Footer
- Security logos on the RIGHT side
- VeriSign, PCI DSS, Visa, Amex, MasterCard, OmanNet
- Subtle top border
- Logos are relatively small

## Key Color Differences I Notice vs Current Implementation:
1. Background might be slightly lighter than #ececec
2. The Pay button gradient looks like a solid light-to-medium blue (more like #4db6f5 to #2196f3)
3. The Cancel button border appears lighter/thinner - more gray than blue
4. The right panel background is very subtle
5. The "Click to Pay" icon (waves/arrows) is present between checkbox and text
6. Input borders appear slightly lighter/softer
7. The sidebar has NO background on active item - just the blue left border
