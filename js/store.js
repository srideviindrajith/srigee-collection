/* Products used by the storefront.
   Admin panel edits are kept in this browser (localStorage); 'Export' in the admin panel
   writes them back into js/products.js so they go live for everyone after deploy. */
(function () {
  let list = null;
  try { list = JSON.parse(localStorage.getItem('srigee_products') || 'null'); } catch (e) {}
  window.PRODUCTS = Array.isArray(list) && list.length ? list : window.DEFAULT_PRODUCTS;
})();
