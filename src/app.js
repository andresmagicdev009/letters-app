(() => {
  const D = window.CARTAS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const HEART = 'M12 20s-7.2-4.4-9.2-8.8C1.4 8 3.3 4.5 6.8 4.5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.5 0 5.4 3.5 4 6.7C19.2 15.6 12 20 12 20z';
  const PLAY_ICON = '<svg class="i-fill row__play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
  const PAUSE_ICON = '<svg class="i-fill row__play" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>';
  const STAR ='M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z';
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function sha256(text) {
    if (!crypto.subtle) return null; // requiere https o localhost
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function checkCode(code) {
    if (D.PASSCODE_HASH) return (await sha256(code)) === D.PASSCODE_HASH;
    return code === D.PASSCODE_FALLBACK;
  }

  /* ───────── Bloqueo ───────── */
  const lock = $('#lock'), cellsEl = $('#cells'), msg = $('#lockMsg');
  const N = 8;
  let busy = false;

  for (let i = 0; i < N; i++) {
    const inp = document.createElement('input');
    inp.className = 'cell';
    inp.type = 'text';
    inp.inputMode = 'numeric';
    inp.pattern = '[0-9]*';
    inp.autocomplete = i === 0 ? 'one-time-code' : 'off';
    inp.setAttribute('aria-label', `Dígito ${i + 1} de ${N}`);
    inp.dataset.value = '';
    cellsEl.appendChild(inp);
  }
  const cells = $$('.cell', cellsEl);
  const focusAt = i => { const c = cells[Math.max(0, Math.min(N - 1, i))]; c.focus({ preventScroll: true }); c.select(); };
  const setCell = (i, v) => { cells[i].dataset.value = v; cells[i].value = v ? '•' : ''; };
  const code = () => cells.map(c => c.dataset.value).join('');

  function clearError() {
    cellsEl.classList.remove('is-error');
    msg.classList.remove('is-error');
    msg.textContent = '';
    cells.forEach(c => c.removeAttribute('aria-invalid'));
  }
  function fill(start, digits) {
    clearError();
    let i = start;
    for (const d of digits) { if (i >= N) break; setCell(i++, d); }
    if (code().length === N) submit(); else focusAt(i);
  }

  async function submit() {
    busy = true;
    const ok = await checkCode(code());
    if (ok) {
      cellsEl.classList.add('is-ok');
      cells.forEach(c => c.blur());
      msg.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>Listo</span>';
      setTimeout(() => {
        mountInterior();             // el interior carga debajo mientras se funde
        lock.classList.add('is-unlocking');
        setTimeout(() => lock.remove(), 320);
      }, 450);
    } else {
      cellsEl.classList.add('is-error');
      cells.forEach(c => c.setAttribute('aria-invalid', 'true'));
      msg.classList.add('is-error');
      msg.textContent = 'Clave incorrecta, intenta de nuevo';
      if (!reduced()) {
        cellsEl.classList.remove('is-shaking'); void cellsEl.offsetWidth; cellsEl.classList.add('is-shaking');
      }
      setTimeout(() => {
        cellsEl.classList.remove('is-shaking');
        cells.forEach((_, i) => setCell(i, ''));
        busy = false;
        focusAt(0);
      }, reduced() ? 120 : 320);
    }
  }

  cells.forEach((c, i) => {
    c.addEventListener('input', () => {
      if (busy) { c.value = c.dataset.value ? '•' : ''; return; }
      const v = c.value.replace(/\D/g, '');
      if (!v) { c.value = c.dataset.value ? '•' : ''; return; }
      fill(v.length >= N ? 0 : i, v.slice(0, N));
    });
    c.addEventListener('keydown', e => {
      if (busy) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (c.dataset.value) setCell(i, '');
        else if (i > 0) { setCell(i - 1, ''); focusAt(i - 1); }
      } else if (e.key === 'ArrowLeft') { e.preventDefault(); focusAt(i - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); focusAt(i + 1); }
    });
    c.addEventListener('paste', e => {
      e.preventDefault();
      if (busy) return;
      const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
      if (t) fill(t.length >= N ? 0 : i, t.slice(0, N));
    });
    c.addEventListener('focus', () => c.select());
  });
  $('#lockForm').addEventListener('submit', e => e.preventDefault());
  if (D.LOCK_ENABLED === false) { lock.remove(); mountInterior(); }
  else focusAt(0);

  /* ───────── Interior ───────── */
  function mountInterior() {
    document.body.style.background = 'var(--surface)';
    document.body.prepend($('#interiorTpl').content.cloneNode(true));
    initTheme();
    initLetters();
    initPlayer();
  }

  function initTheme() {
    const opts = $$('[data-theme-opt]');
    function setTheme(name) {
      if (name === 'rosa') delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = name;
      opts.forEach(o => {
        const on = o.dataset.themeOpt === name;
        o.setAttribute('aria-checked', String(on));
        o.tabIndex = on ? 0 : -1;
      });
      try { localStorage.setItem('cartas.theme', name); } catch {}
    }
    opts.forEach((o, i) => {
      o.addEventListener('click', () => setTheme(o.dataset.themeOpt));
      o.addEventListener('keydown', e => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        const n = opts[(i + step + opts.length) % opts.length];
        setTheme(n.dataset.themeOpt); n.focus();
      });
    });
    let saved = 'rosa';
    try { saved = localStorage.getItem('cartas.theme') || 'rosa'; } catch {}
    setTheme(opts.some(o => o.dataset.themeOpt === saved) ? saved : 'rosa');
  }

  function initLetters() {
    const paper = $('#paper'), dots = $('#dots'), prev = $('#prevLetter'), next = $('#nextLetter');
    let idx = 0;
    const render = () => {
      const L = D.LETTERS[idx];
      paper.setAttribute('aria-label', `Carta ${idx + 1} de ${D.LETTERS.length}`);
      paper.innerHTML =
        `<svg class="paper__heart" viewBox="0 0 24 24" aria-hidden="true"><path d="${HEART}"/></svg>` +
        `<p class="paper__date">${esc(L.date)}</p>` +
        `<h2 class="paper__greeting">${esc(L.greeting)}</h2>` +
        `<div class="paper__body">${L.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>` +
        `<p class="paper__sign">${esc(L.signature)}</p>`;
      dots.innerHTML = D.LETTERS.map((_, i) => `<span class="${i === idx ? 'is-active' : ''}"></span>`).join('');
      dots.setAttribute('aria-label', `Carta ${idx + 1} de ${D.LETTERS.length}`);
      prev.setAttribute('aria-disabled', String(idx === 0));
      next.setAttribute('aria-disabled', String(idx === D.LETTERS.length - 1));
      const wrap = $('#letterWrap');
      wrap.style.animation = 'none'; void wrap.offsetWidth; wrap.style.animation = '';
      $('#page').scrollTo({ top: 0 });
    };
    prev.addEventListener('click', () => { if (idx > 0) { idx--; render(); } });
    next.addEventListener('click', () => { if (idx < D.LETTERS.length - 1) { idx++; render(); } });
    render();
  }

  function initPlayer() {
    const root = $('#interior'), audio = $('#audio'), list = $('#playlist');
    const seek = $('#seek'), fill = $('#fill'), thumb = $('#thumb');
    const favs = new Set(JSON.parse(localStorage.getItem('cartas.favs') || '[]'));
    let cur = 0;
    const artistHTML = t => (t.logo ? `<img class="artist-logo" src="${esc(t.logo)}" alt="" loading="lazy">` : '') + esc(t.artist);
    const isDesktop = matchMedia('(min-width: 1024px)');

    list.innerHTML = D.TRACKS.map((t, i) => `
      <li class="row" data-i="${i}">
        <button type="button" class="row__main" aria-label="Reproducir ${esc(t.title)}, ${esc(t.artist)}">
          <span class="row__num">${PLAY_ICON}</span>
          <span class="cover cover--sm" style="background:${t.cover.startsWith('linear') ? t.cover : `url('${t.cover}')`}">${t.logo ? `<img class="cover__logo" src="${esc(t.logo)}" alt="" loading="lazy">` : ''}</span>
          <span class="row__text"><span class="row__title">${esc(t.title)}</span><span class="row__artist">${esc(t.artist)}</span></span>
          <span class="row__dur">${fmt(t.duration)}</span>
        </button>
        <button type="button" class="fav" aria-pressed="false" aria-label="Añadir a favoritas">
          <svg viewBox="0 0 24 24"><path d="${HEART}"/></svg>
          <svg class="fav__spark" viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}"/></svg>
        </button>
      </li>`).join('');

    const dur = () => (isFinite(audio.duration) && audio.duration) || D.TRACKS[cur].duration;

    function paintTrack() {
      const t = D.TRACKS[cur];
      const bg = t.cover.startsWith('linear') ? t.cover : `url('${t.cover}')`;
      $$('[data-cover]', root).forEach(el => (el.style.background = bg, el.style.backgroundSize = 'cover'));
      $$('[data-title]', root).forEach(el => (el.textContent = t.title));
      $$('[data-artist]', root).forEach(el => (el.innerHTML = artistHTML(t)));
      $$('[data-artist-text]', root).forEach(el => (el.textContent = t.artist));
      $$('[data-logo]', root).forEach(el => { el.hidden = !t.logo; if (t.logo) el.src = t.logo; });
      $$('.row', list).forEach((r, i) => {
        const on = i === cur;
        r.classList.toggle('is-active', on);
        $('.row__main', r).setAttribute('aria-current', on ? 'true' : 'false');
        const f = $('.fav', r), fav = favs.has(i);
        f.setAttribute('aria-pressed', String(fav));
        f.setAttribute('aria-label', fav ? 'Quitar de favoritas' : 'Añadir a favoritas');
      });
      paintProgress();
      paintPlaying();
    }
    function paintProgress() {
      const d = dur(), p = Math.min(1, (audio.currentTime || 0) / d) * 100;
      fill.style.width = p + '%'; thumb.style.left = p + '%';
      $('#elapsed').textContent = fmt(audio.currentTime);
      $('#total').textContent = fmt(d);
      seek.setAttribute('aria-valuemax', Math.round(d));
      seek.setAttribute('aria-valuenow', Math.round(audio.currentTime || 0));
      seek.setAttribute('aria-valuetext', `${fmt(audio.currentTime)} de ${fmt(d)}`);
    }
    function paintPlaying() {
      const playing = !audio.paused;
      root.classList.toggle('is-playing', playing);
      $$('[data-toggle]', root).forEach(b => b.setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir'));
      $$('.row', list).forEach((r, i) => {
        const t = D.TRACKS[i], pause = i === cur && playing;
        $('.row__num', r).innerHTML = pause ? PAUSE_ICON : PLAY_ICON;
        $('.row__main', r).setAttribute('aria-label', `${pause ? 'Pausar' : 'Reproducir'} ${t.title}, ${t.artist}`);
      });
    }
    function load(i, autoplay) {
      cur = (i + D.TRACKS.length) % D.TRACKS.length;
      audio.src = D.TRACKS[cur].src;
      paintTrack();
      if (autoplay) audio.play().catch(() => {});
    }

    $$('[data-toggle]', root).forEach(b => b.addEventListener('click', () => (audio.paused ? audio.play().catch(() => {}) : audio.pause())));
    $('#prevTrack').addEventListener('click', () => (audio.currentTime > 3 ? (audio.currentTime = 0) : load(cur - 1, true)));
    $('#nextTrack').addEventListener('click', () => load(cur + 1, true));
    list.addEventListener('click', e => {
      const row = e.target.closest('.row'); if (!row) return;
      const i = +row.dataset.i;
      if (e.target.closest('.fav')) {
        favs.has(i) ? favs.delete(i) : favs.add(i);
        localStorage.setItem('cartas.favs', JSON.stringify([...favs]));
        paintTrack();
      } else if (i === cur) audio.paused ? audio.play().catch(() => {}) : audio.pause();
      else load(i, true);
    });

    /* Volumen */
    const vol = $('#volume'), muteBtn = $('#mute');
    let lastVol = 0.8;
    try { const v = parseFloat(localStorage.getItem('cartas.vol')); if (v > 0 && v <= 1) lastVol = v; } catch {}
    audio.volume = lastVol;
    function paintVolume() {
      const v = audio.muted ? 0 : audio.volume, pct = Math.round(v * 100);
      vol.value = pct; vol.style.setProperty('--p', pct + '%');
      vol.setAttribute('aria-valuetext', `${pct}%`);
      const muted = v === 0;
      muteBtn.parentElement.classList.toggle('is-muted', muted);
      muteBtn.setAttribute('aria-pressed', String(muted));
      muteBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
    }
    vol.addEventListener('input', () => {
      const v = vol.value / 100;
      audio.muted = false; audio.volume = v;
      if (v > 0) lastVol = v;
      try { localStorage.setItem('cartas.vol', String(v)); } catch {}
    });
    muteBtn.addEventListener('click', () => {
      if (audio.muted || audio.volume === 0) { audio.muted = false; audio.volume = lastVol; }
      else audio.muted = true;
    });
    audio.addEventListener('volumechange', paintVolume);
    paintVolume();

    audio.addEventListener('timeupdate', paintProgress);
    audio.addEventListener('loadedmetadata', paintProgress);
    audio.addEventListener('play', paintPlaying);
    audio.addEventListener('pause', paintPlaying);
    audio.addEventListener('ended', () => load(cur + 1, true));

    const seekTo = x => { const r = seek.getBoundingClientRect(); audio.currentTime = Math.min(1, Math.max(0, (x - r.left) / r.width)) * dur(); paintProgress(); };
    seek.addEventListener('pointerdown', e => {
      seekTo(e.clientX); seek.setPointerCapture(e.pointerId);
      const mv = ev => seekTo(ev.clientX);
      const up = () => { seek.removeEventListener('pointermove', mv); seek.removeEventListener('pointerup', up); };
      seek.addEventListener('pointermove', mv); seek.addEventListener('pointerup', up);
    });
    seek.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); audio.currentTime = Math.min(dur(), audio.currentTime + 5); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); }
    });

    /* Abrir / cerrar: bottom sheet en móvil, panel lateral en desktop */
    const openBtn = $('#openPlayer'), closeBtn = $('#closePlayer'), player = $('#player');
    function setOpen(v, focus = true) {
      root.classList.toggle('is-open', v);
      openBtn.setAttribute('aria-expanded', String(v));
      player.setAttribute('aria-hidden', String(!v));
      if (focus) setTimeout(() => (v ? closeBtn : openBtn).focus({ preventScroll: true }), 310);
    }
    openBtn.addEventListener('click', () => setOpen(true));
    closeBtn.addEventListener('click', () => setOpen(false));
    $('#handle').addEventListener('click', () => setOpen(false));
    $('#scrim').addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('is-open')) setOpen(false); });

    // Deslizar hacia abajo para cerrar (móvil)
    let y0 = null;
    $('.player__head', root).addEventListener('touchstart', e => (y0 = e.touches[0].clientY), { passive: true });
    $('.player__head', root).addEventListener('touchend', e => { if (y0 !== null && e.changedTouches[0].clientY - y0 > 60) setOpen(false); y0 = null; });

    // Desktop (diseño 09): el panel lateral empieza abierto
    setOpen(isDesktop.matches, false);
    isDesktop.addEventListener('change', e => setOpen(e.matches, false));

    load(0, false);
    paintPlaying();
  }
})();
