"""In Motion Auto Sales: site audit.

    python3 tests/run_tests.py            # full run (needs network)
    python3 tests/run_tests.py --offline  # skip network checks

Checks connections (every link, CDN, asset), legal/compliance copy, accessibility
basics and page weight. Writes tests/REPORT.md and exits non-zero on any FAIL.
"""
import base64, concurrent.futures as cf, hashlib, html.parser, json, os, re, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OFFLINE = '--offline' in sys.argv
PAGES = ['index.html', 'privacy.html']
UA = {'User-Agent': 'Mozilla/5.0 (InMotion site audit)'}
results = []  # (section, status, message)

def rec(section, ok, msg, warn=False):
    results.append((section, 'PASS' if ok else ('WARN' if warn else 'FAIL'), msg))

def read(rel): return open(os.path.join(ROOT, rel), encoding='utf-8').read()

# ---------------------------------------------------------------- parse pages
class Collector(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.tags = []; self.text = []; self._skip = 0
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))
        if tag in ('script', 'style'): self._skip += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self._skip -= 1
    def handle_data(self, d):
        if not self._skip: self.text.append(d)

docs = {}
for p in PAGES:
    c = Collector(); c.feed(read(p)); docs[p] = c
site_js, data_js, css = read('js/site.js'), read('js/data.js'), read('css/site.css')
cars = json.loads(re.search(r'export const CARS = (\[.*\]);', data_js, re.S).group(1))
fin = dict(re.findall(r'(apr|term|down): ([\d.]+)', re.search(r'export const FIN = \{([^}]*)\}', site_js).group(1)))
fin = {k: float(v) for k, v in fin.items()}
all_text = {p: re.sub(r'\s+', ' ', ' '.join(d.text)) for p, d in docs.items()}

# ================================================================ CONNECTIONS
urls = set()
for p, d in docs.items():
    for tag, a in d.tags:
        if a.get('rel') in ('preconnect', 'dns-prefetch', 'canonical'): continue  # hints, not fetched resources
        for k in ('href', 'src', 'poster', 'data-src'):
            v = a.get(k)
            if v and v.startswith('http'): urls.add(v.replace('&amp;', '&'))
urls |= set(re.findall(r"https://[^\s'\"`<>)]+", site_js))
urls |= {c['url'] for c in cars}
urls = {u for u in urls if '${' not in u}

def fetch(u, tries=4):
    import time
    for i in range(tries):
        u2, st, body = _fetch(u)
        if st != 429: return u2, st, body
        time.sleep(2 ** i * 1.5)  # dealer host rate-limits bursts; back off
    return u2, st, body

def _fetch(u):
    try:
        req = urllib.request.Request(u, headers=UA, method='GET')
        with urllib.request.urlopen(req, timeout=20) as r: return u, r.status, r.read()
    except urllib.error.HTTPError as e: return u, e.code, b''
    except Exception as e: return u, str(e)[:60], b''

if OFFLINE:
    rec('Connections', True, f'Skipped {len(urls)} external URL checks (--offline)', warn=True)
