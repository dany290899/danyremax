(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  let WA = '51960865950';
  const waLink = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  const el = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => c != null && n.append(c));
    return n;
  };
  const svgUse = (id, cls) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); if (cls) s.setAttribute('class', cls); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + id); s.append(u); return s; };
  const refreshWa = () => $$('[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); });
  refreshWa();
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Text splitting ---------- */
  $$('[data-split]').forEach(node => {
    let i = 0;
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (!t.trim()) { f.append(' '); return; }
          const w = el('span', { class: 'w' }); const s = el('span', { text: t }); s.style.setProperty('--i', i++); w.append(s); f.append(w);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1) walk(c);
    });
    walk(node);
  });

  const hl = $('[data-highlight]'), hlWords = [];
  if (hl) {
    const walk = (n, acc) => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (!t.trim()) { f.append(t); return; }
          const s = el('span', { class: 'hw' + (acc ? ' acc' : ''), text: t }); f.append(s); hlWords.push(s);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1) walk(c, acc || c.classList.contains('acc'));
    });
    walk(hl, false);
    if (reduce) hlWords.forEach(w => w.classList.add('lit'));
  }

  /* ---------- Reveal ---------- */
  const io = !reduce && 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' })
    : null;
  const observe = root => $$('.sw,.fade,.clip', root).forEach(e => { if (e.closest('.hero')) return; io ? io.observe(e) : e.classList.add('in'); });
  observe(document);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.documentElement.classList.add('loaded');
    $$('.hero .sw,.hero .fade').forEach(e => e.classList.add('in'));
  }));

  /* ---------- Menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); document.body.style.overflow = open ? 'hidden' : ''; };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Scroll loop ---------- */
  const header = $('#header'), progress = $('#progress'), wa = $('#wa');
  const steps = $('#steps'), stepEls = $$('.step', steps), stepsLine = $('.steps-line', steps);
  const navLinks = $$('.nav-links a'), sections = navLinks.map(a => $(a.getAttribute('href')));
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY, vh = innerHeight, h = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    header.classList.toggle('solid', y > 60);
    header.classList.toggle('hide', y > vh && y > lastY && !menu.classList.contains('open'));
    lastY = y;
    wa.classList.toggle('show', y > vh * .7);
    const r = steps.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (vh * .8 - r.top) / (r.height + vh * .3)));
    stepsLine.style.setProperty('--p', p);
    stepEls.forEach((s, i) => s.classList.toggle('lit', p > i / stepEls.length + .02));
    if (hl && !reduce) {
      const hr = hl.getBoundingClientRect();
      const hp = Math.min(1, Math.max(0, (vh * .82 - hr.top) / (hr.height + vh * .25)));
      const n = Math.ceil(hp * hlWords.length);
      hlWords.forEach((w, i) => w.classList.toggle('lit', i < n));
    }
    let cur = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * .45) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle('active', i === cur));
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Cursor + floating media ---------- */
  if (fine && !reduce) {
    const cursor = $('#cursor'), label = $('span', cursor), fm = $('#floatMedia'), fmImgs = $$('img', fm);
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, fx = mx, fy = my;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (mx - cx) * .25; cy += (my - cy) * .25; fx += (mx - fx) * .1; fy += (my - fy) * .1;
      cursor.style.translate = `${cx}px ${cy}px`; fm.style.left = fx + 'px'; fm.style.top = fy + 'px';
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('a,button,summary,label,input,select,textarea');
      const big = e.target.closest('[data-cursor]');
      cursor.classList.toggle('big', !!big);
      if (big) label.textContent = big.dataset.cursor;
      cursor.classList.toggle('link-hover', !!t && !big);
    });
    $$('.row').forEach(row => {
      row.addEventListener('pointerenter', () => { fmImgs.forEach((im, k) => im.classList.toggle('on', k === +row.dataset.img)); fm.classList.add('show'); });
      row.addEventListener('pointerleave', () => fm.classList.remove('show'));
    });
  }

  /* ---------- Ecosystem orbit ---------- */
  (() => {
    const stage = $('#ecoStage'), orbit = $('#orbit'), nodesWrap = $('#orbitNodes'), num = $('#orbitNum');
    const nodes = $$('.orbit-node', stage), tabs = $$('.eco-tab', stage), panels = $$('.eco-panel', stage), imgs = $$('.orbit-main img', orbit);
    const DUR = 6000, ACTIVE = -50, angles = nodes.map(n => parseFloat(n.style.getPropertyValue('--a')));
    let cur = 0, rot = 0, timer = null, start = 0, left = DUR, paused = false, inView = false;
    stage.style.setProperty('--dur', DUR + 'ms');
    const restart = () => { [orbit, stage].forEach(x => x.classList.remove('run')); void orbit.offsetWidth; if (!reduce) [orbit, stage].forEach(x => x.classList.add('run')); };
    const schedule = ms => { clearTimeout(timer); left = ms; start = Date.now(); if (!paused && inView && !reduce) timer = setTimeout(() => show((cur + 1) % nodes.length), ms); };
    const show = i => {
      rot += (((ACTIVE - angles[i]) - rot) % 360 + 540) % 360 - 180; cur = i;
      nodesWrap.style.setProperty('--rot', rot + 'deg');
      nodes.forEach((n, k) => n.classList.toggle('on', k === i));
      imgs.forEach((m, k) => m.classList.toggle('on', k === i));
      panels.forEach((p, k) => { p.classList.toggle('on', k === i); p.setAttribute('aria-hidden', String(k !== i)); p.inert = k !== i; });
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      num.textContent = String(i + 1).padStart(2, '0');
      restart(); schedule(DUR);
    };
    const pause = () => { if (paused) return; paused = true; clearTimeout(timer); left -= Date.now() - start; orbit.classList.add('paused'); stage.classList.add('paused'); };
    const resume = () => { if (!paused) return; paused = false; orbit.classList.remove('paused'); stage.classList.remove('paused'); schedule(Math.max(400, left)); };
    [...nodes, ...tabs].forEach(b => b.addEventListener('click', () => show(+b.dataset.i)));
    tabs.forEach((t, k) => t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); const n = (k + d + tabs.length) % tabs.length; show(n); tabs[n].focus(); }
    }));
    panels.forEach((p, k) => { p.inert = k !== 0; });
    stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') pause(); });
    stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') resume(); });
    stage.addEventListener('focusin', pause);
    stage.addEventListener('focusout', e => { if (!stage.contains(e.relatedTarget)) resume(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView && !paused) { restart(); schedule(DUR); } else clearTimeout(timer); }, { threshold: .3 }).observe(stage);
  })();

  /* ---------- Tools: tabs ---------- */
  const toolTabs = $$('.tool-tab');
  const showTool = id => {
    toolTabs.forEach(t => { const on = t.dataset.tool === id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    $$('.tool').forEach(p => { p.hidden = p.id !== id; });
  };
  toolTabs.forEach((t, k) => {
    t.addEventListener('click', () => showTool(t.dataset.tool));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); const n = toolTabs[(k + d + toolTabs.length) % toolTabs.length]; showTool(n.dataset.tool); n.focus(); }
    });
  });

  const money = (n, cur = 'US$') => `${cur} ${Math.round(n).toLocaleString('en-US')}`;
  const fill = r => r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%');

  // Rental yield
  const calcYield = () => {
    const price = +$('#price').value, rent = +$('#rent').value, cost = +$('#cost').value;
    const annual = rent * 12, net = annual * (1 - cost / 100);
    $('#priceOut').textContent = money(price); $('#rentOut').textContent = money(rent); $('#costOut').textContent = cost + '%';
    $('#gross').textContent = (annual / price * 100).toFixed(1) + '%';
    $('#net').textContent = (net / price * 100).toFixed(1) + '%';
    $('#payback').textContent = net > 0 ? (price / net).toFixed(1) : '—';
    ['#price', '#rent', '#cost'].forEach(s => fill($(s)));
    $('#calcWa').href = waLink(`Hola Dany, usé tu simulador: propiedad de ${money(price)} con alquiler de ${money(rent)}/mes. Me gustaría analizar una inversión real en Lima.`);
  };
  ['#price', '#rent', '#cost'].forEach(s => $(s).addEventListener('input', calcYield));
  calcYield();

  // Mortgage
  const calcMortgage = () => {
    const cur = $('#mCur').value, price = +$('#mPrice').value, downPct = +$('#mDown').value, tea = +$('#mRate').value, years = +$('#mYears').value;
    const loan = price * (1 - downPct / 100), n = years * 12, tem = Math.pow(1 + tea / 100, 1 / 12) - 1;
    const pay = tem > 0 ? loan * tem / (1 - Math.pow(1 + tem, -n)) : loan / n;
    $('#mPriceOut').textContent = money(price, cur); $('#mDownOut').textContent = `${downPct}% · ${money(price * downPct / 100, cur)}`;
    $('#mRateOut').textContent = tea.toFixed(1) + '%'; $('#mYearsOut').textContent = years + ' años';
    $('#mPay').textContent = money(pay, cur); $('#mLoan').textContent = money(loan, cur); $('#mInt').textContent = money(pay * n - loan, cur);
    ['#mPrice', '#mDown', '#mRate', '#mYears'].forEach(s => fill($(s)));
    $('#mortWa').href = waLink(`Hola Dany, simulé un crédito hipotecario: inmueble de ${money(price, cur)}, inicial ${downPct}%, ${years} años. ¿Me ayudas a evaluarlo?`);
  };
  ['#mCur', '#mPrice', '#mDown', '#mRate', '#mYears'].forEach(s => $(s).addEventListener('input', calcMortgage));
  calcMortgage();

  /* ---------- Lead delivery (CRM DAWO) ---------- */
  async function sendLead(data) {
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 10000);
      const r = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, page: location.pathname + location.hash }), signal: ctrl.signal });
      clearTimeout(t);
      return r.ok;
    } catch { return false; }
  }
  function leadStatus(box, ok, name, waText) {
    box.hidden = false; box.className = 'form-status ' + (ok ? 'ok' : 'warn');
    box.replaceChildren(
      el('p', { text: ok ? `Gracias${name ? ', ' + name : ''}. Recibí tu solicitud y te responderé personalmente.` : 'No pudimos registrar tu solicitud automáticamente. Envíala por WhatsApp y te respondo de inmediato.' }),
      el('a', { class: 'link', href: waLink(waText), target: '_blank', rel: 'noopener' }, ok ? 'Continuar por WhatsApp ' : 'Enviar por WhatsApp ', svgUse('i-arrow'))
    );
  }
  const val = (f, n) => (f.elements[n] && f.elements[n].value || '').trim();
  const requireFields = (f, names) => {
    let first = null;
    names.forEach(n => { const i = f.elements[n]; const bad = !i.value.trim() || (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)); i.setAttribute('aria-invalid', String(bad)); if (bad && !first) first = i; });
    if (first) first.focus();
    return !first;
  };
  const busy = (btn, on) => { btn.disabled = on; btn.classList.toggle('busy', on); };

  // Contact form
  $('#leadForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget, btn = $('button[type=submit]', f), box = $('.form-status', f);
    if (!requireFields(f, ['name', 'phone'])) return;
    const intent = f.elements.intent.value;
    const labels = { vender: 'vender mi propiedad', comprar: 'comprar una propiedad', alquilar: 'alquilar mi propiedad', invertir: 'invertir en Lima' };
    const details = [`Interés: ${labels[intent]}`, val(f, 'zone') && `Zona: ${val(f, 'zone')}`, val(f, 'budget') && `Presupuesto / valor: ${val(f, 'budget')}`, val(f, 'country') && `Reside en: ${val(f, 'country')}`, val(f, 'email') && `Email: ${val(f, 'email')}`].filter(Boolean);
    busy(btn, true);
    const ok = await sendLead({ kind: 'contacto', interest: intent, name: val(f, 'name'), phone: val(f, 'phone'), email: val(f, 'email'), details, message: val(f, 'msg'), website: val(f, 'website') });
    busy(btn, false);
    leadStatus(box, ok, val(f, 'name'), [`Hola Dany, soy ${val(f, 'name')}. Me interesa ${labels[intent]}.`, ...details.slice(1), val(f, 'msg')].filter(Boolean).join('\n'));
    if (ok) f.reset();
  });

  /* ---------- Newsletter ---------- */
  $('#newsForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget, btn = $('button', f), box = $('.form-status', f);
    if (!requireFields(f, ['email'])) return;
    busy(btn, true);
    const ok = await sendLead({ kind: 'newsletter', interest: 'newsletter', name: val(f, 'name'), email: val(f, 'email'), details: ['Suscripción a la newsletter de oportunidades y mercado'], website: val(f, 'website') });
    busy(btn, false);
    box.hidden = false; box.className = 'form-status ' + (ok ? 'ok' : 'warn');
    box.textContent = ok ? 'Listo. Te escribiré solo cuando tenga algo que valga tu tiempo.' : 'No pudimos registrar tu correo. Inténtalo de nuevo en unos minutos.';
    if (ok) f.reset();
  });

  /* ---------- Content-driven modules ---------- */
  const fmtDate = d => new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

  // News
  (async () => {
    const list = $('#newsList');
    try {
      const r = await fetch('/api/news'); if (!r.ok) throw 0;
      const { items } = await r.json();
      if (!items || !items.length) throw 0;
      list.replaceChildren(...items.map((n, i) => el('a', { class: 'news-item fade', href: n.link, target: '_blank', rel: 'noopener', style: `--d:${i * .05}s` },
        el('span', { class: 'news-meta' }, el('span', { text: n.source || 'Fuente' }), el('time', { datetime: n.date, text: fmtDate(n.date) })),
        el('h3', { text: n.title }),
        el('span', { class: 'news-go' }, 'Leer en la fuente ', svgUse('i-arrow')))));
      observe(list);
    } catch {
      list.replaceChildren(el('p', { class: 'empty' }, 'Las noticias no están disponibles en este momento. ', el('a', { class: 'link', href: 'https://news.google.com/search?q=mercado%20inmobiliario%20Lima&hl=es-419&gl=PE&ceid=PE:es-419', target: '_blank', rel: 'noopener' }, 'Ver noticias del mercado ', svgUse('i-arrow'))));
    }
  })();

  // Site content
  fetch('/content/site.json').then(r => r.ok ? r.json() : null).catch(() => null).then(cfg => {
    if (!cfg) return;
    if (cfg.contacto && cfg.contacto.whatsapp) { WA = cfg.contacto.whatsapp; refreshWa(); calcYield(); calcMortgage(); }
    loadProperties(cfg.dawo || {});
    renderGallery(cfg.galeria || []);
    renderVideos((cfg.videos && cfg.videos.lista) || []);
    setupAgenda(cfg.agenda || {});
  });

  // Properties from DAWO catalog (only published, non-demo listings)
  async function loadProperties(d) {
    const grid = $('#propGrid'); if (!d.supabaseUrl || !d.supabaseKey) return;
    const q = new URLSearchParams({
      select: 'title,slug,property_type,operation,district,price,currency,show_price,bedrooms,bathrooms,area_built,area_total,commercial_status,property_images(public_url,alt_text,is_cover,position)',
      is_demo: 'eq.false', publication_status: 'eq.published',
      or: '(short_description.is.null,short_description.not.ilike.*demostrativ*)',
      order: 'is_featured.desc,display_order.asc', limit: String(d.maxPropiedades || 6),
    });
    try {
      const r = await fetch(`${d.supabaseUrl}/rest/v1/properties?${q}`, { headers: { apikey: d.supabaseKey, Authorization: `Bearer ${d.supabaseKey}` } });
      if (!r.ok) throw 0;
      const rows = (await r.json()).filter(p => p.commercial_status !== 'sold');
      if (!rows.length) return;
      const op = { sale: 'Venta', rent: 'Alquiler' };
      grid.replaceChildren(...rows.map((p, i) => {
        const imgs = (p.property_images || []).sort((a, b) => (b.is_cover - a.is_cover) || (a.position - b.position));
        const area = p.area_built || p.area_total;
        const specs = [p.bedrooms && `${p.bedrooms} dorm.`, p.bathrooms && `${p.bathrooms} baños`, area && `${Math.round(area).toLocaleString('es-PE')} m²`].filter(Boolean).join(' · ');
        return el('a', { class: 'prop fade', href: d.catalogo || 'https://dawoinmobiliaria.com/', target: '_blank', rel: 'noopener', style: `--d:${i * .06}s`, 'data-cursor': 'Ver' },
          el('div', { class: 'prop-img' }, imgs[0] ? el('img', { src: imgs[0].public_url, alt: imgs[0].alt_text || p.title, loading: 'lazy', decoding: 'async' }) : null,
            el('span', { class: 'prop-tag', text: [op[p.operation] || p.operation, p.property_type].filter(Boolean).join(' · ') })),
          el('div', { class: 'prop-body' },
            el('small', { text: p.district || 'Lima' }), el('h3', { text: p.title }),
            el('p', { class: 'prop-specs', text: specs }),
            el('strong', { class: 'prop-price', text: p.show_price && p.price ? `${p.currency === 'PEN' ? 'S/' : 'US$'} ${Math.round(p.price).toLocaleString('en-US')}` : 'Precio a consultar' })));
      }));
      grid.classList.add('has-items');
      observe(grid);
    } catch { /* keep empty state */ }
  }

  // Gallery + lightbox
  function renderGallery(items) {
    const grid = $('#gallery'); if (!items.length) return;
    const dlg = $('#lightbox'), img = $('img', dlg), cap = $('figcaption', dlg);
    let idx = 0;
    const open = i => { idx = (i + items.length) % items.length; img.src = items[idx].src; img.alt = items[idx].alt; cap.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')} — ${items[idx].alt}`; if (!dlg.open) dlg.showModal(); };
    grid.replaceChildren(...items.map((g, i) => el('button', { class: 'g-item fade', type: 'button', style: `--d:${(i % 4) * .05}s`, 'aria-label': `Ampliar: ${g.alt}`, 'data-cursor': 'Ampliar', onclick: () => open(i) },
      el('img', { src: g.src, alt: g.alt, width: g.w, height: g.h, loading: 'lazy', decoding: 'async' }))));
    observe(grid);
    $('.lb-prev', dlg).addEventListener('click', () => open(idx - 1));
    $('.lb-next', dlg).addEventListener('click', () => open(idx + 1));
    $('.lb-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight') open(idx + 1); if (e.key === 'ArrowLeft') open(idx - 1); });
    let x0 = null;
    dlg.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) open(idx + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  // Video library (click-to-load embeds)
  function parseVideo(url) {
    let m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/))) return { p: 'YouTube', embed: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0`, thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`, vertical: /shorts\//.test(url) };
    if ((m = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/))) return { p: 'TikTok', embed: `https://www.tiktok.com/embed/v2/${m[1]}`, vertical: true };
    if ((m = url.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/))) return { p: 'Instagram', embed: `https://www.instagram.com/p/${m[1]}/embed`, vertical: true };
    return null;
  }
  function renderVideos(list) {
    const grid = $('#videoGrid');
    const vids = list.map(v => ({ ...v, info: parseVideo(v.url || '') })).filter(v => v.info);
    if (!vids.length) return;
    grid.replaceChildren(...vids.map((v, i) => {
      const card = el('div', { class: 'vid fade' + (v.info.vertical ? ' vertical' : ''), style: `--d:${i * .06}s` });
      const btn = el('button', { class: 'vid-poster', type: 'button', 'aria-label': `Reproducir: ${v.titulo || 'video'}`, 'data-cursor': 'Play' },
        (v.miniatura || v.info.thumb) ? el('img', { src: v.miniatura || v.info.thumb, alt: '', loading: 'lazy' }) : null,
        el('span', { class: 'reel-top' }, el('span', { text: v.info.p })),
        el('span', { class: 'reel-play' }, svgUse('i-play')),
        el('span', { class: 'reel-body' }, el('h3', { text: v.titulo || 'Video' }), v.fecha ? el('p', { text: v.fecha }) : null));
      btn.addEventListener('click', () => {
        card.classList.add('playing');
        btn.replaceWith(el('iframe', { src: v.info.embed, title: v.titulo || 'Video', allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, loading: 'lazy' }));
      });
      card.append(btn);
      return card;
    }));
    grid.classList.add('has-videos');
    observe(grid);
  }

  // Meeting scheduler
  function setupAgenda(cfg) {
    const form = $('#meetForm'); if (!form) return;
    if (cfg.calendarioExterno) {
      const ext = $('#meetExternal'); ext.hidden = false; ext.href = cfg.calendarioExterno;
    }
    const daysBox = $('#meetDays'), slotsBox = $('#meetSlots');
    const enabled = cfg.diasHabilitados || [1, 2, 3, 4, 5, 6], count = cfg.diasAMostrar || 10, slots = cfg.horarios || ['09:30', '11:00', '15:00', '17:00'];
    const days = []; const d = new Date(); d.setHours(0, 0, 0, 0);
    while (days.length < count) { d.setDate(d.getDate() + 1); if (enabled.includes(d.getDay())) days.push(new Date(d)); }
    const chip = (name, value, labelTop, labelMain, i) => el('label', { class: 'slot' },
      el('input', { type: 'radio', name, value, required: i === 0 }),
      el('span', {}, labelTop ? el('small', { text: labelTop }) : null, labelMain));
    daysBox.replaceChildren(...days.map((x, i) => chip('day', x.toISOString().slice(0, 10), x.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''), x.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', ''), i)));
    slotsBox.replaceChildren(...slots.map((s, i) => chip('time', s, null, s, i)));
  }
  $('#meetForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget, btn = $('button[type=submit]', f), box = $('.form-status', f);
    const day = f.elements.day && [...f.querySelectorAll('input[name=day]')].find(i => i.checked);
    const time = [...f.querySelectorAll('input[name=time]')].find(i => i.checked);
    const err = $('.meet-err', f);
    err.hidden = !!(day && time);
    if (!day || !time) { err.textContent = 'Elige un día y un horario.'; return; }
    if (!requireFields(f, ['name', 'phone'])) return;
    const when = new Date(day.value + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
    const mode = f.elements.mode.value;
    const details = [`Reunión solicitada: ${when}, ${time.value} (hora de Lima)`, `Modalidad: ${mode}`, `Tema: ${val(f, 'topic')}`];
    busy(btn, true);
    const ok = await sendLead({ kind: 'reunion', interest: 'reunion', name: val(f, 'name'), phone: val(f, 'phone'), details, message: val(f, 'notes'), website: val(f, 'website') });
    busy(btn, false);
    leadStatus(box, ok, val(f, 'name'), [`Hola Dany, soy ${val(f, 'name')}. Quisiera agendar una reunión.`, ...details, val(f, 'notes')].filter(Boolean).join('\n'));
    if (ok) { box.querySelector('p').textContent = `Solicitud enviada, ${val(f, 'name')}. Te confirmaré la reunión del ${when} a las ${time.value} por WhatsApp.`; f.reset(); }
  });
})();
