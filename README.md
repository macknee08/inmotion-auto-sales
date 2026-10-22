# In Motion Auto Sales: website

Static site, no build step. Host anywhere that serves files (GitHub Pages, Netlify, Vercel).

```
index.html        page markup
privacy.html      privacy notice
css/site.css      all styles (brand palette sampled from the dealership sign)
js/site.js        app logic + animations (GSAP, ScrollTrigger, Flip, Lenis via CDN with SRI)
js/data.js        inventory, generated from the dealer's MotorLot listings (don't hand-edit)
img/brand/        lion crest (gold / dark / white)
img/v/            vehicle photos, 800w + 1600w, JPEG + WebP
media/            Higgsfield motion clips (seamless loops) + posters
tests/            build_data.py (inventory → data.js), run_tests.py (audit → REPORT.md)
```

## Update inventory
1. Re-scrape the dealer's inventory into `inventory.json` and photos into `img/cars/`.
2. `python3 tests/build_data.py path/to/inventory.json`
3. `python3 tests/run_tests.py` to confirm everything still passes.

## Before launch: dealer must confirm
- **Payment assumptions** in `js/site.js` → `FIN` (11.25% APR, 72 mo, $0 down). Reg Z requires advertised terms to be ones the dealer actually arranges. Change them there and the disclosures update everywhere.
- **Phone number.** The site uses 501-513-7290; their old site also shows 870-365-3866 once.
- **Trust claims** in the "In Motion difference" list (inspection, history reports).
- **Privacy notice** wording, especially the GLBA paragraph.
- **Dealer feed issues** flagged in `tests/REPORT.md` (missing mileage, a listing URL that doesn't match its vehicle).

## Tests
`python3 tests/run_tests.py` checks every external link, CDN integrity hashes, local assets, call/email links, legal disclosures (Reg Z payment terms, price/fee and prior-sale disclaimers, AI-motion disclosure, banned claims, privacy), accessibility basics (lang, one h1, unique ids, alt text, contrast, reduced motion, video pause), and page weight. Use `--offline` to skip network checks.
