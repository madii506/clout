// clout hero: a ring light switches on LED by LED, the camera flashes, likes pour out of the phone. An illustration, not
// data. Under it, a strip of real pump.fun births (PumpPortal, via Live). Plus the scroll reveals. Sleeps when hidden.
(function () {
  'use strict';
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches, TAU = Math.PI * 2;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const backOut = u => { const c = 1.70158; u -= 1; return 1 + (c + 1) * u * u * u + c * u * u; };
  const easeOut = u => 1 - (1 - u) * (1 - u), easeIn = u => u * u * u;
  function cut(g, f) { g.save(); g.globalCompositeOperation = 'destination-out'; f(); g.restore(); }
  // ---------- the hero: a ring light switches on LED by LED, the camera flashes, and the likes pour out of the phone ----------
  const cv = document.getElementById('heroAnim');
  if (cv && cv.getContext) (function hero() {
    const x = cv.getContext('2d'), INK = '#140a10', PINK = '#ff2e88', T = 5.2;
    let W = 0, H = 0, dpr = 1, t = calm ? 2.4 : 0, prev = 0, on = false, vis = true, hearts = [], pills = [], lastLoop = -1;
    function size() { const r = cv.getBoundingClientRect(); if (r.width < 10) return false; dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); return true; }
    function heart(cx, cy, s, fill) {
      x.beginPath(); x.moveTo(cx, cy + s * .5);
      x.bezierCurveTo(cx - s * .62, cy + s * .02, cx - s * .5, cy - s * .48, cx, cy - s * .2);
      x.bezierCurveTo(cx + s * .5, cy - s * .48, cx + s * .62, cy + s * .02, cx, cy + s * .5); x.fillStyle = fill; x.fill();
    }
    function rr(px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
    function frame(dt) {
      t += dt; const k = Math.floor(t / T), p = t - k * T;
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
      const R = Math.min(H * .36, W * .2), cx = W / 2, cy = H * .44, th = R * .2;
      // tripod
      x.fillStyle = INK; x.strokeStyle = INK; x.lineCap = 'round';
      rr(cx - R * .045, cy + R * .6, R * .09, H - (cy + R * .6) + 4, R * .03); x.fill();
      x.lineWidth = R * .07; [-1, 1].forEach(s => { x.beginPath(); x.moveTo(cx, cy + R * 1.85); x.lineTo(cx + s * R * .6, H + 4); x.stroke(); });
      // the ring, its LEDs switching on one by one
      const lit = calm ? 36 : p < 1 ? Math.floor(p * 36) : p > 4.3 ? Math.max(0, 36 - Math.floor((p - 4.3) / .9 * 36)) : 36;
      if (lit > 30) { x.save(); x.shadowColor = 'rgba(255,255,255,.9)'; x.shadowBlur = 40 * dpr * (lit / 36); x.beginPath(); x.arc(cx, cy, R - th / 2, 0, TAU); x.lineWidth = th; x.strokeStyle = '#fff'; x.stroke(); x.restore(); }
      x.beginPath(); x.arc(cx, cy, R - th / 2, 0, TAU); x.lineWidth = th; x.strokeStyle = lit > 30 ? '#fff' : '#ffd6e8'; x.stroke();
      for (let i = 0; i < 36; i++) { const a = -Math.PI / 2 + i / 36 * TAU, px = cx + Math.cos(a) * (R - th / 2), py = cy + Math.sin(a) * (R - th / 2); x.beginPath(); x.arc(px, py, th * .16, 0, TAU); x.fillStyle = i < lit ? '#fff' : '#ff9cc6'; x.fill(); }
      // the phone on its mount
      x.fillStyle = INK; rr(cx - R * .035, cy + R * .25, R * .07, R * .55, R * .02); x.fill();
      const pw = R * .46, ph = R * .8, py0 = cy - ph / 2 - R * .06;
      rr(cx - pw / 2, py0, pw, ph, R * .08); x.fill();
      x.fillStyle = '#2b1824'; rr(cx - pw / 2 + R * .035, py0 + R * .035, pw - R * .07, ph - R * .07, R * .055); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(cx, py0 + R * .07, R * .035, 0, TAU); x.fill();
      if (calm || Math.floor(t * 2) % 2 === 0) { x.fillStyle = '#ff3b3b'; x.beginPath(); x.arc(cx + pw / 2 - R * .12, py0 + R * .12, R * .05, 0, TAU); x.fill(); }
      // the flash
      if (!calm && p >= 1 && p < 1.4) { const u = (p - 1) / .4, fx = cx, fy = py0 + R * .07; x.save(); x.fillStyle = `rgba(255,255,255,${(1 - u).toFixed(3)})`; x.beginPath(); x.arc(fx, fy, R * (.2 + u * 1.6), 0, TAU); x.fill();
        x.strokeStyle = `rgba(255,255,255,${(1 - u).toFixed(3)})`; x.lineWidth = R * .05 * (1 - u) + 1; x.lineCap = 'round'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r1 = R * (.4 + u * 1.9), r2 = r1 + R * .35 * (1 - u); x.moveTo(fx + Math.cos(a) * r1, fy + Math.sin(a) * r1); x.lineTo(fx + Math.cos(a) * r2, fy + Math.sin(a) * r2); } x.stroke(); x.restore(); }
      // likes pour out
      if (!calm && k !== lastLoop && p >= 1.05) { lastLoop = k; hearts = []; pills = []; for (let i = 0; i < 16; i++) hearts.push({ x: cx + (Math.random() - .5) * pw * .6, y: py0 + ph * .45, vx: (Math.random() - .5) * R * 1.4, vy: -R * (1.1 + Math.random() * 1.3), s: R * (.12 + Math.random() * .16), born: t + i * .09, life: 1.6 + Math.random() * .9, c: Math.random() < .7 ? '#fff' : INK });
        for (let i = 0; i < 3; i++) pills.push({ side: i % 2 ? 1 : -1, y: cy - R * .3 + i * R * .42, born: t + .25 + i * .32 }); }
      for (const h of hearts) { const a = t - h.born; if (a < 0 || a > h.life) continue; const u = a / h.life; heart(h.x + h.vx * a + Math.sin(a * 5 + h.s) * R * .08, h.y + h.vy * a, h.s * (u < .15 ? u / .15 : 1), h.c === '#fff' ? `rgba(255,255,255,${1 - u})` : `rgba(20,10,16,${1 - u})`); }
      for (const q of pills) {
        const a = t - q.born; if (a < 0 || a > 2.4) continue;
        const u = Math.min(1, a / .3), out = a > 2.1 ? (a - 2.1) / .3 : 0, w = R * .78, h = R * .28;
        const px = cx + q.side * (R * 1.12 + w / 2) - w / 2 + q.side * (1 - u) * -R * .4, alpha = u * (1 - out);
        x.globalAlpha = alpha; x.fillStyle = '#fff'; rr(px, q.y - h / 2, w, h, h / 2); x.fill(); x.lineWidth = 2; x.strokeStyle = INK; x.stroke();
        heart(px + h * .55, q.y + h * .04, h * .55, PINK);
        x.fillStyle = INK; rr(px + h * 1.05, q.y - h * .12, w - h * 1.45, h * .24, h * .12); x.fill();
        x.globalAlpha = 1;
      }
    }
    function loop(now) { if (!on) return; const dt = Math.min(.05, Math.max(0, (now - prev) / 1000)); prev = now; frame(dt); requestAnimationFrame(loop); }
    function play() { if (on || calm || (!W && !size())) return; on = true; prev = performance.now(); requestAnimationFrame(loop); }
    const stop = () => { on = false; };
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (size() && (calm || !on)) frame(0); }).observe(cv);
    if (size()) frame(0);
    if (calm) return;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[es.length - 1].isIntersecting; vis && !document.hidden ? play() : stop(); }).observe(cv);
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : vis && play(); });
    play();
  })();

  // ---------- the strip: real pump.fun births, sliding by. Each name glides on the compositor (Web Animations), so the
  // strip stays smooth while the page is busy ----------
  (function strip() {
    const box = document.getElementById('marq'), tr = document.getElementById('mtrack'), Lv = window.Live;
    if (!box || !tr || !Lv || calm || !Element.prototype.animate) return;
    const q = [], live = []; let tail = null, timer = null, paused = false;
    const v = () => (tr.clientWidth < 600 ? 44 : 62) / 1000;            // px per ms
    const rightOf = it => it.x0 - v() * (performance.now() - it.t0) + it.w;
    box.addEventListener('mouseenter', () => { paused = true; live.forEach(it => it.a.pause()); });
    box.addEventListener('mouseleave', () => { paused = false; live.forEach(it => { it.t0 += performance.now() - (it.pausedAt || performance.now()); it.a.play(); }); });
    box.addEventListener('mouseenter', () => { const n = performance.now(); live.forEach(it => { it.pausedAt = n; }); });
    Lv.on('birth', b => { q.push(b); if (q.length > 24) q.shift(); pump(); });
    function pump() {
      clearTimeout(timer);
      if (!q.length) return;
      if (paused) { timer = setTimeout(pump, 400); return; }
      const W = tr.clientWidth, at = tail && live.includes(tail) ? rightOf(tail) + 40 : W * .04;
      if (at > W) { timer = setTimeout(pump, Math.max(60, (at - W) / v())); return; }
      const b = q.shift(), el = document.createElement('span');
      if (b.name) el.title = b.name;
      el.textContent = '$' + (b.symbol || b.mint.slice(0, 4)); tr.appendChild(el);
      const w = el.offsetWidth, it = { el, x0: at, w, t0: performance.now() };
      it.a = el.animate([{ transform: `translate3d(${at}px,0,0)` }, { transform: `translate3d(${-w - 4}px,0,0)` }], { duration: (at + w + 4) / v(), easing: 'linear', fill: 'both' });
      it.a.onfinish = () => { el.remove(); const i = live.indexOf(it); if (i >= 0) live.splice(i, 1); };
      live.push(it); tail = it; box.classList.add('on');
      if (q.length) timer = setTimeout(pump, 30);
    }
  })();

  // ---------- reveals: sections rise in as they arrive ----------
  (function reveal() {
    if (calm || !('IntersectionObserver' in window)) return;
    const els = [...document.querySelectorAll('.sec .sh, .maker, .how li, .faq')];
    document.querySelectorAll('.how li').forEach((el, i) => el.style.setProperty('--d', (i % 3) * .09 + 's'));
    document.querySelectorAll('.gens figure').forEach((el, i) => el.style.setProperty('--d', i * .08 + 's'));
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('vis'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => { el.classList.add('rv'); io.observe(el); });
  })();
})();
