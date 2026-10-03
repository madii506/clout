// clout: a token launched here is born as an AI influencer. Its creator uploads its face and writes its voice; it posts
// photos of itself (FLUX, with its own portrait as the reference so the face stays the same) with captions in its voice.
// This file: the birth (once the chain shows its split locked), the cycle's reading of every influencer from the chain,
// and the shoot (scene + caption + photo).
const L = require('./_lib');
const DAY = 864e5;
async function routingOf(mint) {
  if (L.MOCK && L.MOCK.routing) return L.MOCK.routing(mint);
  return require('./_pump').routing(mint, L.accounts);
}
const sameShares = (got, want) => got.length === want.length && want.every((w, i) => got[i].address === w.address && got[i].bps === w.bps);
async function settle(mint) {
  const k = (await L.q('SELECT mint, symbol, status, slot, shares FROM c0_infl WHERE mint=$1', [mint]))[0];
  if (!k) return { ok: false, error: 'No influencer was recorded for that token.' };
  if (k.status === 'live') return { ok: true, live: true, slot: k.slot };
  if (k.status === 'void') return { ok: true, live: false, void: true };
  const r = await routingOf(mint);
  if (!r.exists) return { ok: true, live: false, waiting: 'coin' };
  const shares = typeof k.shares === 'string' ? JSON.parse(k.shares) : k.shares;
  if (!(r.routed && r.revoked && sameShares(r.shareholders, shares))) return { ok: true, live: false, waiting: 'split', mint };
  for (let i = 0; i < 4; i++) {
    try {
      const u = await L.q(`UPDATE c0_infl SET status='live', slot=(SELECT coalesce(max(slot),-1)+1 FROM c0_infl WHERE status='live'), born_at=now(), state=$4,
        last_trade_at=now(), mcap_sol=$2, complete=$3 WHERE mint=$1 AND status<>'live' RETURNING slot`, [mint, r.mcapSol, !!r.complete, r.complete ? 'ascended' : 'awake']);
      if (u.length) await L.log('born', mint, `$${k.symbol} signed with clout`);
      const s = (await L.q('SELECT slot FROM c0_infl WHERE mint=$1', [mint]))[0];
      return { ok: true, live: true, slot: s && s.slot };
    } catch (e) { if (!/unique|duplicate/i.test(String(e && e.message))) throw e; }
  }
  return { ok: true, live: false, waiting: 'slot' };
}
async function lastTrade(mint) {
  if (L.MOCK && L.MOCK.lastTrade) return L.MOCK.lastTrade(mint);
  const r = await L.rpc('getSignaturesForAddress', [L.bondingCurveOf(mint), { limit: 1, commitment: 'confirmed' }]).catch(() => null);
  return r && r[0] && r[0].blockTime ? new Date(r[0].blockTime * 1000) : null;
}
const stateFor = (k, now) => k.complete ? 'ascended' : !k.last_trade_at ? 'awake' : now - new Date(k.last_trade_at) >= 7 * DAY ? 'dead' : now - new Date(k.last_trade_at) >= DAY ? 'rot' : 'awake';
async function readBoard() {
  const ks = await L.q(`SELECT mint, symbol, state, mcap_sol, complete, last_trade_at FROM c0_infl WHERE status='live' ORDER BY slot`);
  const vaults = ks.length ? await L.accounts(ks.map(k => L.vaultOf(k.mint))).catch(() => ks.map(() => null)) : [];
  const curves = ks.length ? await L.accounts(ks.map(k => L.bondingCurveOf(k.mint))).catch(() => ks.map(() => null)) : [];
  const now = Date.now(); let changes = 0;
  await L.pool(ks, 6, async (k, i) => {
    let mcap = k.mcap_sol, complete = k.complete;
    if (L.MOCK && L.MOCK.routing) { const r = await L.MOCK.routing(k.mint); mcap = r.mcapSol; complete = !!r.complete; }
    else if (curves[i]) { try { const { PUMP_SDK } = require('@pump-fun/pump-sdk'); const bc = PUMP_SDK.decodeBondingCurve(curves[i]); const vq = bc.virtualSolReserves || bc.virtualQuoteReserves, vt = bc.virtualTokenReserves; complete = !!bc.complete; if (vt && !vt.isZero()) mcap = Number(vq.mul(bc.tokenTotalSupply).div(vt).toString()) / 1e9; } catch {} }
    const vl = vaults[i] ? Math.max(0, vaults[i].lamports - L.RENT0) : 0;
    const t = complete ? null : await lastTrade(k.mint);
    const last = t && (!k.last_trade_at || t > new Date(k.last_trade_at)) ? t : k.last_trade_at;
    const st = stateFor({ ...k, complete, last_trade_at: last }, now);
    if (st !== k.state) { changes++; await L.log(st, k.mint, `$${k.symbol} ${st === 'rot' ? 'is losing followers' : st === 'dead' ? 'went offline' : st === 'ascended' ? 'went viral: its curve is complete' : 'is back online'}`); }
    await L.q(`UPDATE c0_infl SET mcap_sol=$2, complete=$3, last_trade_at=$4, state=$5, vault_lamports=$6 WHERE mint=$1`, [k.mint, mcap, complete, last, st, vl]);
  });
  return { influencers: ks.length, changes };
}

