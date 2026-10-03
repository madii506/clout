// clout home: create an influencer (its face, name, ticker, niche, voice; a test shoot before it launches; launch it on
// pump.fun with its split locked, then its first photo), the roster, and the feed. Every number is read from clout's
// records, the chain or PumpPortal; nothing is invented, and an empty board says it is empty.
(function () {
  'use strict';
  const C = window.Core, X = window.Cross, L = window.Live, $ = C.$, $$ = C.$$, esc = C.esc;
  const st = { board: null, sort: 'new', shown: 24, open: null, busy: false, born: null, image: null, niche: 'lifestyle' };
  const nm = $('#nm'), tk = $('#tk'), voice = $('#voice'), xh = $('#xh'), goBtn = $('#goBtn'), goStatus = $('#goStatus'), goProg = $('#goProg'), goRes = $('#goRes');
  const bytes = s => new TextEncoder().encode(s).length;
  const clip32 = s => { s = String(s || '').replace(/\s+/g, ' ').trim(); while (bytes(s) > 32) s = s.slice(0, -1); return s.trim(); };
  const status = t => { goStatus.textContent = t || ''; };
  const usdOf = sol => (st.board && st.board.solUsd && sol != null ? C.usd(sol * st.board.solUsd) : sol != null ? (+sol).toFixed(1) + ' SOL' : null);
  const STATE = { awake: 'posting', rot: 'losing followers', dead: 'offline', ascended: 'viral' };
  const flash = () => { if (C.calm) return; const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 500); };

  // ---------- its face: resized here to 768×768 before it is sent ----------
  const drop = $('#drop'), picIn = $('#pic'), picImg = $('#picImg'), picNote = $('#picNote');
  function takeFile(f) {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(f.type)) { picNote.textContent = 'PNG, JPG, WebP or GIF.'; return; }
    if (f.size > 12e6) { picNote.textContent = 'That one is too big.'; return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 768; const x = c.getContext('2d'), s = Math.min(im.width, im.height);
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, 768, 768); x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 768, 768);
      st.image = c.toDataURL('image/jpeg', .9); picImg.src = st.image; drop.classList.add('on'); picNote.textContent = 'tap to change'; URL.revokeObjectURL(url); refreshGo();
    };
    im.onerror = () => { picNote.textContent = 'That picture didn’t open.'; URL.revokeObjectURL(url); };
    im.src = url;
  }
  picIn.addEventListener('change', () => takeFile(picIn.files[0]));
  ['dragenter', 'dragover'].forEach(k => drop.addEventListener(k, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(k => drop.addEventListener(k, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => takeFile(e.dataTransfer.files[0]));
  $('#niches').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; st.niche = b.dataset.n; $$('#niches .chip').forEach(c => c.classList.toggle('on', c === b)); });
  const voiceCount = () => { const n = voice.value.trim().length; $('#voiceN').textContent = n ? n + '/700' : ''; };
  voice.addEventListener('input', () => { voiceCount(); refreshGo(); });
  [nm, tk].forEach(i => i.addEventListener('input', refreshGo));
  tk.addEventListener('input', () => { const v = tk.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v !== tk.value) tk.value = v; });
  const handle = () => xh.value.trim().replace(/^@/, '');

  // ---------- a test shoot before it launches ----------
  const shootBtn = $('#shootBtn'), shootEl = $('#shoot'), shootStatus = $('#shootStatus');
  shootBtn.addEventListener('click', async () => {
    shootStatus.textContent = '';
    if (!st.image) { shootStatus.textContent = 'Add its face first.'; return; }
    if (voice.value.trim().length < 12) { shootStatus.textContent = 'Write a few words about its voice first.'; return; }
    shootBtn.disabled = true; shootEl.classList.add('wait'); shootBtn.textContent = 'shooting';
    try {
      const r = await C.post('/api/shoot', { draft: { name: nm.value, symbol: tk.value, niche: st.niche, voice: voice.value }, image: st.image });
      if (r.ok) { flash(); $('#testImg').src = r.image; $('#testCap').textContent = r.caption; $('#testPost').hidden = false; const p = $('#testPost'); p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; }
      else shootStatus.textContent = r.error;
    } catch { shootStatus.textContent = 'The shoot didn’t finish. Try again.'; }
    finally { shootBtn.disabled = false; shootEl.classList.remove('wait'); shootBtn.textContent = 'test shoot again'; }
  });

  // ---------- the split and the launch ----------
  function splitShow() {
    const me = C.S.me || '\u0000you', H = '\u0000house';
    $('#split').innerHTML = X.sharesOf(me, H).map(r => `<div class="${r.address === me ? 'me' : ''}"><dt>${r.address === me ? 'you' : 'the house'}</dt><dd>${r.bps / 100}%</dd></div>`).join('');
  }
  function refreshGo() {
    if (st.busy) return;
    if (st.open === false) { goBtn.disabled = true; goBtn.textContent = 'Launching opens soon'; return; }
    if (st.born) { goBtn.disabled = true; goBtn.textContent = 'launched ✓'; return; }
    goBtn.disabled = false;
    goBtn.textContent = C.S.me ? 'launch it' : 'Connect wallet to launch';
  }
  const buy = X.buyBox($('#buyBox'));
  C.onWallet(() => { splitShow(); refreshGo(); });
  async function firstPost(mint, symbol) {
    const box = $('#firstPost'); if (!box) return;
    box.innerHTML = '<p class="status">shooting its first photo…</p>';
    let r = null; for (let i = 0; i < 2 && !(r && r.ok); i++) { try { r = await C.post('/api/shoot', { mint }); } catch { r = null; } if (r && r.posted) break; }
    if (r && r.ok) { flash(); box.innerHTML = `<figure class="polaroid"><img src="/p/${r.id}" alt=""><figcaption>${esc(r.caption)}</figcaption></figure>`; }
    else box.innerHTML = `<p class="status">${esc((r && r.error) || 'Its first photo comes with the next cycle.')}</p>`;
  }
  goBtn.addEventListener('click', async () => {
    if (st.busy || st.born || st.open === false) return;
    if (!C.S.me) { await C.connect(); refreshGo(); return; }
    const name = clip32(nm.value), symbol = tk.value.trim().replace(/^\$/, '').toUpperCase();
    if (!st.image) return status('Add its face.');
    if (!name) return status('Give it a name.');
    if (!/^[A-Z0-9]{1,10}$/.test(symbol)) return status('The ticker is 1–10 letters or numbers.');
    if (voice.value.trim().length < 12) return status('Write a few words about its voice.');
    if (handle() && !/^[A-Za-z0-9_]{1,15}$/.test(handle())) return status('That X handle doesn’t look right.');
    if (buy.over()) return status('Up to 5 SOL in the first buy.');
    st.busy = true; goBtn.disabled = true; goBtn.textContent = 'launching…'; status(''); goRes.hidden = true;
    try {
      const r = await X.run({ name, symbol, niche: st.niche, voice: voice.value.trim(), x: handle(), image: st.image, devBuy: buy.lamports(), onStep: i => X.steps(goProg, i) });
      X.steps(goProg, 99, true);
      const live = r.settle && r.settle.live; st.born = r.mint;
      goRes.hidden = false;
      goRes.innerHTML = `<p class="ok">$${esc(symbol)} is ${live ? 'live' : 'on pump.fun'}.</p>${r.buyNote ? `<p class="status">${esc(r.buyNote)}</p>` : ''}<div id="firstPost"></div><div class="acts"><a class="btn" href="/c/${r.mint}">its page →</a><a class="btn line" href="https://pump.fun/coin/${r.mint}" target="_blank" rel="noopener">pump.fun ↗</a><a class="btn line" href="${C.solscan('tx', r.sig)}" target="_blank" rel="noopener">solscan ↗</a></div>`;
      C.toast('It’s live.'); C.say('$' + symbol + ' is live.');
      loadBoard(r.mint);
      if (live) firstPost(r.mint, symbol);
    } catch (e) {
      status(C.human(e));
      if (e && e.mint) { goRes.hidden = false; goRes.innerHTML = `<div class="acts"><a class="btn" href="/c/${e.mint}">finish it on its page →</a></div>`; }
    } finally { st.busy = false; refreshGo(); }
  });

  // ---------- the roster ----------
  function sorted() {
    const ks = ((st.board && st.board.infl) || []).slice();
    if (st.sort === 'heavy') ks.sort((x, y) => (y.mcap_sol || 0) - (x.mcap_sol || 0) || y.slot - x.slot);
    else ks.sort((x, y) => y.slot - x.slot);
    return ks;
  }
  let popped = false;
  function renderRoster(hit) {
    const el = $('#nursery'), ks = sorted();
    if (!ks.length) { el.innerHTML = `<div class="kc first"><p>No influencer has launched yet.<br>The first one is yours.</p><a class="btn" href="#make">Create an influencer →</a></div>`; $('#moreBtn').hidden = true; return; }
    el.innerHTML = ks.slice(0, st.shown).map((k, i) => {
      const cap = usdOf(k.mcap_sol);
      return `<a class="kc s-${esc(k.state)}${popped ? '' : ' pop'}" style="--i:${i % 12}" href="/c/${k.mint}" data-m="${k.mint}"><span class="no">#${String(k.slot + 1).padStart(3, '0')}</span><img src="/i/${k.mint}" alt="" loading="lazy"><b>${esc(k.name)}</b><i>$${esc(k.symbol)} · ${esc(k.niche)}</i><em>${k.posts} post${k.posts === 1 ? '' : 's'} · ${STATE[k.state] || k.state}${cap ? ' · ' + cap : ''}</em></a>`;
    }).join('');
    popped = true;
    $('#moreBtn').hidden = ks.length <= st.shown;
    if (hit) { const c = el.querySelector(`[data-m="${hit}"]`); if (c) c.classList.add('hit'); }
  }
  $('#sorts').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.sort = b.dataset.s; $$('#sorts button').forEach(x => x.classList.toggle('on', x === b)); renderRoster(); });
  $('#moreBtn').addEventListener('click', () => { st.shown += 24; renderRoster(); });

  // ---------- the feed ----------
  function renderFeed() {
    const ps = (st.board && st.board.posts) || [], el = $('#posts');
    el.innerHTML = ps.length ? ps.map(p => `<a class="post" href="/c/${p.mint}"><img src="/p/${p.id}" alt="" loading="lazy"><span class="who">$${esc(p.symbol)}</span><span class="cap">${esc(p.caption)}</span></a>`).join('')
      : '<p class="empty">No posts yet. The first influencer posts the minute it launches.</p>';
  }

  // ---------- live trades light up their cards ----------
  if (L) {
    L.births(true);
    L.on('trade', t => {
      const c = document.querySelector(`.kc[data-m="${t.mint}"]`); if (!c) return;
      c.classList.remove('hit'); void c.offsetWidth; c.classList.add('hit');
      const r = c.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const f = document.createElement('div'); f.className = 'float'; f.textContent = (t.side === 'buy' ? '♥ +' : '−') + (t.sol >= 1 ? t.sol.toFixed(1) : t.sol.toFixed(2)) + ' SOL';
      f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + 40) + 'px'; document.body.appendChild(f); setTimeout(() => f.remove(), 1500);
    });
  }

  // ---------- the records ----------
  async function loadBoard(hit) {
    let j = null; try { j = await C.get('/api/board'); } catch {}
    if (!j || !j.ok) { if (!st.board) { $('#nursery').innerHTML = `<div class="kc first"><p>clout’s records didn’t answer.</p><button class="btn line" type="button" id="retryBoard">try again ↻</button></div>`; const r = $('#retryBoard'); if (r) r.onclick = () => loadBoard(); renderFeed(); } return; }
    st.board = j; if (j.open != null) st.open = j.open; refreshGo();
    renderRoster(hit); renderFeed();
    if (L) L.watch(j.infl.slice(0, 200).map(k => k.mint));
  }
  splitShow(); voiceCount(); refreshGo(); loadBoard();
  setInterval(() => { if (!document.hidden && !st.busy) loadBoard(); }, 20000);
  if (L) L.start();
})();
