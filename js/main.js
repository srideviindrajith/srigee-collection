(function () {
  const $ = s => document.querySelector(s);
  const fmt = n => '₹' + n.toLocaleString('en-IN');

  // ---- products ----
  const grid = $('#productGrid');
  const filtersEl = $('#filters');
  const cats = ['all', ...new Set(window.PRODUCTS.map(p => p.cat))];
  filtersEl.innerHTML = cats.map((c, i) => `<button class="chip${i ? '' : ' active'}" data-cat="${c}">${c === 'all' ? 'All' : c}</button>`).join('');
  function renderProducts(cat) {
    const list = window.PRODUCTS.filter(p => cat === 'all' || p.cat === cat);
    grid.innerHTML = list.map(p => `
      <article class="card" data-id="${p.id}">
        <div class="p-media">
          ${p.stock === false ? '<span class="tag sold">Sold out</span>' : (p.badge ? `<span class="tag">${p.badge}</span>` : '')}
          <button class="heart" aria-label="Wishlist"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-9-9.2C1.700 7.200 4 4 7.200 4c2 0 3.700 1.100 4.800 2.800C13.100 5.100 14.800 4 16.800 4 20 4 22.300 7.200 21 10.800 19 15.400 12 20 12 20z"/></svg></button>
          <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.parentElement.classList.add('no-photo')" />
        </div>
        <div class="p-info">
          <div class="p-cat">${p.cat}</div>
          <h3 class="p-name">${p.name}</h3>
          <div class="p-row"><div class="price">${fmt(p.price)}<s>${fmt(p.old)}</s></div>
            <button class="add"${p.stock === false ? ' disabled' : ''}>${p.stock === false ? 'Sold out' : 'Add to Cart'}</button></div>
        </div>
      </article>`).join('');
    requestAnimationFrame(() => grid.querySelectorAll('.card').forEach((c, i) => setTimeout(() => c.classList.add('in'), i * 90)));
  }
  grid.addEventListener('click', e => {
    const card = e.target.closest('.card'); if (!card) return;
    if (e.target.closest('.heart')) return e.target.closest('.heart').classList.toggle('on');
    const add = e.target.closest('.add');
    if (add && !add.disabled) Cart.add(+card.dataset.id, card.querySelector('.p-media'), add);
  });
  $('#filters').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    document.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === c));
    renderProducts(c.dataset.cat);
  });
  renderProducts('all');

  // ---- signature collections (Projects) ----
  const looks = [
    { t: 'Noir Elegance', s: 'Gowns', img: 'assets/products/p1.jpg' },
    { t: 'Crimson Bridal', s: 'Ethnic', img: 'assets/products/p3.jpg' },
    { t: 'Midnight Party', s: 'Party', img: 'assets/products/p2.jpg' }
  ];
  $('#lookbook').innerHTML = looks.map(l => `
    <button class="look reveal" data-cat="${l.s}"><img src="${l.img}" alt="${l.t}" loading="lazy" onerror="this.parentElement.classList.add('no-photo')" />
      <div><span>${l.s}</span><h3>${l.t}</h3></div></button>`).join('');
  $('#lookbook').addEventListener('click', e => {
    const b = e.target.closest('.look'); if (!b) return;
    const chip = document.querySelector(`.chip[data-cat="${b.dataset.cat}"]`); chip && chip.click();
    document.getElementById('collection').scrollIntoView({ behavior: 'smooth' });
  });

  // ---- nav ----
  const nav = $('#nav'), links = $('#navLinks');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40), { passive: true });
  $('#burger').addEventListener('click', () => links.classList.toggle('open'));
  links.addEventListener('click', e => e.target.tagName === 'A' && links.classList.remove('open'));
  const secObs = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) links.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'about', 'services', 'projects', 'feedback'].forEach(id => { const s = document.getElementById(id); s && secObs.observe(s); });

  // ---- scroll reveal + counters ----
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in'); io.unobserve(en.target);
    en.target.querySelectorAll('[data-count]').forEach(c => {
      const end = +c.dataset.count, t0 = performance.now();
      (function step(t) { const p = Math.min(1, (t - t0) / 1600); c.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN'); if (p < 1) requestAnimationFrame(step); })(t0);
    });
  }), { threshold: .15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  $('#yr').textContent = new Date().getFullYear();
})();
