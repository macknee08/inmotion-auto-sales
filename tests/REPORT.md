# In Motion Auto Sales: site audit

**53 pass · 2 warn · 0 fail**  (online run)

## Connections
- ✅ 43/43 external URLs return 200
- ✅ SRI hash matches gsap.min.js
- ✅ SRI hash matches ScrollTrigger.min.js
- ✅ SRI hash matches Flip.min.js
- ✅ SRI hash matches lenis.min.js
- ✅ Inventory matches the dealer's live listings
- ✅ All local assets exist
- ✅ All call links dial +1 501-513-7290 (1 unique)
- ✅ Email links valid: ['mailto:inmotionautoar@yahoo.com']
- ✅ Every new-tab link uses rel="noopener"

## Legal
- ✅ Payment disclosure (Reg Z / TILA) present on page
- ✅ Payment disclosure states down payment, term, APR and matches the FIN config used to calculate payments
- ✅ Every per-vehicle payment in the quick view carries its own APR/term/down disclosure
- ✅ Every advertised monthly payment is marked † to the disclosure
- ✅ Price disclaimer: excludes tax, title, license, fees
- ✅ Subject-to-prior-sale disclaimer
- ✅ Vehicle-information accuracy disclaimer
- ✅ Financing subject-to-approval disclaimer
- ✅ AI motion clips disclosed (hero caption + disclosures)
- ✅ Manufacturer trademark disclaimer
- ✅ No risky absolute claims (guaranteed approval, no credit check, lowest price…)
- ✅ Privacy notice exists and is linked
- ✅ Google Maps is click-to-load (no third-party cookies before consent)
- ✅ No trackers present (matches privacy notice claim)
- ✅ Site collects no SSN/credit data itself (credit app stays on MotorLot)
- ⚠️ 4 listings have no/0 mileage on the dealer feed (shown as blank, not "0 mi"): ['2009 Land Rover Range Rover Sport', '2015 Chevrolet Equinox', '2015 Land Rover Range Rover Evoque', '2012 Kia Forte']
- ✅ 11 vehicles show "Call for price" (no payment advertised for them)
- ⚠️ Dealer feed mismatch, listing URL vs vehicle: ['2015-chevrolet-tahoe-2471']

## Accessibility
- ✅ index.html: <html lang="en">
- ✅ index.html: exactly one <h1> (1)
- ✅ index.html: unique ids
- ✅ index.html: every <img> has alt
- ✅ index.html: aria-controls → #mmenu exists
- ✅ index.html: responsive viewport meta
- ✅ privacy.html: <html lang="en">
- ✅ privacy.html: exactly one <h1> (1)
- ✅ privacy.html: unique ids
- ✅ privacy.html: every <img> has alt
- ✅ privacy.html: responsive viewport meta
- ✅ Skip-to-content link
- ✅ Reduced-motion mode honoured (CSS + JS)
- ✅ Autoplaying hero video has a pause control (WCAG 2.2.2)
- ✅ Visible keyboard focus styles
- ✅ Quick view uses native modal <dialog> (focus trap + Esc)
- ✅ Contrast ink on bg: 17.3:1 (AA needs 4.5)
- ✅ Contrast ink-2 on bg: 11.4:1 (AA needs 4.5)
- ✅ Contrast mute on bg: 7.4:1 (AA needs 4.5)
- ✅ Contrast mute on panel: 6.6:1 (AA needs 4.5)
- ✅ Contrast gold on bg: 14.3:1 (AA needs 4.5)
- ✅ Contrast on-gold on gold: 14.3:1 (AA needs 4.5)
- ✅ Contrast ink-2 on panel: 10.2:1 (AA needs 4.5)

## Performance
- ✅ First-paint payload (HTML+CSS+JS+poster+logo): 433 KB
- ✅ Hero video 3.6 MB (budget 5 MB)
- ✅ All grid thumbnails (800w WebP) under 250 KB
- ✅ Below-the-fold photos and clips lazy-load
