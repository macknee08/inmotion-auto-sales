import { CARS } from './data.js';

/* ==========================================================================
   Config: every business fact and financing assumption lives here.
   ========================================================================== */
const DEALER = {
  phone: '501-513-7290', tel: '+15015137290',
  creditApp: 'https://www.inmotionautosales.com/accounts/3904/credit-applications/new',
  tz: 'America/Chicago', open: 9, close: 18, closedDays: [0], // Sun closed, Mon–Sat 9–6
};
// Payment estimates shown on listings (Reg Z: any advertised payment must state these terms).
// The dealer must confirm these terms are actually available before launch.
export const FIN = { apr: 11.25, term: 72, down: 0 };

// Cinematic clips made with Higgsfield from real lot photos; poster = first frame.
const CLIPS = {
  '2016-nissan-titan-xd-2104': 'titan',
  '2014-porsche-cayenne-2373': 'cayenne',
  '2015-land-rover-lr4-2474': 'lr4',
  '2016-jeep-wrangler-2479': 'wrangler',
};
const SHOWROOM = ['2014-porsche-cayenne-2373', '2016-porsche-macan-2437', '2015-land-rover-lr4-2474',
                  '2016-jeep-wrangler-2479', '2016-nissan-titan-xd-2104'];

/* ==========================================================================
   Helpers
   ========================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const miles = n => n ? n.toLocaleString('en-US') + ' mi' : null;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const payment = (principal, apr, months) => {
  const r = apr / 1200;
  return r ? principal * r / (1 - (1 + r) ** -months) : principal / months;
};
const carName = c => `${c.year} ${c.make} ${c.model}`;
const img = (id, w) => `img/v/${id}-${w}`;
const picture = (id, alt, { sizes = '(max-width:700px) 100vw, 33vw', cls = '', eager = false } = {}) =>
  `<picture><source type="image/webp" srcset="${img(id, 800)}.webp 800w, ${img(id, 1600)}.webp 1600w" sizes="${sizes}">` +
  `<img class="${cls}" src="${img(id, 800)}.jpg" srcset="${img(id, 800)}.jpg 800w, ${img(id, 1600)}.jpg 1600w" sizes="${sizes}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
const icon = {
  road: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20 8 4M20 20 16 4M12 6v2M12 11v2M12 16v2"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/></svg>',
  arrow: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
const hasGSAP = !!(window.gsap && window.ScrollTrigger);
document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');
if (reduced || !hasGSAP) document.documentElement.classList.add('reduced');

/* ==========================================================================
   Live open/closed (dealer time zone)
   ========================================================================== */
function storeStatus() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: DEALER.tz }));
  const d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  const openToday = !DEALER.closedDays.includes(d);
  const open = openToday && h >= DEALER.open && h < DEALER.close;
  let label;
  if (open) label = 'Open now · until 6 PM';
  else if (openToday && h < DEALER.open) label = 'Opens today 9 AM';
  else label = (d === 6 || d === 0) ? 'Opens Monday 9 AM' : 'Opens tomorrow 9 AM';
  return { open, label, day: d };
}
function renderStatus() {
  const s = storeStatus();
  $$('[data-status]').forEach(el => {
    el.querySelector('.dot')?.classList.toggle('off', !s.open);
    const t = el.querySelector('[data-status-text]'); if (t) t.textContent = s.label;
  });
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const h = $('#hours');
  if (h) h.innerHTML = [1, 2, 3, 4, 5, 6, 0].map(i =>
    `<div class="${i === s.day ? 'today' : ''}"><span>${days[i]}</span><span>${DEALER.closedDays.includes(i) ? 'Closed' : '9:00 AM – 6:00 PM'}</span></div>`).join('');
}

/* ==========================================================================
   Marquee: makes actually in stock
   ========================================================================== */