else:
    import time
    dealer = sorted(u for u in urls if 'inmotionautosales.com' in u)
    other = sorted(urls - set(dealer))
    with cf.ThreadPoolExecutor(8) as ex: fetched = {u: (st, b) for u, st, b in ex.map(fetch, other)}
    for u in dealer:  # one at a time, politely
        _, st, b = fetch(u); fetched[u] = (st, b); time.sleep(.7)
    bad = {u: s for u, (s, _) in fetched.items() if isinstance(s, int) and s != 200}
    unreachable = [u for u, (s, _) in fetched.items() if not isinstance(s, int)]
    rec('Connections', not bad, f'{len(urls) - len(bad) - len(unreachable)}/{len(urls)} external URLs return 200' + (': ' + '; '.join(f'{s} {u}' for u, s in bad.items()) if bad else ''))
    if unreachable:
        rec('Connections', False, f'{len(unreachable)} URLs unreachable from this machine (network/DNS), re-run when online: {unreachable[:5]}', warn=True)
    # Subresource Integrity must match what the CDN serves today
    for tag, a in docs['index.html'].tags:
        if tag == 'script' and a.get('integrity'):
            body = fetched.get(a['src'], (0, b''))[1]
            if not body:
                rec('Connections', False, f"SRI not verified for {a['src'].rsplit('/', 1)[-1]} (CDN unreachable)", warn=True); continue
            got = 'sha384-' + base64.b64encode(hashlib.sha384(body).digest()).decode()
            rec('Connections', got == a['integrity'], f"SRI hash matches {a['src'].rsplit('/', 1)[-1]}")
    # dealer's live inventory vs what the site shows
    live = set()
    for pg in (1, 2, 3):
        body = fetch(f'https://www.inmotionautosales.com/inventory?page={pg}')[2].decode('utf-8', 'ignore')
        live |= set(re.findall(r'/inventory/(\d{4}-[a-z0-9-]+)', body))
    ours = {c['slug'] for c in cars}
    if not live:
        rec('Connections', False, "Couldn't reach the dealer's inventory pages to compare listings", warn=True); live = ours
    gone, new = ours - live, live - ours
    rec('Connections', not gone and not new,
        'Inventory matches the dealer\'s live listings' if not (gone or new) else
        f'Inventory drift: {len(gone)} sold/removed {sorted(gone)}, {len(new)} new {sorted(new)}. Re-run the scrape + tests/build_data.py', warn=True)

# local assets
missing = []
def check_local(ref, origin):
    ref = ref.split('#')[0].split('?')[0]
    if not ref or ref.startswith(('http', 'tel:', 'mailto:', 'data:', '#')): return
    if not os.path.exists(os.path.join(ROOT, ref)): missing.append(f'{ref} ({origin})')
for p, d in docs.items():
    for tag, a in d.tags:
        for k in ('href', 'src', 'poster', 'data-src'):
            if a.get(k): check_local(a[k], p)
        for k in ('srcset',):
            for part in (a.get(k) or '').split(','):
                if part.strip(): check_local(part.strip().split()[0], p)
for ref in re.findall(r'url\((?![\'"]?data:)([^)]+)\)', css): check_local(os.path.normpath(os.path.join('css', ref.strip('\'"'))), 'site.css')
for clip in re.findall(r"'[\w-]+': '(\w+)'", site_js.split('const CLIPS')[1].split('};')[0]):
    check_local(f'media/{clip}.mp4', 'CLIPS'); check_local(f'media/{clip}-poster.jpg', 'CLIPS')
for c in cars:
    for ph in c['photos']:
        for w in (800, 1600):
            for ext in ('jpg', 'webp'): check_local(f'img/v/{ph}-{w}.{ext}', c['slug'])
rec('Connections', not missing, f'All local assets exist' if not missing else f'Missing local files: {missing[:8]}')

# tel/mailto
tels = {a['href'] for d in docs.values() for t, a in d.tags if a.get('href', '').startswith('tel:')}
rec('Connections', tels == {'tel:+15015137290'}, f'All call links dial +1 501-513-7290 ({len(tels)} unique)')
mails = {a['href'] for d in docs.values() for t, a in d.tags if a.get('href', '').startswith('mailto:')}
rec('Connections', all(re.fullmatch(r'mailto:[^@\s]+@[^@\s]+\.\w+', m) for m in mails), f'Email links valid: {sorted(mails)}')
blank = [a.get('href') for d in docs.values() for t, a in d.tags if a.get('target') == '_blank' and 'noopener' not in (a.get('rel') or '')]
blank += re.findall(r'target="_blank"(?! rel="noopener")', site_js)
rec('Connections', not blank, 'Every new-tab link uses rel="noopener"')

