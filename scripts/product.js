'use strict'; 

// ── 1. PROTEKSI LOGIN ──
if (localStorage.getItem("isLoggedIn") !== "true") {
  alert("Anda harus login terlebih dahulu!"); 
  window.location.href = "login.html"; 
}

function logout() {
  localStorage.removeItem("isLoggedIn"); 
  alert("Berhasil logout!"); 
  window.location.href = "login.html"; 
}

// ── 2. KONFIGURASI SUPABASE ──
const SUPABASE_URL      = 'https://gorjhwkrjggilwjhvwpx.supabase.co/rest/v1/dataproduct';
const SUPABASE_ANON_KEY = 'sb_publishable_F-m8mebvMFXS-k607AegIg_pUq04f7b';

const COL = {
  id:          'id',
  name:        'name',    
  price:       'price',
  image:       'image',
  category:    'category',
  description: 'description', 
  rating:      'rating',
  stock:       'stok',
};

function formatHarga(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

let allProducts = []; 
let currentCategory = 'all'; 

function col(item, key, fallback) {
  const val = item[COL[key]];
  return (val !== undefined && val !== null && val !== '') ? val : (fallback !== undefined ? fallback : '');
}

// ── 3. AMBIL DATA DARI SUPABASE ──
async function fetchProducts() {
  const box = document.getElementById('output'); 
  if (!box) return; 

  box.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
      <svg class="animate-spin h-6 w-6 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      <span class="text-xs">Memuat produk…</span>
    </div>`;

  try {
    const res = await fetch(SUPABASE_URL + '?select=*&order=id.asc', {
      method: 'GET',
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 
        'Content-Type':  'application/json',
        'Accept':        'application/json'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json(); 
    if (!Array.isArray(data)) throw new Error('Format respons tidak valid.');

    if (data.length === 0) {
      box.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
          <p class="text-4xl">📦</p>
          <p class="text-sm font-medium">Tidak ada produk ditemukan.</p>
        </div>`;
      return;
    }

    allProducts = data; 
    filterCategory('all'); 

  } catch (err) {
    console.error('[product.js] fetchProducts gagal:', err); 
    box.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-24 gap-3">
        <p class="text-4xl">😵</p>
        <p class="text-red-400 font-semibold text-sm text-center px-4">Gagal memuat produk.</p>
        <button onclick="fetchProducts()" class="mt-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs rounded-xl transition-colors">Coba Lagi</button>
      </div>`;
  }
}

// ── 4. FILTER KATEGORI ──
function filterCategory(categoryName) {
  currentCategory = categoryName; 
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-category') === categoryName) {
      btn.classList.remove('bg-white', 'text-gray-600', 'border-gray-200', 'hover:bg-gray-50');
      btn.classList.add('bg-gray-900', 'text-white', 'border-gray-900');
    } else {
      btn.classList.remove('bg-gray-900', 'text-white', 'border-gray-900');
      btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:bg-gray-50');
    }
  });

  if (categoryName === 'all') {
    renderProducts(allProducts); 
  } else {
    const filtered = allProducts.filter(item => {
      const itemCat  = col(item, 'category', '').toLowerCase().replace(/\s+/g, '');
      const targetCat = categoryName.toLowerCase().replace(/\s+/g, '');
      return itemCat.includes(targetCat); 
    });
    renderProducts(filtered); 
  }
}

// ── 5. RENDER KARTU PRODUK ──
function renderProducts(data) {
  const box = document.getElementById('output'); 
  if (!box) return;
  box.innerHTML = ''; 

  if (data.length === 0) {
    box.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
        <p class="text-3xl">🔍</p>
        <p class="text-xs mt-2">Tidak ada produk dalam kategori ini.</p>
      </div>`;
    return;
  }

  data.forEach(function (item) {
    const price     = safePrice(col(item, 'price')); 
    const name      = col(item, 'name',  'Produk Tanpa Nama'); 
    const image     = col(item, 'image', ''); 
    const itemId    = col(item, 'id'); 

    const card = document.createElement('div'); 
    card.className = 'bg-white border border-gray-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200';

    card.innerHTML = `
      <div class="w-full h-44 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden mb-4 p-2">
        <img src="${escHtml(image)}" alt="${escHtml(name)}" class="max-h-[140px] max-w-full object-contain mix-blend-multiply" onerror="this.src='https://placehold.co/150x150?text=No+Image'" loading="lazy">
      </div>
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <h3 class="text-xs font-medium text-gray-800 line-clamp-2 mb-1 min-h-[36px]">${escHtml(name)}</h3>
          <p class="text-sm font-bold text-gray-950 mb-4">${formatHarga(price)}</p>
        </div>
        <div class="grid grid-cols-5 gap-2">
          <button onclick="openDetail(${itemId})" class="col-span-2 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-medium text-gray-600 text-center transition-colors">Detail</button>
          <button onclick="addToCart(${itemId})" class="col-span-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[11px] font-medium transition-colors text-center">+ Keranjang</button>
        </div>
      </div>`;

    box.appendChild(card); 
  });
}

