// clout: one influencer's page. Its face, name, voice, its posts (open one to share it to X or download it), its numbers
// (read by the cycle from the chain), the split locked into it and its live trades (PumpPortal). A token that landed on
// pump.fun without its split can be finished here by whoever launched it.
(function () {
  'use strict';
  const C = window.Core, X = window.Cross, L = window.Live, $ = C.$, esc = C.esc;
  const mint = (location.pathname.match(/\/c\/([1-9A-HJ-NP-Za-km-z]{32,44})/) || [])[1] || new URLSearchParams(location.search).get('mint');
  const STATE = { awake: 'posting', rot: 'losing followers', dead: 'offline', ascended: 'viral' };
  const when = t => t ? C.ago(new Date(t).getTime()) : '—';
  let data = null, solUsd = null;
  function lost(text) { $('#cw').innerHTML = `<div class="lost"><div><p>${esc(text)}</p><a class="btn" href="/">back to clout</a></div></div>`; }
  async function load() {
    if (!mint) return lost('No influencer lives at that address.');
    let j; try { j = await C.get('/api/kid?mint=' + mint); } catch { j = { ok: false, error: 'clout didn’t answer. Try again.' }; }
    if (!j.ok) return lost(j.missing ? 'No influencer lives at that address.' : j.error);
    data = j; render();
  }
  function render() {
    const k = data.infl, pending = k.status === 'pending';
    document.title = k.name + ' · clout';
    $('#cName').innerHTML = `${esc(k.name)}<small>$${esc(k.symbol)} · ${esc(k.niche)}</small>`;
    $('#cState').innerHTML = (pending ? ['not launched yet'] : [STATE[k.state] || k.state, k.posts + ' post' + (k.posts === 1 ? '' : 's'), 'live ' + when(k.born_at)]).join(' · ');
    $('#bio').textContent = k.voice;
    const img = $('#kidImg'); if (!img.getAttribute('src')) img.src = '/i/' + mint;
    const acts = [];
    if (!pending) acts.push(`<a class="btn" href="https://pump.fun/coin/${mint}" target="_blank" rel="noopener">buy on pump.fun ↗</a>`, `<button class="btn line" type="button" id="feedBtn">pay out its fees</button>`);
    else acts.push(`<button class="btn" type="button" id="finishBtn">finish it: lock its split</button>`);
    if (k.xhandle) acts.push(`<a class="btn line" href="https://x.com/${esc(k.xhandle)}" target="_blank" rel="noopener">@${esc(k.xhandle)} ↗</a>`);
    acts.push(`<a class="btn line" href="${C.solscan('token', mint)}" target="_blank" rel="noopener">solscan ↗</a>`);
    $('#cActs').innerHTML = acts.join('');
    if ($('#feedBtn')) $('#feedBtn').onclick = feed;
    if ($('#finishBtn')) $('#finishBtn').onclick = finish;
    const ps = data.posts || [];
    $('#posts').innerHTML = ps.length ? ps.map(p => `<button type="button" class="post" data-id="${p.id}"><img src="/p/${p.id}" alt="" loading="lazy"><span class="cap">${esc(p.caption)}</span></button>`).join('')
      : `<p class="empty">${pending ? 'It posts once it’s launched.' : 'Its first photo is on the way.'}</p>`;
    $('#log').innerHTML = (data.log || []).length ? data.log.map(e => `<p class="ev"><time>${when(e.at)}</time>${esc(e.text)}</p>`).join('') : '<p class="ev">Nothing yet.</p>';
    const cap = k.mcap_sol != null ? (solUsd ? C.usd(k.mcap_sol * solUsd) + ' · ' : '') + (+k.mcap_sol).toFixed(1) + ' SOL' : '—';
    $('#nums').innerHTML = [['market cap', pending ? '—' : cap], ['waiting in its vault', pending ? '—' : C.sol(k.vault_lamports || 0)], ['last trade', pending ? '—' : when(k.last_trade_at)], ['last post', when(k.posted_at)], ['token', `<a href="${C.solscan('token', mint)}" target="_blank" rel="noopener">${C.short(mint, 6)}</a>`]]
      .map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
    const shares = typeof k.shares === 'string' ? JSON.parse(k.shares) : (k.shares || []);
    $('#split').innerHTML = shares.map(s => `<div><dt>${s.address === data.studio ? 'the house' : s.address === k.payer ? 'its creator' : 'a share'}</dt><dd>${s.bps / 100}% · <a href="${C.solscan('account', s.address)}" target="_blank" rel="noopener">${C.short(s.address)}</a></dd></div>`).join('');
  }
  // a post, opened: share it to X, download it
  const lb = $('#lb');
  document.addEventListener('click', e => {
    const p = e.target.closest('.post[data-id]');
    if (p && data) {
      const post = data.posts.find(x => String(x.id) === p.dataset.id); if (!post) return;
      const url = location.origin + '/c/' + mint, k = data.infl;
      $('#lbImg').src = '/p/' + post.id; $('#lbCap').textContent = post.caption;
      const text = `${post.caption}\n\n${k.name} ($${k.symbol}), an AI influencer on clout`;
      $('#lbActs').innerHTML = `<a class="btn" href="https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener">share on X ↗</a><a class="btn line" href="/p/${post.id}" download="${esc(k.symbol)}-${post.id}.jpg">download</a>`;
      lb.hidden = false; document.body.style.overflow = 'hidden'; return;
    }
    if (e.target === lb || e.target.closest('#lbX')) { lb.hidden = true; document.body.style.overflow = ''; }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) { lb.hidden = true; document.body.style.overflow = ''; } });
  async function feed() {
    const b = $('#feedBtn'); b.disabled = true; $('#cStatus').textContent = '';
    try { const r = await X.feed(mint); if (r) { C.toast('Paid out to every share.'); $('#cStatus').innerHTML = `<a href="${C.solscan('tx', r.sig)}" target="_blank" rel="noopener">the payout on solscan ↗</a>`; } }
    catch (e) { $('#cStatus').textContent = C.human(e); }
    finally { b.disabled = false; }
  }
  async function finish() {
    const b = $('#finishBtn'); $('#cStatus').textContent = '';
    if (!C.S.me) { const ok = await C.connect(); if (!ok) return; }
    if (C.S.me !== data.infl.payer) { $('#cStatus').textContent = 'Only the wallet that launched it can finish it.'; return; }
    b.disabled = true;
    try { const s = await C.post('/api/settle', { mint }); if (!(s && s.live)) await X.route(mint); C.toast('It’s live.'); await load(); }
    catch (e) { $('#cStatus').textContent = C.human(e); }
    finally { if ($('#finishBtn')) $('#finishBtn').disabled = false; }
  }
  if (L && mint) {
    L.births(false); L.watch([mint]);
    L.on('status', up => { const d = $('#lvDot'); if (d) d.classList.toggle('on', up); });
    L.on('trade', t => {
      if (t.mint !== mint) return;
      const first = $('#trN'); if (first) first.remove();
      const el = $('#trades'); el.insertAdjacentHTML('afterbegin', `<p class="ev ${t.side}"><time>now</time>${t.side} ${t.sol >= 1 ? t.sol.toFixed(2) : t.sol.toFixed(3)} SOL<small>${C.short(t.who || '')}</small></p>`);
      while (el.children.length > 10) el.lastChild.remove();
    });
    L.start();
  }
  C.get('/api/board').then(j => { if (j && j.solUsd) { solUsd = j.solUsd; if (data) render(); } }).catch(() => {});
  setInterval(() => { if (!document.hidden && data) load(); }, 30000);
  load();
})();
