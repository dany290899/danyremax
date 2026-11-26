// Noticias reales del mercado inmobiliario peruano (Google Noticias RSS), con enlace a la fuente original.
const QUERY = '"mercado inmobiliario" (Lima OR Perú) when:45d';
const FEED = 'https://news.google.com/rss/search?q=' + encodeURIComponent(QUERY) + '&hl=es-419&gl=PE&ceid=PE:es-419';

const decode = s => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/<[^>]+>/g, '').trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : ''; };

module.exports = async (req, res) => {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const r = await fetch(FEED, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; site-news/1.0)' } });
    clearTimeout(t);
    if (!r.ok) throw new Error('feed ' + r.status);
    const xml = await r.text();
    const seen = new Set();
    const items = (xml.match(/<item>[\s\S]*?<\/item>/g) || []).map(it => {
      const source = tag(it, 'source');
      let title = tag(it, 'title');
      if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
      return { title, source, link: tag(it, 'link'), date: new Date(tag(it, 'pubDate')).toISOString() };
    })
      .filter(n => n.title && /^https:\/\//.test(n.link) && !Number.isNaN(Date.parse(n.date)))
      .filter(n => { const k = n.title.toLowerCase().slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, 6);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    res.statusCode = 200;
    res.end(JSON.stringify({ updated: new Date().toISOString(), items }));
  } catch {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600');
    res.statusCode = 200;
    res.end(JSON.stringify({ updated: null, items: [] }));
  }
};