function renderMarquee() {
  const makes = [...new Set(CARS.map(c => c.make))].sort();
  const row = makes.map(m => `<span>${esc(m)}</span><img src="img/brand/crest-gold.png" alt="" width="30" height="30">`).join('');
  $('#marquee').innerHTML = row + row;
  $('#marquee').setAttribute('aria-label', `Makes in stock: ${makes.join(', ')}`);
}

/* ==========================================================================
   Showroom
   ========================================================================== */
function renderShowroom() {
  const cars = SHOWROOM.map(s => CARS.find(c => c.slug === s)).filter(Boolean);
  const stage = $('#stage');
  stage.innerHTML = cars.map((c, i) => {
    const clip = CLIPS[c.slug];
    const media = clip
      ? `<video muted playsinline loop preload="none" poster="media/${clip}-poster.jpg" data-src="media/${clip}.mp4" aria-hidden="true"></video>`
      : picture(c.photos[0], carName(c), { sizes: '100vw' });
    return `<article class="slide${i === 0 ? ' is-active' : ''}" data-i="${i}" aria-roledescription="slide" aria-label="${i + 1} of ${cars.length}: ${esc(carName(c))}">
      <div class="slide__media">${media}</div>
      <div class="slide__ghost" aria-hidden="true">${esc(c.model)}</div>
      <div class="slide__body">
        <div class="slide__kicker"><span class="pill">${c.year}</span><span class="pill">${esc(c.make)}</span>${clip ? '<span class="pill">Motion preview</span>' : ''}</div>
        <h3 class="display slide__name">${esc(c.model)}</h3>
        <p class="slide__trim">${esc([c.trim, c.ext, c.trans].filter(Boolean).join(' · '))}</p>
        <div class="slide__specs">
          <div class="spec"><b data-roll="${c.price || 0}" data-fmt="money">${c.price ? money(c.price) : 'Call'}</b><span>Price*</span></div>
          ${c.miles ? `<div class="spec"><b data-roll="${c.miles}">${c.miles.toLocaleString()}</b><span>Miles</span></div>` : ''}
          ${c.price ? `<div class="spec"><b data-roll="${Math.round(payment(c.price - FIN.down, FIN.apr, FIN.term))}" data-fmt="money">${money(payment(c.price - FIN.down, FIN.apr, FIN.term))}</b><span>Est. / mo†</span></div>` : ''}
        </div>
        <div class="slide__cta">
          <button class="btn btn-gold" data-qv="${c.slug}">See this ${esc(c.model)} ${icon.arrow}</button>
          <a class="btn btn-line" href="${DEALER.creditApp}" target="_blank" rel="noopener">${icon.shield}Get Pre-Approved</a>
        </div>
      </div>
    </article>`;
  }).join('') + `<div class="stage__ui" aria-hidden="true"><div class="stage__count"><span id="stageN">01</span> <em>/ 0${cars.length}</em></div>
    <div class="stage__bars">${cars.map((_, i) => `<button tabindex="-1" data-go="${i}"><i></i></button>`).join('')}</div></div>`;
}

/* ==========================================================================
   Inventory grid + filters
   ========================================================================== */
const state = { body: 'All', make: '', q: '', sort: 'featured', max: 0 };
const BODIES = ['All', 'Truck', 'SUV', 'Car'];
const maxPrice = Math.ceil(Math.max(...CARS.map(c => c.price || 0)) / 1000) * 1000;