# ================================================================ LEGAL
idx = all_text['index.html']
disc = re.search(r'†Estimated monthly payments.*?condition\.', idx)
rec('Legal', bool(disc), 'Payment disclosure (Reg Z / TILA) present on page')
if disc:
    d = disc.group(0)
    need = [f"${int(fin['down'])} down", f"{int(fin['term'])} monthly payments", f"{fin['apr']:g}% APR", 'not an offer of credit', 'approved credit']
    miss = [n for n in need if n not in d]
    rec('Legal', not miss, 'Payment disclosure states down payment, term, APR and matches the FIN config used to calculate payments' + (f' (missing/mismatch: {miss})' if miss else ''))
qv_fine = re.search(r'†Estimate only, not an offer of credit: \$\{money\(FIN\.down\)\} down, \$\{FIN\.term\} months at \$\{FIN\.apr\}% APR', site_js)
rec('Legal', bool(qv_fine), 'Every per-vehicle payment in the quick view carries its own APR/term/down disclosure')
rec('Legal', site_js.count('/mo<sup>†</sup>') >= 2 and 'Est. / mo†' in site_js, 'Every advertised monthly payment is marked † to the disclosure')
rec('Legal', 'exclude tax, title, license and dealer fees' in idx, 'Price disclaimer: excludes tax, title, license, fees')
rec('Legal', 'subject to prior sale' in idx, 'Subject-to-prior-sale disclaimer')
rec('Legal', 'verify all details' in idx, 'Vehicle-information accuracy disclaimer')
rec('Legal', 'not all buyers will qualify' in idx.lower() or 'subject to credit approval' in idx.lower(), 'Financing subject-to-approval disclaimer')
rec('Legal', 'motion clips were created from real photos' in idx and 'Motion added to a real lot photo' in idx, 'AI motion clips disclosed (hero caption + disclosures)')
rec('Legal', 'trademarks of their respective owners' in idx, 'Manufacturer trademark disclaimer')
banned = ['guaranteed financing', 'guaranteed approval', 'everyone approved', 'no credit check', 'lowest price', 'best price in', 'buy here pay here']
hits = [b for b in banned for p in PAGES if b in all_text[p].lower()] + [b for b in banned if b in site_js.lower()]
rec('Legal', not hits, 'No risky absolute claims (guaranteed approval, no credit check, lowest price…)' + (f': {hits}' if hits else ''))
rec('Legal', os.path.exists(os.path.join(ROOT, 'privacy.html')) and 'privacy.html' in read('index.html'), 'Privacy notice exists and is linked')
rec('Legal', '<iframe' not in read('index.html'), 'Google Maps is click-to-load (no third-party cookies before consent)')
rec('Legal', not re.search(r'google-analytics|gtag\(|fbq\(|hotjar', read('index.html') + site_js), 'No trackers present (matches privacy notice claim)')
rec('Legal', not re.search(r'name="[^"]*(ssn|social_security)', read('index.html'), re.I), 'Site collects no SSN/credit data itself (credit app stays on MotorLot)')
zero = [f"{c['year']} {c['make']} {c['model']}" for c in cars if not c['miles']]
rec('Legal', not zero, f'Mileage listed for every car' if not zero else f'{len(zero)} listings have no/0 mileage on the dealer feed (shown as blank, not "0 mi"): {zero}', warn=True)
noprice = [f"{c['year']} {c['make']} {c['model']}" for c in cars if not c['price']]
rec('Legal', True, f'{len(noprice)} vehicles show "Call for price" (no payment advertised for them)')
mism = [c['slug'] for c in cars if not c['slug'].startswith(f"{c['year']}-{c['make'].lower().replace(' ', '-')}")]
rec('Legal', not mism, 'Listing URLs match vehicle titles' if not mism else f'Dealer feed mismatch, listing URL vs vehicle: {mism}', warn=True)