// ── 6. LOGIKA POPUP DETAIL MODAL ──
function openDetail(id) {
  const product = allProducts.find(p => col(p, 'id') == id);
  if (!product) return;

  const modal = document.getElementById('popup');
  const detailBox = document.getElementById('detail');
  if (!modal || !detailBox) return;

  detailBox.innerHTML = `
    <button onclick="closeDetailModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-lg">✕</button>
    <div class="flex flex-col md:flex-row gap-6 mt-4">
      <div class="w-full md:w-1/2 h-52 bg-gray-50 flex items-center justify-center rounded-xl overflow-hidden p-2">
        <img src="${escHtml(col(product, 'image'))}" class="max-h-[180px] object-contain mix-blend-multiply" onerror="this.src='https://placehold.co/150x150?text=No+Image'">
      </div>
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <span class="text-[10px] bg-gray-100 px-2 py-1 rounded-md font-bold uppercase tracking-wider text-gray-500">${escHtml(col(product, 'category', 'General'))}</span>
          <h2 class="text-base font-bold text-gray-900 mt-2">${escHtml(col(product, 'name'))}</h2>
          <p class="text-lg font-extrabold text-gray-900 mt-1">${formatHarga(safePrice(col(product, 'price')))}</p>
          <p class="text-xs text-gray-500 mt-3 leading-relaxed">${escHtml(col(product, 'description', 'Tidak ada deskripsi.'))}</p>
        </div>
        <button onclick="addToCart(${id}); closeDetailModal();" class="w-full mt-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-colors">Tambah ke Keranjang</button>
      </div>
    </div>`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeDetailModal() {
  const modal = document.getElementById('popup');
  if (modal) {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
  }
}

// ── 7. FIX: FUNGSI PINDAH KE HALAMAN CART.HTML ──
function openCart() {
  window.location.href = 'cart.html'; // Melempar langsung ke halaman full cart.html
}

function addToCart(id) {
  if (!allProducts.length) return; 

  const product = allProducts.find(p => col(p, 'id') == id);
  if (!product) return;

  const cart  = getCart(); 
  const index = cart.findIndex(c => c.id == id);

  if (index !== -1) {
    cart[index].qty += 1;
  } else {
    cart.push({ 
      id: id, 
      name: col(product, 'name', 'Produk Tanpa Nama'), 
      price: safePrice(col(product, 'price')), 
      image: col(product, 'image'), 
      qty: 1 
    }); 
  }

  saveCart(cart);
  updateCartBadge(); 
  showToast('Produk dimasukkan ke keranjang'); 
}

function getCart() {
  try { return JSON.parse(localStorage.getItem('keranjang')) || []; }
  catch { return []; } 
}

function saveCart(cart) {
  try { localStorage.setItem('keranjang', JSON.stringify(cart)); }
  catch (e) { console.error(e); }
}

function updateCartBadge() {
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  const badgeNav = document.getElementById('navbar-cart-count');
  if (badgeNav) badgeNav.textContent = total;
}

let _toastTimer = null;
function showToast(message) {
  const toast   = document.getElementById('toast');
  const toastTx = document.getElementById('toast-text');
  if (!toast || !toastTx) return;

  toastTx.textContent = message;
  toast.classList.remove('translate-y-24');
  toast.classList.add('translate-y-0');
  
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () {
    toast.classList.remove('translate-y-0');
    toast.classList.add('translate-y-24');
  }, 2000);
}

function safePrice(val) {
  const n = typeof val === 'number' ? val : parseFloat(val);
  return isFinite(n) && n >= 0 ? n : 0;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', function () {
  updateCartBadge(); 
  fetchProducts(); 
});