function carCard(c) {
  const ph = c.photos.length
    ? c.photos.slice(0, 5).map((p, i) => picture(p, i ? '' : `${carName(c)} ${c.trim}`, { cls: i ? '' : 'is-on' }).replace('<img class=""', '<img')).join('')
    : `<div class="noimg"><img src="img/brand/crest-gold.png" alt="" width="140" height="140"><span>Photos coming soon</span></div>`;
  const dots = c.photos.length > 1 ? `<div class="car__dots">${c.photos.slice(0, 5).map((_, i) => `<i class="${i ? '' : 'is-on'}"></i>`).join('')}</div>` : '';
  const est = c.price ? payment(c.price - FIN.down, FIN.apr, FIN.term) : 0;
  return `<article class="car" data-flip-id="${c.slug}" data-slug="${c.slug}">
    <div class="car__ph">${ph}${dots}
      <div class="car__tags"><span class="tag">${c.year}</span>${c.photos.length > 1 ? `<span class="tag">${c.photos.length} photos</span>` : ''}</div>
    </div>
    <div class="car__body">
      <h3 class="car__name">${esc(c.make)} ${esc(c.model)}</h3>
      <p class="car__trim">${esc(c.trim || ' ')}</p>
      <div class="car__specs">
        ${c.miles ? `<span>${icon.road}${miles(c.miles)}</span>` : ''}
        ${c.trans ? `<span>${icon.gear}${esc(c.trans)}</span>` : ''}
        ${c.ext ? `<span>${icon.drop}${esc(c.ext)}</span>` : ''}
      </div>
      <div class="car__foot">
        ${c.price ? `<span class="price">${money(c.price)}<sup>*</sup></span><span class="mo"><b>${money(est)}/mo<sup>†</sup></b>${FIN.term} mo · ${FIN.apr}% APR</span>`
                  : `<span class="price call">Call for price</span><span class="mo"><b>Ask us</b>about financing</span>`}
      </div>
    </div>
    <button class="car__open" data-qv="${c.slug}" aria-label="View details: ${esc(carName(c))}"></button>
  </article>`;
}

function filtered() {
  const q = state.q.trim().toLowerCase();
  const list = CARS.filter(c =>
    (state.body === 'All' || c.body === state.body) &&
    (!state.make || c.make === state.make) &&
    (!state.max || (c.price && c.price <= state.max)) &&
    (!q || `${c.year} ${c.make} ${c.model} ${c.trim} ${c.ext} ${c.vin}`.toLowerCase().includes(q)));
  const P = c => c.price || Infinity;
  const sorters = {
    featured: (a, b) => (+!a.photos.length - +!b.photos.length) || ((b.price || 0) - (a.price || 0)),
    low: (a, b) => P(a) - P(b), high: (a, b) => (b.price || 0) - (a.price || 0),
    new: (a, b) => b.year - a.year, miles: (a, b) => (a.miles ?? 1e9) - (b.miles ?? 1e9),
  };
  return list.sort(sorters[state.sort]);
}

function renderGrid({ animate = true } = {}) {
  const grid = $('#grid');
  const flipState = animate && hasGSAP && window.Flip && !reduced ? Flip.getState(grid.children) : null;
  const list = filtered();
  grid.innerHTML = list.map(carCard).join('') ||
    `<p class="empty">No matches on the lot right now. Call <a class="gold" href="tel:${DEALER.tel}">${DEALER.phone}</a> and we'll find it.</p>`;
  $('#count').textContent = `${list.length} of ${CARS.length} vehicles`;
  $$('.chip[data-body]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.body === state.body)));
  bindCardScrub(grid);
  if (flipState) {
    Flip.from(flipState, { targets: grid.children, duration: .6, ease: 'power3.inOut', absolute: true, scale: true,
      onEnter: els => gsap.fromTo(els, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .5, stagger: .03 }),
      onLeave: els => gsap.to(els, { opacity: 0, scale: .9, duration: .3 }),
      onComplete: () => ScrollTrigger.refresh() });
  }
}

// Mouse across a card scrubs through its photos (desktop); a tap opens quick view.
function bindCardScrub(root) {
  if (!finePointer) return;
  $$('.car', root).forEach(card => {
    const imgs = $$('.car__ph picture img', card), dots = $$('.car__dots i', card);
    if (imgs.length < 2) return;
    const set = i => { imgs.forEach((im, k) => im.classList.toggle('is-on', k === i)); dots.forEach((d, k) => d.classList.toggle('is-on', k === i)); };
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      set(Math.min(imgs.length - 1, Math.floor((e.clientX - r.left) / r.width * imgs.length)));
    });
    card.addEventListener('pointerleave', () => set(0));
  });
}

