/* Cart with fly-to-cart animation, slide-in drawer and localStorage persistence */
(function () {
  const $ = id => document.getElementById(id);
  const drawer = $('drawer'), overlay = $('overlay'), list = $('cartItems');
  const countEl = $('cartCount'), totalEl = $('cartTotal'), cartBtn = $('cartBtn'), toastEl = $('toast');
  const fmt = n => '₹' + n.toLocaleString('en-IN');
  let items = [];
  try { items = JSON.parse(localStorage.getItem('srigee_cart') || '[]'); } catch (e) {}

  const save = () => { try { localStorage.setItem('srigee_cart', JSON.stringify(items)); } catch (e) {} };
  const byId = id => window.PRODUCTS.find(p => p.id === id);

  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  function render() {
    items = items.filter(i => byId(i.id));
    const n = items.reduce((s, i) => s + i.qty, 0);
    countEl.textContent = n; countEl.classList.toggle('show', n > 0);
    totalEl.textContent = fmt(items.reduce((s, i) => s + byId(i.id).price * i.qty, 0));
    if (!items.length) {
      list.innerHTML = '<div class="empty"><p>Your bag is empty.<br/>Add a dress to get started.</p></div>';
      return;
    }
    list.innerHTML = items.map(i => {
      const p = byId(i.id);
      return `<div class="item" data-id="${p.id}">
        <div class="thumb" style="background-image:url('${p.img}')"></div>
        <div><h4>${p.name}</h4><div class="ip">${fmt(p.price)}</div>
          <div class="qty"><button data-a="dec">−</button><span>${i.qty}</span><button data-a="inc">+</button></div></div>
        <button class="rm" data-a="rm" aria-label="Remove">×</button></div>`;
    }).join('');
  }

  function open() { drawer.classList.add('open'); overlay.classList.add('open'); }
  function close() { drawer.classList.remove('open'); overlay.classList.remove('open'); }

  function fly(media) {
    const from = media.getBoundingClientRect(), to = cartBtn.getBoundingClientRect();
    const img = media.querySelector('img');
    const el = document.createElement('div'); el.className = 'fly';
    el.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;`;
    if (img && img.complete && img.naturalWidth) el.style.backgroundImage = `url('${img.currentSrc || img.src}')`;
    document.body.appendChild(el);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    el.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * .45}px,${dy * .45 - 90}px) scale(.42) rotate(8deg)`, opacity: .95, offset: .55 },
      { transform: `translate(${dx}px,${dy}px) scale(.03)`, opacity: .15, borderRadius: '50%' }
    ], { duration: 900, easing: 'cubic-bezier(.5,.05,.3,1)' }).onfinish = () => {
      el.remove();
      cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump');
    };
  }

  window.Cart = {
    add(id, media, btn) {
      const f = items.find(i => i.id === id);
      f ? f.qty++ : items.push({ id, qty: 1 });
      save(); render(); if (media) fly(media);
      if (btn) {
        const old = btn.textContent; btn.classList.add('done'); btn.textContent = 'Added ✓';
        setTimeout(() => { btn.classList.remove('done'); btn.textContent = old; }, 1400);
      }
      toast(byId(id).name + ' added to bag');
    }
  };

  list.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const row = b.closest('.item'); const id = +row.dataset.id; const it = items.find(i => i.id === id);
    if (b.dataset.a === 'inc') it.qty++;
    if (b.dataset.a === 'dec') it.qty = Math.max(1, it.qty - 1);
    if (b.dataset.a === 'rm') {
      row.classList.add('out');
      setTimeout(() => { items = items.filter(i => i.id !== id); save(); render(); }, 330);
      return;
    }
    save(); render();
  });

  cartBtn.addEventListener('click', open);
  $('closeCart').addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => e.key === 'Escape' && close());
  $('checkoutBtn').addEventListener('click', () => {
    if (!items.length) return toast('Add a dress first');
    toast('Checkout coming soon');           // TODO: connect Razorpay / WhatsApp order here
  });
  render();
})();
