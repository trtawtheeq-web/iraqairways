# Comparison: One Way vs Multi-city picker screens

## One Way "Flying from?" screen:
- Header: back arrow + "Flying from?" + "Multi City" pill + "Add prom..." pill + X button
- Progress pills: From: Kuwait, KWI | To: - | calendar: - | 1 Passenger | Search →
- Search input
- Airport list with images

## Multi-city "Flying from?" screen:
- Header: back arrow + "Flying from?" + "Multi City" pill + "Add prom..." pill + X button
- Progress pills: ✈️From: Kuwait, KWI | 🛬To: - | 🗓️- | 👤1 Passenger | Search →
- Search input
- Airport list with images

## KEY DIFFERENCES:
1. Multi-city progress pills have EMOJIS (✈️, 🛬, 🗓️, 👤) while One Way has ICONS (plane SVG images)
2. Multi-city progress pills format: "✈️From: Kuwait, KWI" vs One Way: "From: Kuwait, KWI" (with plane icon)
3. Multi-city pills have colored borders/backgrounds while One Way pills are more subtle

## The original screenshot shows:
- Clean header: back arrow + "Flying to?" + "Multi-city" pill (right side only)
- NO progress pills at all
- Just the flight cards with From/To/Date stacked vertically

## SOLUTION:
On MOBILE, when in multi-city mode and editing a field (mcEdit is set):
- Hide the "Multi City" and "Add promo" pills from the header
- Hide the progress pills row entirely
- Just show: back arrow + title ("Flying from?" / "Flying to?" / "Trip dates")
- Show the airport list / calendar / passenger picker the same as One Way

Actually wait - looking again at both screenshots, they look IDENTICAL on desktop. The user is testing on MOBILE. Let me check what the mobile view looks like for both...

The issue is that on mobile, the multi-city picker shows extra elements that One Way doesn't show. I need to make them identical on mobile.
