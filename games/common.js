// Shared helpers: sound, vibration, best scores, end-of-game modal.
const Arcade = (() => {
  let ctx;
  const muted = () => localStorage.getItem('arcade:mute') === '1';
  function tone(freq = 440, dur = 0.12, type = 'sine', vol = 0.15) {
    if (muted()) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) {}
  }
  const sfx = {
    tap: () => tone(660, 0.06, 'triangle'),
    good: () => { tone(660, 0.1); setTimeout(() => tone(880, 0.12), 90); },
    bad: () => tone(160, 0.25, 'sawtooth', 0.1),
    win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18), i * 120)),
  };
  const buzz = (ms = 30) => { if (!muted() && navigator.vibrate) navigator.vibrate(ms); };
  function best(key, score, lowerIsBetter = false) {
    const k = 'arcade:best:' + key;
    const prev = Number(localStorage.getItem(k));
    const has = localStorage.getItem(k) !== null;
    if (score !== undefined && (!has || (lowerIsBetter ? score < prev : score > prev))) {
      localStorage.setItem(k, score);
      return { best: score, isNew: true };
    }
    return { best: has ? prev : null, isNew: false };
  }
  function modal({ icon = '🎉', title, text, btn = 'Play again', onBtn }) {
    let ov = document.querySelector('.overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'overlay';
      document.body.appendChild(ov);
    }
    ov.innerHTML = `<div class="modal"><div class="big">${icon}</div><h2>${title}</h2><p>${text}</p>
      <div style="display:flex;gap:10px;justify-content:center"><a class="btn ghost" href="index.html" style="display:grid;place-items:center">Menu</a>
      <button class="btn" id="mBtn">${btn}</button></div></div>`;
    ov.classList.add('show');
    ov.querySelector('#mBtn').onclick = () => { ov.classList.remove('show'); onBtn && onBtn(); };
  }
  function seg(el, onChange) {
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      sfx.tap(); onChange(b.dataset.v);
    });
  }
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  return { tone, sfx, buzz, best, modal, seg, shuffle, muted };
})();