function initFilters() {
  const bodies = BODIES.map(b => {
    const n = b === 'All' ? CARS.length : CARS.filter(c => c.body === b).length;
    return `<button class="chip" data-body="${b}" aria-pressed="${b === 'All'}">${b}<span class="n">${n}</span></button>`;
  }).join('');
  $('#chips').innerHTML = bodies;
  $('#chips').addEventListener('click', e => { const b = e.target.closest('[data-body]'); if (b) { state.body = b.dataset.body; renderGrid(); } });
  const makes = [...new Set(CARS.map(c => c.make))].sort();
  $('#make').innerHTML = '<option value="">All makes</option>' + makes.map(m => `<option>${esc(m)}</option>`).join('');
  $('#make').addEventListener('change', e => { state.make = e.target.value; renderGrid(); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });
  let t; $('#q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; renderGrid(); }, 160); });
  const budget = $('#budget');
  budget.max = maxPrice; budget.value = maxPrice;
  const syncBudget = () => {
    const v = +budget.value; state.max = v >= maxPrice ? 0 : v;
    $('#budgetOut').textContent = state.max ? `Under ${money(state.max)}` : 'Any price';
    budget.style.setProperty('--p', (v - budget.min) / (budget.max - budget.min) * 100 + '%');
  };
  budget.addEventListener('input', syncBudget);
  budget.addEventListener('change', () => renderGrid());
  syncBudget();
}

/* ==========================================================================
   Quick view (native <dialog>: focus trap, Esc, inert background for free)
   ========================================================================== */
function openQuickView(slug, opener) {
  const c = CARS.find(x => x.slug === slug); if (!c) return;
  const dlg = $('#qv');
  const photos = c.photos.length ? c.photos : null;
  const est = c.price ? payment(c.price - FIN.down, FIN.apr, FIN.term) : 0;
  const rows = [['Mileage', miles(c.miles)], ['Transmission', c.trans], ['Engine', c.engine], ['Fuel', c.fuel],
    ['Exterior', c.ext], ['Interior', c.int], ['MPG', c.mpg], ['Stock #', c.id], ['VIN', c.vin]].filter(r => r[1]);
  $('.qv__card', dlg).innerHTML = `
    <button class="qv__x" data-close aria-label="Close" autofocus><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <div class="qv__gal">
      ${photos ? `<div class="qv__track" tabindex="0" aria-label="Photo gallery">${photos.map((p, i) =>
        `<figure>${picture(p, `${carName(c)}, photo ${i + 1} of ${photos.length}`, { sizes: '(max-width:900px) 100vw, 60vw', eager: i === 0 })}</figure>`).join('')}</div>
        <span class="qv__idx"><span data-idx>1</span> / ${photos.length}</span>
        ${photos.length > 1 ? `<div class="qv__nav"><button data-step="-1" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg></button><button data-step="1" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg></button></div>` : ''}`
      : `<div class="noimg" style="position:relative;min-height:320px;height:100%"><img src="img/brand/crest-gold.png" alt="" width="140" height="140"><span>Photos coming soon</span></div>`}
    </div>
    <div class="qv__info">
      <span class="eyebrow">${c.year} · ${esc(c.body)}</span>
      <h2 class="display" id="qvTitle">${esc(c.make)} ${esc(c.model)} <span class="gold">${esc(c.trim)}</span></h2>
      <div class="qv__price">${c.price ? `<span class="price">${money(c.price)}<sup>*</sup></span><span class="mo"><b>${money(est)}/mo<sup>†</sup></b>${FIN.term} mo · ${FIN.apr}% APR · ${money(FIN.down)} down</span>` : '<span class="price call">Call for price</span>'}</div>
      <dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${c.features.length ? `<div class="qv__feats">${c.features.slice(0, 12).map(f => `<span>${esc(f)}</span>`).join('')}</div>` : ''}
      ${c.desc ? `<p class="qv__desc">${esc(c.desc)}</p>` : ''}
      <div class="qv__cta">
        <a class="btn btn-gold" href="tel:${DEALER.tel}">${icon.phone}Call about this ${esc(c.model)}</a>
        <a class="btn btn-line btn-sm" href="${DEALER.creditApp}" target="_blank" rel="noopener">${icon.shield}Pre-Approve</a>
        <a class="btn btn-line btn-sm" href="${c.url}" target="_blank" rel="noopener">Full listing</a>
      </div>
      <p class="fine">*Price excludes tax, title, license and dealer fees. Vehicle information is provided by the dealer and may contain errors; verify all details before purchase. Subject to prior sale.${c.price ? ` †Estimate only, not an offer of credit: ${money(FIN.down)} down, ${FIN.term} months at ${FIN.apr}% APR, with approved credit. Your rate and terms may differ.` : ''}</p>
    </div>`;
  dlg.setAttribute('aria-labelledby', 'qvTitle');
  dlg.returnFocus = opener;
  dlg.showModal();
  window.__lenis?.stop();
  const track = $('.qv__track', dlg);
  if (track) {
    const idx = $('[data-idx]', dlg);
    track.addEventListener('scroll', () => { idx.textContent = Math.round(track.scrollLeft / track.clientWidth) + 1; }, { passive: true });
    dlg.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () =>
      track.scrollBy({ left: track.clientWidth * +b.dataset.step, behavior: reduced ? 'auto' : 'smooth' })));
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: track.clientWidth * (e.key === 'ArrowRight' ? 1 : -1), behavior: 'smooth' }); } });
  }
}
function initQuickView() {
  const dlg = $('#qv');
  document.addEventListener('click', e => { const t = e.target.closest('[data-qv]'); if (t) openQuickView(t.dataset.qv, t); });
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  dlg.addEventListener('close', () => { window.__lenis?.start(); dlg.returnFocus?.focus?.(); });
}

