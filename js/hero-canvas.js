/* Rotating dress video -> canvas
   1. White video background is keyed out (transparent), so the dress sits on the hero background.
   2. Dress is shown white. Real colour appears only around the mouse pointer.
      (Old silver look: gray = lum * 0.9 + 28)
   The <video> keeps looping, so the dress keeps rotating. */
(function () {
  const video = document.getElementById('dressVideo');
  const canvas = document.getElementById('dressCanvas');
  const stage = document.getElementById('stage');
  const ring = document.getElementById('ring');
  if (!video || !canvas) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const CROP_TOP = 0.235;      // top part of the video to cut off. Use 0 for a new video with no logo/watermark
  const MAX_H = 760;           // canvas height cap, keeps HD / 4K videos smooth
  const REVEAL_R = 0.36;       // spotlight radius (fraction of canvas width)
  let W = 0, H = 0, SY = 0, SW = 0, SH = 0;
  const m = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0 };
  let last = 0, failed = false;

  function setup() {
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw) return;
    SY = Math.round(vh * CROP_TOP);
    SW = vw; SH = vh - SY;
    const sc = Math.min(1, MAX_H / SH);
    W = Math.round(SW * sc); H = Math.round(SH * sc);
    canvas.width = W; canvas.height = H;
    canvas.style.aspectRatio = W + ' / ' + H;
    m.x = m.tx = W * 0.5; m.y = m.ty = H * 0.45;
  }

  function useFallback() {           // if canvas pixel access is blocked (e.g. opened as file://)
    failed = true;
    canvas.style.display = 'none';
    video.classList.add('fallback');
  }

  function render() {
    if (!W) return;
    ctx.drawImage(video, 0, SY, SW, SH, 0, 0, W, H);
    let img;
    try { img = ctx.getImageData(0, 0, W, H); } catch (e) { return useFallback(); }
    const d = img.data, r = m.r, r2 = r * r, inner = r * 0.55;
    const x0 = Math.max(0, (m.x - r) | 0), x1 = Math.min(W, (m.x + r + 1) | 0);
    const y0 = Math.max(0, (m.y - r) | 0), y1 = Math.min(H, (m.y + r + 1) | 0);

    for (let y = 0, i = 0; y < H; y++) {
      for (let x = 0; x < W; x++, i += 4) {
        const R = d[i], G = d[i + 1], B = d[i + 2];
        const mn = R < G ? (R < B ? R : B) : (G < B ? G : B);
        let t = (240 - mn) / 60;                 // key out white background
        if (t <= 0) { d[i + 3] = 0; continue; }
        if (t > 1) t = 1;
        const a = 1 - mn / 255;
        let fr = (R - mn) / a, fg = (G - mn) / a, fb = (B - mn) / a;   // un-mix from white
        if (fr > 255) fr = 255; if (fg > 255) fg = 255; if (fb > 255) fb = 255;
        const lum = 0.3 * fr + 0.59 * fg + 0.11 * fb;
        let gray = 175 + lum * 0.45;             // WHITE gown: bright base, folds keep soft shading
        if (gray > 255) gray = 255;
        let k = 0;
        if (r > 1 && x >= x0 && x < x1 && y >= y0 && y < y1) {
          const dx = x - m.x, dy = y - m.y, dd = dx * dx + dy * dy;
          if (dd < r2) {
            const dist = Math.sqrt(dd);
            k = dist < inner ? 1 : 1 - (dist - inner) / (r - inner);
            k = k * k * (3 - 2 * k);             // smoothstep
          }
        }
        d[i]     = gray + (fr - gray) * k;
        d[i + 1] = gray + (fg - gray) * k;
        d[i + 2] = gray + (fb - gray) * k;
        d[i + 3] = t * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function tick(ts) {
    requestAnimationFrame(tick);
    if (failed || ts - last < 33) return;        // ~30fps
    last = ts;
    m.x += (m.tx - m.x) * 0.22; m.y += (m.ty - m.y) * 0.22;
    m.r += (m.tr - m.r) * 0.14;
    if (m.r < 1) m.r = 0;
    render();
  }

  // ---- mouse / touch tracking ----
  const touchOnly = window.matchMedia('(hover: none)').matches;
  let auto = touchOnly;

  function pointer(e) {
    auto = false;
    const rc = canvas.getBoundingClientRect();
    const pad = 80;
    const inside = e.clientX > rc.left - pad && e.clientX < rc.right + pad &&
                   e.clientY > rc.top - pad && e.clientY < rc.bottom + pad;
    if (inside) {
      m.tx = (e.clientX - rc.left) / rc.width * W;
      m.ty = (e.clientY - rc.top) / rc.height * H;
      m.tr = W * REVEAL_R;
      const sr = stage.getBoundingClientRect();
      const dia = 2 * W * REVEAL_R * (rc.width / W) * 0.8;   // ring ~ where colour is fully visible
      ring.style.width = ring.style.height = dia + 'px';
      ring.style.margin = (-dia / 2) + 'px 0 0 ' + (-dia / 2) + 'px';
      ring.style.left = (e.clientX - sr.left) + 'px';
      ring.style.top = (e.clientY - sr.top) + 'px';
      ring.classList.add('on');
    } else { m.tr = 0; ring.classList.remove('on'); }
  }
  window.addEventListener('pointermove', pointer, { passive: true });
  document.addEventListener('pointerleave', () => { m.tr = 0; ring.classList.remove('on'); });
  window.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { auto = false; pointer(e); } });

  // phones have no hover, so the colour spotlight wanders by itself
  setInterval(() => {
    if (!auto || !W) return;
    const t = performance.now() / 2200;
    m.tx = W * (0.5 + 0.28 * Math.sin(t));
    m.ty = H * (0.5 + 0.30 * Math.sin(t * 1.4 + 1));
    m.tr = W * REVEAL_R;
  }, 33);

  // ---- start ----
  function start() { setup(); video.play().catch(() => {}); }
  if (video.readyState >= 1) start(); else video.addEventListener('loadedmetadata', start);
  video.addEventListener('error', () => { if (!video.currentSrc) useFallback(); }, true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) video.play().catch(() => {}); });
  document.addEventListener('pointerdown', () => video.play().catch(() => {}), { once: true });
  requestAnimationFrame(tick);
})();
