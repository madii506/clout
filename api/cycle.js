// GET /api/cycle  one cycle of clout, run by a schedule (safe for anyone to call: it locks, and runs at most once per 25
// minutes). It finishes launches the page didn't see through, voids ones that never landed, reads every influencer from
// the chain (market cap, last trade, what waits in its vault), and gives the awake ones that are due their next post:
// two a day while their token trades.
const L = require('./_lib');
const I = require('./_infl');
const PER_CYCLE = 3;
module.exports = async (req, res) => {
  L.setOidc(req);
  if (!L.dbReady()) return L.send(res, 200, { ok: false, error: 'records offline' });
  try {
    await L.ready();
    const got = await L.q(`UPDATE c0_state SET lock_at=now() WHERE id=1 AND (lock_at IS NULL OR lock_at < now() - interval '3 minutes') AND next_at <= now() RETURNING cycle`);
    if (!got.length) return L.send(res, 200, { ok: true, skipped: true });
    const cycle = got[0].cycle + 1, out = { ok: true, cycle, settled: 0, voided: 0, posts: 0 };
    try {
      for (const p of await L.q(`SELECT mint FROM c0_infl WHERE status='pending' AND created_at > now() - interval '3 hours'`)) { const r = await I.settle(p.mint).catch(() => null); if (r && r.live) out.settled++; }
      const v = await L.q(`UPDATE c0_infl SET status='void', img=NULL WHERE status='pending' AND created_at <= now() - interval '3 hours' RETURNING mint`); out.voided = v.length;
      const r = await I.readBoard(); out.influencers = r.influencers; out.changes = r.changes;
      const due = await L.q(`SELECT mint, name, symbol, niche, voice, look, img FROM c0_infl WHERE status='live' AND state IN ('awake','ascended')
        AND (posted_at IS NULL OR posted_at < now() - interval '11 hours') ORDER BY posted_at NULLS FIRST LIMIT ${PER_CYCLE}`);
      await L.pool(due, 3, async k => { const p = await I.post(k); if (p.ok) out.posts++; else out.why = p.why || p.error; });
    } finally {
      await L.q(`UPDATE c0_state SET cycle=$1, lock_at=NULL, next_at=now() + interval '25 minutes' WHERE id=1`, [cycle]);
    }
    L.send(res, 200, out);
  } catch (e) { L.send(res, 200, { ok: false, error: String(e && e.message || e).slice(0, 200) }); }
};