/* ==========================================================================
   Payment calculator
   ========================================================================== */
function initCalc() {
  const price = $('#cPrice'), down = $('#cDown'), apr = $('#cApr'), out = $('#cPay'), arc = $('#cArc');
  let term = FIN.term, shown = 0;
  $('#cTerms').innerHTML = [36, 48, 60, 72].map(t => `<button class="chip" data-term="${t}" aria-pressed="${t === term}">${t} mo</button>`).join('');
  $('#cTerms').addEventListener('click', e => { const b = e.target.closest('[data-term]'); if (!b) return; term = +b.dataset.term; $$('[data-term]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); update(); });
  const fill = el => el.style.setProperty('--p', (el.value - el.min) / (el.max - el.min) * 100 + '%');
  function update() {
    [price, down, apr].forEach(fill);
    $('#cPriceOut').textContent = money(price.value); $('#cDownOut').textContent = money(down.value); $('#cAprOut').textContent = (+apr.value).toFixed(2) + '%';
    const m = payment(Math.max(price.value - down.value, 0), +apr.value, term);
    $('#cTermOut').textContent = term;
    if (hasGSAP && !reduced) { const o = { v: shown }; gsap.to(o, { v: m, duration: .5, ease: 'power2.out', onUpdate: () => { out.textContent = money(o.v); shown = o.v; } }); }
    else out.textContent = money(m);
    arc.style.strokeDashoffset = 100 - Math.min(m / 900, 1) * 100;
  }
  [price, down, apr].forEach(el => el.addEventListener('input', update));
  update();
}

/* ==========================================================================
   Chrome: header, mobile menu, call bar, map, hero video
   ========================================================================== */
function initChrome() {
  const header = $('#header'), bar = $('#callbar');
  let last = 0;
  const onScroll = y => {
    header.classList.toggle('is-solid', y > 40);
    header.classList.toggle('is-hidden', y > 600 && y > last && !$('#mmenu').classList.contains('is-open'));
    bar.classList.toggle('is-in', y > innerHeight * .6);
    last = y;
  };
  addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  onScroll(scrollY);

  const burger = $('#burger'), menu = $('#mmenu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open)); menu.classList.toggle('is-open', open);
    menu.inert = !open; document.body.style.overflow = open ? 'hidden' : '';
    open ? window.__lenis?.stop() : window.__lenis?.start();
  };
  menu.inert = true;
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); } });

  // Google Maps loads only when asked (no third-party cookies until the visitor opts in).
  $('#mapLoad')?.addEventListener('click', () => {
    $('#map').innerHTML = '<iframe title="Map to In Motion Auto Sales, 910 N Main St, Harrison, AR" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=910+N+Main+St,+Harrison,+AR+72601&output=embed"></iframe>';
  });

  // Hero video + required pause control (WCAG 2.2.2: moving content > 5s must be pausable).
  const v = $('#heroVideo'), ctl = $('#heroPause');
  const pauseIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
  const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>';
  if (v) {
    if (reduced || navigator.connection?.saveData) { v.removeAttribute('autoplay'); v.pause(); ctl.innerHTML = playIcon; ctl.setAttribute('aria-label', 'Play background video'); }
    ctl.addEventListener('click', () => {
      const play = v.paused; play ? v.play() : v.pause();
      ctl.innerHTML = play ? pauseIcon : playIcon;
      ctl.setAttribute('aria-label', play ? 'Pause background video' : 'Play background video');
    });
  }
  // Lazy-load + play/pause clips only while on screen.
  const io = new IntersectionObserver(entries => entries.forEach(({ target: vid, isIntersecting }) => {
    if (isIntersecting) {
      if (!vid.src && vid.dataset.src) vid.src = vid.dataset.src;
      if (!reduced && !(vid === v && v.dataset.userPaused)) vid.play().catch(() => {});
    } else vid.pause();
  }), { rootMargin: '200px' });
  $$('video[data-src], #heroVideo').forEach(vid => io.observe(vid));
  ctl?.addEventListener('click', () => { v.dataset.userPaused = v.paused ? '1' : ''; });
}

