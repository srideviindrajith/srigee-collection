/* Srigee admin panel (static site, no server).
   - Login is a simple client-side gate. Change ADMIN_PASSWORD below.
   - Products are stored in this browser (localStorage). Use "Export for Deploy" to publish them. */
(function () {
  const ADMIN_PASSWORD = 'srigee@123';      // <-- change this
  const KEY = 'srigee_products';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

  let products = JSON.parse(JSON.stringify(window.PRODUCTS));
  let editingId = null, currentImg = '';

  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(products)); }
    catch (e) { toast('Storage full – use smaller photos or export now'); }
    render();
  }

  // ---------- login ----------
  function showApp() { $('login').hidden = true; $('app').hidden = false; render(); }
  if (sessionStorage.getItem('srigee_admin') === '1') showApp();
  $('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    if ($('pw').value === ADMIN_PASSWORD) { sessionStorage.setItem('srigee_admin', '1'); showApp(); }
    else $('loginErr').textContent = 'Wrong password';
  });
  $('logout').addEventListener('click', () => { sessionStorage.removeItem('srigee_admin'); location.reload(); });

  // ---------- list ----------
  function render() {
    const q = $('search').value.trim().toLowerCase();
    const cats = new Set(products.map(p => p.cat));
    $('stats').innerHTML = [
      [products.length, 'Products'], [cats.size, 'Categories'],
      [products.filter(p => p.old && p.old > p.price).length, 'On sale'],
      [products.filter(p => p.stock === false).length, 'Sold out']
    ].map(([n, l]) => `<div class="stat"><strong>${n}</strong><span>${l}</span></div>`).join('');
    $('catList').innerHTML = [...cats].map(c => `<option value="${esc(c)}">`).join('');

    const list = products.filter(p => !q || (p.name + ' ' + p.cat).toLowerCase().includes(q));
    $('rows').innerHTML = list.length ? list.map(p => `
      <tr data-id="${p.id}">
        <td><div class="thumb">${p.img ? `<img src="${esc(p.img)}" alt="" onerror="this.remove()">` : 'No photo'}</div></td>
        <td><div class="pname">${esc(p.name)}</div>${p.badge ? `<small style="color:#d4a24c">${esc(p.badge)}</small>` : ''}</td>
        <td>${esc(p.cat)}</td>
        <td>${fmt(p.price)}${p.old ? `<span class="old">${fmt(p.old)}</span>` : ''}</td>
        <td><span class="pill ${p.stock === false ? 'out' : 'in'}">${p.stock === false ? 'Sold out' : 'In stock'}</span></td>
        <td><div class="row-actions"><button data-a="edit">Edit</button><button class="del" data-a="del">Delete</button></div></td>
      </tr>`).join('') : '<tr><td colspan="6" class="empty">No products found.</td></tr>';
  }
  $('search').addEventListener('input', render);
  $('rows').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = +b.closest('tr').dataset.id;
    if (b.dataset.a === 'edit') openModal(id);
    if (b.dataset.a === 'del' && confirm('Delete this product?')) { products = products.filter(p => p.id !== id); save(); toast('Product deleted'); }
  });

  // ---------- add / edit ----------
  function setPreview(src) { currentImg = src || ''; $('preview').innerHTML = src ? `<img src="${esc(src)}" alt="">` : 'No photo'; }
  function openModal(id) {
    editingId = id || null;
    const p = products.find(x => x.id === id) || { name: '', cat: '', price: '', old: '', badge: '', stock: true, img: '' };
    $('mTitle').textContent = id ? 'Edit Product' : 'Add Product';
    $('fName').value = p.name; $('fCat').value = p.cat; $('fPrice').value = p.price; $('fOld').value = p.old || '';
    $('fBadge').value = p.badge || ''; $('fStock').value = p.stock === false ? '0' : '1';
    $('fFile').value = ''; $('fImg').value = p.img && !p.img.startsWith('data:') ? p.img : '';
    setPreview(p.img); $('modal').hidden = false;
  }
  $('addBtn').addEventListener('click', () => openModal(null));
  $('cancel').addEventListener('click', () => $('modal').hidden = true);
  $('modal').addEventListener('mousedown', e => { if (e.target === $('modal')) $('modal').hidden = true; });

  $('fImg').addEventListener('input', e => setPreview(e.target.value.trim()));
  $('fFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => {
      const max = 1200, sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); $('fImg').value = '';
      setPreview(c.toDataURL('image/jpeg', 0.85));
    };
    img.src = url;
  });

  $('form').addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      name: $('fName').value.trim(), cat: $('fCat').value.trim(),
      price: +$('fPrice').value, old: +$('fOld').value || 0,
      badge: $('fBadge').value.trim(), stock: $('fStock').value === '1',
      img: currentImg
    };
    if (editingId) { const i = products.findIndex(p => p.id === editingId); products[i] = { ...products[i], ...data }; }
    else products.push({ id: Math.max(0, ...products.map(p => p.id)) + 1, ...data });
    $('modal').hidden = true; save(); toast(editingId ? 'Product updated' : 'Product added');
  });

  // ---------- export / import / reset ----------
  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = content.startsWith('data:') ? content : URL.createObjectURL(new Blob([content], { type: type || 'text/plain' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  $('exportJs').addEventListener('click', () => {
    const out = products.map(p => {
      const q = { ...p };
      if (q.img && q.img.startsWith('data:')) { download('p' + q.id + '.jpg', q.img); q.img = 'assets/products/p' + q.id + '.jpg'; }
      return q;
    });
    download('products.js', '// Exported from the Srigee admin panel\nwindow.DEFAULT_PRODUCTS = ' + JSON.stringify(out, null, 2) + ';\n', 'text/javascript');
    toast('Downloaded products.js (+ photos)');
  });
  $('exportJson').addEventListener('click', () => { download('srigee-products-backup.json', JSON.stringify(products, null, 2), 'application/json'); toast('Backup downloaded'); });
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => {
      try { const d = JSON.parse(t); if (!Array.isArray(d)) throw 0; products = d; save(); toast('Imported ' + d.length + ' products'); }
      catch (err) { toast('Invalid JSON file'); }
    });
    e.target.value = '';
  });
  $('reset').addEventListener('click', () => {
    if (!confirm('Reset all products to the default list?')) return;
    localStorage.removeItem(KEY); products = JSON.parse(JSON.stringify(window.DEFAULT_PRODUCTS)); render(); toast('Reset done');
  });
})();
