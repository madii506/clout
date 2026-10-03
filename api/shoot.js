// POST /api/shoot {draft: {name, symbol, niche, voice}, image}  a test shoot before launch: one photo of the uploaded face in
//   a new scene, with a caption in its voice. Nothing is kept.
// POST /api/shoot {mint}  the first post of a freshly launched influencer (only while it has none).
// Photos come from FLUX through Vercel's AI Gateway, inside the house's daily budget.
const L = require('./_lib');
const I = require('./_infl');
module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return L.send(res, 204, {});
  if (req.method !== 'POST') return L.send(res, 405, { ok: false, error: 'POST only.' });
  L.setOidc(req);
  if (!L.dbReady()) return L.send(res, 200, { ok: false, error: 'clout’s records are offline.' });
  const b = await L.body(req, 4.2 * 1024 * 1024);
  if (b.tooBig) return L.send(res, 200, { ok: false, error: 'That picture is too big. Try a smaller one.' });
  try {
    await L.ready();
    if (b.draft) {
      if (L.limited('shoot:' + L.ip(req), 3, 3600000)) return L.send(res, 200, { ok: false, error: 'Three test shoots an hour. Launch it and it shoots on its own.' });
      const d = b.draft, voice = L.clean(d.voice, 700);
      if (voice.length < 12) return L.send(res, 200, { ok: false, error: 'Write a few words about its voice first.' });
      const m = String(b.image || '').match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
      if (!m) return L.send(res, 200, { ok: false, error: 'Add its face first.' });
      const face = await require('sharp')(Buffer.from(m[2], 'base64'), { animated: false, limitInputPixels: 40e6 }).resize(768, 768, { fit: 'cover', position: 'attention' }).flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).toBuffer();
      const k = { name: L.clean(d.name, 64) || 'unnamed', symbol: (L.clean(d.symbol, 20).replace(/^\$/, '').toUpperCase() || 'CLOUT'), niche: I.NICHES.includes(String(d.niche)) ? String(d.niche) : 'lifestyle', voice };
      return L.send(res, 200, await I.draft(k, face.toString('base64')));
    }
    const mint = String(b.mint || '');
    if (!L.isAddr(mint)) return L.send(res, 200, { ok: false, error: 'That isn’t a token address.' });
    if (L.limited('first:' + mint, 2, 600000)) return L.send(res, 200, { ok: false, error: 'It’s already in the studio.' });
    const k = (await L.q(`SELECT mint, name, symbol, niche, voice, look, img, status, posts FROM c0_infl WHERE mint=$1`, [mint]))[0];
    if (!k || k.status !== 'live') return L.send(res, 200, { ok: false, error: 'It isn’t launched yet.' });
    if (k.posts > 0) return L.send(res, 200, { ok: false, error: 'Its first post is already up.', posted: true });
    L.send(res, 200, await I.post(k));
  } catch (e) { L.send(res, 200, { ok: false, error: 'The shoot didn’t finish. Try again.' }); }
};
