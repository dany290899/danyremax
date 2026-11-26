// Reenvía los contactos del sitio al CRM de DAWO Inmobiliaria (servidor a servidor).
// Formato compatible con el formulario de dawoinmobiliaria.com.
const CRM_URL = process.env.DAWO_CRM_URL || 'https://crm.dawoinmobiliaria.com/public/web-lead';
const ALLOWED_ORIGINS = ['https://www.danyjimenezdiaz.com', 'https://danyjimenezdiaz.com'];
const INTERESTS = {
  vender: 'Quiero vender mi propiedad',
  comprar: 'Quiero comprar una propiedad',
  alquilar: 'Solicitar asesoría',
  invertir: 'Solicitar asesoría',
  reunion: 'Solicitar asesoría',
  newsletter: 'Solicitar asesoría',
  visita: 'Solicitar una visita',
};
const KINDS = { contacto: 'Contacto', reunion: 'Reunión', newsletter: 'Newsletter' };

const clean = (v, max = 300) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 20000) throw new Error('too large'); }
  return JSON.parse(raw || '{}');
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('Allow', 'POST'); return res.end(); }

  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.statusCode = 403; return res.end(JSON.stringify({ ok: false }));
  }

  let b;
  try { b = await readBody(req); } catch { res.statusCode = 400; return res.end(JSON.stringify({ ok: false })); }

  // Honeypot: los bots rellenan este campo oculto.
  if (clean(b.website)) { res.statusCode = 200; return res.end(JSON.stringify({ ok: true })); }

  const kind = KINDS[b.kind] ? b.kind : 'contacto';
  const name = clean(b.name, 120);
  const phone = clean(b.phone, 40);
  const email = clean(b.email, 160);
  if ((!name || !phone) && !(kind === 'newsletter' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    res.statusCode = 422; return res.end(JSON.stringify({ ok: false, error: 'datos incompletos' }));
  }

  const details = Array.isArray(b.details) ? b.details.slice(0, 12).map(d => clean(d, 400)).filter(Boolean) : [];
  const message = [`[danyjimenezdiaz.com · ${KINDS[kind]}]`, ...details, clean(b.message, 1500)].filter(Boolean).join('\n');

  const payload = {
    form: 'contacto',
    name: name || email,
    phone: phone || '',
    email,
    interest: INTERESTS[clean(b.interest, 20)] || INTERESTS.invertir,
    message,
    website: '',
    page: 'danyjimenezdiaz.com' + clean(b.page, 120),
    source: 'danyjimenezdiaz.com',
  };

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(CRM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
    clearTimeout(t);
    res.statusCode = r.ok ? 200 : 502;
    return res.end(JSON.stringify({ ok: r.ok }));
  } catch {
    res.statusCode = 502;
    return res.end(JSON.stringify({ ok: false }));
  }
};