// ---------- the shoot ----------
const NICHES = ['lifestyle', 'comedy', 'fitness', 'fashion', 'crypto', 'gaming', 'music', 'food', 'travel', 'art'];
function persona(k) {
  return [`You run the social media of ${k.name} ($${k.symbol}), an AI ${k.niche} influencer whose token trades on pump.fun.`,
    `Their voice and personality, in their creator's words: """${L.clean(k.voice, 700)}"""`,
    k.look ? `What they look like: ${L.clean(k.look, 400)}` : ''].filter(Boolean).join('\n');
}
async function plan(k, prev = []) {
  const msgs = [{ role: 'system', content: persona(k) + `\nRules: no financial advice, no price talk, never tell anyone to buy or sell, no real people, nothing sexual, no links.` },
    { role: 'user', content: `Plan today's post. Reply with JSON only: {"scene": "one photo of ${k.name} for their feed: where they are, what they wear and do, the light and the framing, under 60 words", "caption": "the caption in their voice, under 180 characters, at most two hashtags"}.${prev.length ? ' Make it different from these earlier captions: ' + prev.map(p => '"' + p + '"').join(' ') : ''}` }];
  const r = await L.ai(msgs, 260);
  if (!r.ok) return { ok: false, error: r.error };
  const j = L.parseJson(r.text) || {};
  const scene = L.clean(j.scene, 500), caption = L.scrub(String(j.caption || ''), 220);
  if (!scene || !caption || L.BANNED.test(caption)) return { ok: false, error: 'plan' };
  return { ok: true, scene, caption };
}
const shotPrompt = (k, scene) => `A new photo of this exact same person: ${scene}. Keep their face, hair and features exactly the same as in the image. A real candid social media photo, natural light, sharp focus, no text, no watermark.`;
async function finish(buf) {
  return require('sharp')(buf, { limitInputPixels: 60e6 }).resize(900, 1125, { fit: 'cover', position: 'attention' }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}
// a post for a launched influencer: plan it, shoot it with its own portrait as the reference, keep it
async function post(k) {
  const prev = (await L.q(`SELECT caption FROM c0_posts WHERE mint=$1 ORDER BY id DESC LIMIT 4`, [k.mint]).catch(() => [])).map(r => r.caption);
  const p = await plan(k, prev); if (!p.ok) return { ok: false, error: 'Its caption didn’t come out. Try again.' };
  if (!(await L.spendShot())) return { ok: false, error: 'Today’s photo budget is spent. It resets at 00:00 UTC.' };
  const ref = k.img ? Buffer.from(k.img).toString('base64') : null;
  const ph = await L.photo(shotPrompt(k, p.scene), ref);
  if (!ph.ok) return { ok: false, error: 'The photo didn’t come out. Try again in a minute.', why: ph.error };
  const img = await finish(ph.buf);
  const r = await L.q(`INSERT INTO c0_posts (mint, caption, scene, img) VALUES ($1,$2,$3,$4) RETURNING id, at`, [k.mint, p.caption, p.scene, img]);
  await L.q(`UPDATE c0_infl SET posts = posts + 1, posted_at = now() WHERE mint=$1`, [k.mint]);
  return { ok: true, id: r[0].id, at: r[0].at, caption: p.caption, model: ph.model, ref: ph.ref };
}
// a test shoot before launch: nothing is kept
async function draft(k, refB64) {
  const p = await plan(k); if (!p.ok) return { ok: false, error: 'Its caption didn’t come out. Try again.' };
  if (!(await L.spendShot())) return { ok: false, error: 'Today’s photo budget is spent. It resets at 00:00 UTC.' };
  const ph = await L.photo(shotPrompt(k, p.scene), refB64);
  if (!ph.ok) return { ok: false, error: 'The photo didn’t come out. Try again in a minute.', why: ph.error };
  const img = await finish(ph.buf);
  return { ok: true, caption: p.caption, image: 'data:image/jpeg;base64,' + img.toString('base64'), model: ph.model, ref: ph.ref };
}
// what the portrait looks like, in words: used for the captions, and for a photo if the reference image can't be used
async function describe(jpeg) {
  const r = await L.ai([{ role: 'user', content: [{ type: 'text', text: 'Describe the main character in this image for a photographer who must recreate them: apparent age range, hair, face, skin tone, build, clothing style, overall vibe. One paragraph, under 70 words. If it is a cartoon, mascot or non-human, say so and describe it.' },
    { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + jpeg.toString('base64') } }] }], 160, 15000).catch(() => null);
  return r && r.ok ? L.clean(r.text, 500) : null;
}
module.exports = { settle, routingOf, readBoard, post, draft, describe, finish, NICHES };