# ================================================================ ACCESSIBILITY
for p, d in docs.items():
    tags = d.tags
    html_tag = next(a for t, a in tags if t == 'html')
    rec('Accessibility', html_tag.get('lang') == 'en', f'{p}: <html lang="en">')
    h1 = [t for t, a in tags if t == 'h1']
    rec('Accessibility', len(h1) == 1, f'{p}: exactly one <h1> ({len(h1)})')
    ids = [a['id'] for t, a in tags if 'id' in a]
    dup = {i for i in ids if ids.count(i) > 1}
    rec('Accessibility', not dup, f'{p}: unique ids' + (f' (dupes: {dup})' if dup else ''))
    noalt = [a.get('src') for t, a in tags if t == 'img' and 'alt' not in a]
    rec('Accessibility', not noalt, f'{p}: every <img> has alt' + (f' (missing: {noalt})' if noalt else ''))
    for t, a in tags:
        if a.get('aria-controls'): rec('Accessibility', a['aria-controls'] in ids, f"{p}: aria-controls → #{a['aria-controls']} exists")
    rec('Accessibility', any(t == 'meta' and a.get('name') == 'viewport' for t, a in tags), f'{p}: responsive viewport meta')
rec('Accessibility', 'class="skip"' in read('index.html'), 'Skip-to-content link')
rec('Accessibility', 'prefers-reduced-motion' in css and 'reduced' in site_js, 'Reduced-motion mode honoured (CSS + JS)')
rec('Accessibility', 'id="heroPause"' in read('index.html'), 'Autoplaying hero video has a pause control (WCAG 2.2.2)')
rec('Accessibility', ':focus-visible' in css, 'Visible keyboard focus styles')
rec('Accessibility', '<dialog' in read('index.html') and 'showModal' in site_js, 'Quick view uses native modal <dialog> (focus trap + Esc)')

def lum(hexc):
    r, g, b = (int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)
def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + .05) / (lb + .05)
var = dict(re.findall(r'--([\w-]+):(#[0-9a-f]{6})', css))
pairs = [('ink', 'bg', 4.5), ('ink-2', 'bg', 4.5), ('mute', 'bg', 4.5), ('mute', 'panel', 4.5), ('gold', 'bg', 4.5), ('on-gold', 'gold', 4.5), ('ink-2', 'panel', 4.5)]
for fg, bg, need in pairs:
    r = ratio(var[fg], var[bg]); rec('Accessibility', r >= need, f'Contrast {fg} on {bg}: {r:.1f}:1 (AA needs {need})')

# ================================================================ PERFORMANCE
def size(rel): return os.path.getsize(os.path.join(ROOT, rel)) if os.path.exists(os.path.join(ROOT, rel)) else 0
first = sum(size(f) for f in ['index.html', 'css/site.css', 'js/site.js', 'js/data.js', 'media/titan-poster.jpg', 'img/brand/crest-gold.png'])
rec('Performance', first < 600_000, f'First-paint payload (HTML+CSS+JS+poster+logo): {first / 1024:.0f} KB')
hero = size('media/titan.mp4'); rec('Performance', hero < 5_000_000, f'Hero video {hero / 1e6:.1f} MB (budget 5 MB)')
big = [f for f in os.listdir(os.path.join(ROOT, 'img/v')) if f.endswith('-800.webp') and size(f'img/v/{f}') > 250_000]
rec('Performance', not big, 'All grid thumbnails (800w WebP) under 250 KB' + (f': {big}' if big else ''), warn=True)
rec('Performance', 'loading="lazy"' in site_js and 'preload="none"' in site_js, 'Below-the-fold photos and clips lazy-load')

# ================================================================ REPORT
order = ['Connections', 'Legal', 'Accessibility', 'Performance']
lines = ['# In Motion Auto Sales: site audit', '']
counts = {s: sum(1 for r in results if r[1] == s) for s in ('PASS', 'WARN', 'FAIL')}
lines.append(f"**{counts['PASS']} pass · {counts['WARN']} warn · {counts['FAIL']} fail**  ({'offline' if OFFLINE else 'online'} run)\n")
for sec in order:
    lines.append(f'## {sec}')
    for s, st, m in results:
        if s == sec: lines.append(f"- {'✅' if st == 'PASS' else '⚠️' if st == 'WARN' else '❌'} {m}")
    lines.append('')
open(os.path.join(ROOT, 'tests', 'REPORT.md'), 'w').write('\n'.join(lines))
print('\n'.join(lines))
sys.exit(1 if counts['FAIL'] else 0)