/* ==========================================================================
   Motion (GSAP). Everything above works without it.
   ========================================================================== */
function splitWords(el) {
  if (el.dataset.splitDone) return $$('.w > span', el);
  el.dataset.splitDone = '1'; el.classList.add('split');
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.textContent = part; w.append(i); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
    });
  };
  walk(el);
  return $$('.w > span', el);
}

function rollNumbers(scope) {
  $$('[data-roll]', scope).forEach(el => {
    const end = +el.dataset.roll; if (!end) return;
    const fmt = el.dataset.fmt === 'money' ? money : n => Math.round(n).toLocaleString('en-US');
    const o = { v: end * .55 };
    gsap.to(o, { v: end, duration: 1.4, ease: 'expo.out', onUpdate: () => el.textContent = fmt(o.v) });
  });
}

function initMotion() {
  gsap.registerPlugin(ScrollTrigger, ...(window.Flip ? [Flip] : []));
  const lenis = window.Lenis ? new Lenis({ lerp: .1, smoothWheel: true }) : null;
  if (lenis) {
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href')); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: -60, duration: 1.4 }); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
    }));
  }

  /* --- preloader → hero intro --- */
  const loader = $('#loader'), crestFill = $('.loader__crest .fill'), count = $('#loaderCount');
  lenis?.stop();
  const p = { v: 0 };
  const heroWords = splitWords($('#heroTitle'));
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.to(p, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { crestFill.style.setProperty('--p', p.v + '%'); count.textContent = Math.round(p.v); } })
    .to('.loader__crest', { scale: 1.15, duration: .4, ease: 'power2.in' })
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=.1')
    .set(loader, { display: 'none' })
    .from('.hero__media', { scale: 1.25, duration: 2.2 }, '-=.9')
    .from(heroWords, { yPercent: 115, rotate: 4, duration: 1.3, stagger: .07 }, '-=1.9')
    .from('.hero__row > *, .hero__chips .pill, #heroPause', { y: 26, opacity: 0, duration: 1, stagger: .08 }, '-=1')
    .from('#header', { yPercent: -100, duration: 1 }, '<')
    .add(() => lenis?.start());

  /* --- hero scroll: video shrinks into a framed card, title drifts --- */
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__media', { clipPath: 'inset(7% 5% 7% 5% round 28px)', scale: .96, ease: 'none' }, 0)
    .to('#heroTitle', { yPercent: -35, opacity: .2, ease: 'none' }, 0)
    .to('.hero__row', { y: -60, opacity: 0, ease: 'none' }, 0);

  /* --- generic reveals --- */
  $$('[data-split]').forEach(el => {
    const words = splitWords(el);
    gsap.from(words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: el, start: 'top 86%' } });
  });
  ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .08, overwrite: true }) });

  /* --- marquee leans with scroll velocity --- */
  const mq = $('.marquee');
  ScrollTrigger.create({ onUpdate: s => gsap.to(mq, { skewX: gsap.utils.clamp(-10, 10, s.getVelocity() / -150), duration: .4, overwrite: true }) });

  /* --- manifesto lights up word by word --- */
  splitWords($('#manifesto'));
  $$('#manifesto .w').forEach(w => w.classList.add('w2'));
  gsap.to('#manifesto .w', { opacity: 1, stagger: .04, ease: 'none', scrollTrigger: { trigger: '#manifesto', start: 'top 78%', end: 'bottom 50%', scrub: true } });

  /* --- stats roll --- */
  $$('[data-count]').forEach(el => {
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(o, { v: +el.dataset.count, duration: 2, ease: 'expo.out', onUpdate: () => el.textContent = Math.round(o.v) + (el.dataset.suffix || '') }) });
  });

  /* --- inspection checklist draws its ticks one by one --- */
  $$('.checks li').forEach((li, i) => ScrollTrigger.create({ trigger: li, start: 'top 85%', once: true, onEnter: () => setTimeout(() => li.classList.add('is-in'), i * 120) }));

  /* --- pillars parallax --- */
  $$('.pillar img').forEach(im => gsap.fromTo(im, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: im.parentElement, scrub: true } }));

  /* --- showroom --- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const slides = $$('.slide'), bars = $$('.stage__bars button'), n = slides.length;
    let cur = -1;
    const show = i => {
      if (i === cur) return;
      const prev = slides[cur], next = slides[i]; cur = i;
      $('#stageN').textContent = String(i + 1).padStart(2, '0');
      bars.forEach((b, k) => b.classList.toggle('is-done', k <= i));
      if (prev) { gsap.to(prev, { autoAlpha: 0, duration: .6, ease: 'power2.inOut' }); prev.querySelector('video')?.pause(); }
      next.classList.add('is-active');
      const vid = next.querySelector('video');
      if (vid) { if (!vid.src) vid.src = vid.dataset.src; vid.currentTime = 0; vid.play().catch(() => {}); }
      gsap.timeline()
        .fromTo(next, { autoAlpha: 0 }, { autoAlpha: 1, duration: .6, ease: 'power2.inOut' })
        .fromTo(next.querySelector('.slide__media > *'), { scale: 1.22, filter: 'brightness(.4)' }, { scale: 1.06, filter: 'brightness(1)', duration: 1.6, ease: 'expo.out' }, 0)
        .fromTo(next.querySelector('.slide__ghost'), { xPercent: 12, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.6, ease: 'expo.out' }, 0)
        .fromTo(splitWords(next.querySelector('.slide__name')), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: .05, ease: 'expo.out' }, .15)
        .fromTo(next.querySelectorAll('.slide__kicker, .slide__trim, .spec, .slide__cta'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .07, ease: 'expo.out' }, .3)
        .add(() => rollNumbers(next), .35);
    };
    gsap.set(slides, { autoAlpha: 0 });
    const st = ScrollTrigger.create({
      trigger: '#stage', start: 'top top', end: () => '+=' + innerHeight * (n - .3), pin: true, scrub: true,
      snap: { snapTo: 1 / (n - 1), duration: { min: .2, max: .6 }, ease: 'power2.inOut' },
      onUpdate: s => {
        show(Math.min(n - 1, Math.round(s.progress * (n - 1))));
        // ghost text drifts continuously with scroll
        slides.forEach(sl => gsap.set(sl.querySelector('.slide__ghost'), { x: -s.progress * 220 }));
      },
      onEnter: () => show(0),
    });
    bars.forEach((b, i) => b.addEventListener('click', () => lenis ? lenis.scrollTo(st.start + (st.end - st.start) * i / (n - 1)) : scrollTo(0, st.start + (st.end - st.start) * i / (n - 1))));
    show(0);
    return () => { slides.forEach(s => s.classList.remove('is-active')); gsap.set(slides, { clearProps: 'all' }); };
  });
  mm.add('(max-width: 860px)', () => {
    $$('.slide').forEach(sl => {
      const media = sl.querySelector('.slide__media > *');
      gsap.fromTo(media, { yPercent: -6, scale: 1.18 }, { yPercent: 6, scale: 1.08, ease: 'none', scrollTrigger: { trigger: sl, scrub: true } });
      gsap.from(splitWords(sl.querySelector('.slide__name')), { yPercent: 110, duration: 1, stagger: .05, ease: 'expo.out', scrollTrigger: { trigger: sl, start: 'top 60%' } });
      gsap.from(sl.querySelectorAll('.slide__kicker, .slide__trim, .spec, .slide__cta'), { y: 24, opacity: 0, duration: .8, stagger: .07, ease: 'expo.out',
        scrollTrigger: { trigger: sl, start: 'top 55%', onEnter: () => rollNumbers(sl) } });
    });
  });

  /* --- big CTA headline slides across --- */
  gsap.fromTo('#huge', { xPercent: 30 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: '.bigcta', scrub: true } });
  gsap.from('.bigcta .crest', { rotate: -90, scale: .4, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.bigcta', start: 'top 60%' } });

  /* --- inventory cards stagger in the first time --- */
  ScrollTrigger.create({ trigger: '#grid', start: 'top 85%', once: true, onEnter: () => gsap.from('#grid > .car', { y: 60, opacity: 0, duration: .9, stagger: .05, ease: 'expo.out', clearProps: 'transform,opacity' }) });

  /* --- desktop flourishes: cursor + magnetic buttons --- */
  if (finePointer) {
    const cur = $('#cursor'); const xTo = gsap.quickTo(cur, 'x', { duration: .25, ease: 'power3' }), yTo = gsap.quickTo(cur, 'y', { duration: .25, ease: 'power3' });
    addEventListener('pointermove', e => { cur.classList.add('is-on'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => {
      const car = e.target.closest('.car, .pillar'); cur.classList.toggle('is-view', !!car); cur.textContent = car ? 'VIEW' : '';
    });
    $$('.btn').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .22, y: (e.clientY - r.top - r.height / 2) * .3, duration: .4 }); });
      b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
    });
  }
  addEventListener('load', () => ScrollTrigger.refresh());
}

/* ==========================================================================
   Boot
   ========================================================================== */
renderStatus(); setInterval(renderStatus, 60_000);
renderMarquee();
renderShowroom();
initFilters();
renderGrid({ animate: false });
initQuickView();
initCalc();
initChrome();
$('#year').textContent = new Date().getFullYear();
$$('[data-car-count]').forEach(el => el.textContent = CARS.length);
if (hasGSAP && !reduced) initMotion();
else { $('#loader')?.remove(); $$('[data-reveal]').forEach(el => el.style.cssText = 'opacity:1;transform:none'); }
