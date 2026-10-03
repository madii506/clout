// GET /api/ping  is everything clout needs answering? (the house address, the records, the chain, the studio)
// ?studio=1 also makes one tiny test photo (rate-limited), to see which model answers.
const L = require('./_lib');
// ?face=0..3  the brand's example faces (fictional, adult, made with FLUX once and kept), for the banner and the roster's
// empty state. Fixed prompts only, so nothing arbitrary can be generated here.
const FACES = [
  'Portrait photo of a fictional 24-year-old woman with a messy copper bob and freckles, oversized cream hoodie, holding an iced coffee, laughing on a sunny city street, golden hour, shot on iPhone, candid influencer photo, sharp face, no text',
  'Portrait photo of a fictional 27-year-old man with curly black hair and a thin gold chain, black tee, sitting in a neon-lit gaming room with headphones around his neck, confident half smile, candid influencer photo, sharp face, no text',
  'Portrait photo of a fictional 26-year-old woman with long dark braids and a bright pink tracksuit, stretching in a sunlit minimalist gym, playful grin, candid fitness influencer photo, sharp face, no text',
  'Portrait photo of a fictional 30-year-old man with bleached buzzcut and round sunglasses pushed up, vintage denim jacket, posing on a rooftop at sunset with the skyline behind, candid fashion influencer photo, sharp face, no text',
];
module.exports = async (req, res) => {
  L.setOidc(req);
  const fq = L.query(req).face;
  if (fq != null && /^[0-3]$/.test(String(fq)) && L.dbReady()) {
    try {
      await L.ready(); const n = Number(fq);
      let r = (await L.q('SELECT img FROM c0_brand WHERE n=$1', [n]))[0];
      if (!r && !L.limited('face', 8, 3600000)) {
        const p = await L.photo(FACES[n], null, 50000);
        if (p.ok) { const img = await require('sharp')(p.buf).resize(768, 960, { fit: 'cover', position: 'attention' }).jpeg({ quality: 88 }).toBuffer(); await L.q('INSERT INTO c0_brand (n, img) VALUES ($1,$2) ON CONFLICT (n) DO UPDATE SET img=EXCLUDED.img, at=now()', [n, img]); r = { img }; }
        else return L.send(res, 200, { ok: false, error: p.error });
      }
      if (!r) return L.send(res, 200, { ok: false, error: 'not made yet' });
      res.statusCode = 200; res.setHeader('Content-Type', 'image/jpeg'); res.setHeader('Cache-Control', 'public, max-age=3600'); return res.end(Buffer.from(r.img));
    } catch (e) { return L.send(res, 200, { ok: false, error: String(e && e.message).slice(0, 200) }); }
  }
  const out = { ok: true, open: !!L.STUDIO, studio: L.STUDIO || null, records: L.dbReady(), captions: L.MODEL, photos: L.IMG_MODELS, gateway: !!L.gatewayToken() };
  try { await L.rpc('getSlot', []); out.chain = true; } catch { out.chain = false; }
  if (out.records) { try { await L.ready(); out.records = true; const s = (await L.q('SELECT shots, shots_day FROM c0_state WHERE id=1'))[0]; out.shotsToday = s && s.shots_day && new Date(s.shots_day).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10) ? s.shots : 0; out.dailyShots = L.DAILY_SHOTS; } catch { out.records = false; } }
  if (L.query(req).studio === '1' && !L.limited('pingstudio', 4, 3600000)) {
    const t = await L.ai([{ role: 'user', content: 'Say only: ok' }], 16); out.caption = t.ok ? 'ok' : t.error;
    const ref = L.query(req).ref === '1' ? (await require('sharp')({ create: { width: 256, height: 256, channels: 3, background: '#e9b' } }).jpeg().toBuffer()).toString('base64') : null;
    const p = await L.photo('a small red ceramic mug on a wooden table, soft morning light', ref, 45000); out.photo = p.ok ? { model: p.model, ref: p.ref, bytes: p.buf.length } : p.error;
  }
  L.send(res, 200, out);
};
