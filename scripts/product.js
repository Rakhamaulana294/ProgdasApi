'use strict'; // Mengaktifkan mode ketat JavaScript untuk mencegah penulisan kode yang salah/error secara diam-diam

// ── 1. PROTEKSI LOGIN & LOGIKA DROPDOWN PROFIL ──

// Memeriksa status login di browser. Jika nilainya bukan "true", user dipaksa kembali ke halaman login
if (localStorage.getItem("isLoggedIn") !== "true") {
  alert("Anda harus login terlebih dahulu!"); 
  window.location.href = "login.html"; 
}

// Fungsi untuk membuka atau menutup menu dropdown profil di navbar
function toggleProfileMenu() {
  const dropdown = document.getElementById('profileDropdown'); 
  const arrow = document.getElementById('profileArrow'); 
  if (dropdown) {
    dropdown.classList.toggle('hidden'); 
  }
  if (arrow) {
    arrow.classList.toggle('rotate-180'); 
  }
}

// Fungsi untuk keluar dari akun (logout)
function logout() {
  localStorage.removeItem("isLoggedIn"); // Menghapus data status login dari memori browser
  alert("Berhasil logout!"); // Memunculkan pesan sukses logout
  window.location.href = "login.html"; // Melempar user kembali ke halaman login
}

// Event listener: Mendengarkan setiap klik di layar dokumen
window.addEventListener('click', function (e) {
  const dropdown = document.getElementById('profileDropdown');
  const button = document.getElementById('profileButton');
  const arrow = document.getElementById('profileArrow');
  
  // Jika user mengklik di luar tombol profil dan di luar menu dropdown, tutup dropdown secara otomatis
  if (dropdown && button && !button.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add('hidden');
    if (arrow) arrow.classList.remove('rotate-180'); 
  }
});


// ── 2. LOGIKA UTAMA DATA PRODUK & SUPABASE ──

// Menyimpan URL API dan Kunci Akses (Anon Key) untuk menghubungkan web dengan cloud database Supabase
const SUPABASE_URL     = 'https://gorjhwkrjggilwjhvwpx.supabase.co/rest/v1/dataproduct';
const SUPABASE_ANON_KEY = 'sb_publishable_F-m8mebvMFXS-k607AegIg_pUq04f7b';

// Pemetaan (mapping) nama kolom JavaScript dengan nama kolom asli yang ada di tabel database Supabase
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

// Fungsi mengubah angka mentah menjadi format mata uang Rupiah (Contoh: 150000 -> Rp 150.000)
function formatHarga(angka) {
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

let allProducts = []; 
let currentCategory = 'all'; 

// Fungsi pembantu untuk mengambil nilai kolom dari data produk dengan aman (jika kosong, pakai fallback/cadangan)
function col(item, key, fallback) {
  const val = item[COL[key]];
  return (val !== undefined && val !== null && val !== '') ? val : (fallback !== undefined ? fallback : '');
}

// Fungsi asinkronus untuk mengambil data produk dari database Supabase
async function fetchProducts() {
  const box = document.getElementById('output'); 
  if (!box) return; 

  // Memasukkan animasi spinner/loading ke dalam kontainer sebelum data selesai diambil
  box.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
      <svg class="animate-spin h-6 w-6 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      <span class="text-xs">Memuat produk…</span>
    </div>`;

  try {
    // Melakukan request HTTP GET ke database Supabase, diurutkan berdasarkan ID terkecil (asc)
    const res = await fetch(SUPABASE_URL + '?select=*&order=id.asc', {
      method: 'GET',
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 
        'Content-Type':  'application/json',
        'Accept':        'application/json'
      }
    });

    // Menangani error jika akses ditolak (masalah keamanan RLS di Supabase)
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Akses ditolak (${res.status}). Pastikan RLS policy sudah aktif.`);
    }
    // Menangani error jika koneksi bermasalah (status HTTP bukan 200-299)
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status} — ${msg}`);
    }

    const data = await res.json(); 
    if (!Array.isArray(data)) throw new Error('Format respons tidak valid.');

    // Jika database kosong, tampilkan ikon box kosong di layar
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
    
    // Menampilkan pesan error di layar web jika gagal mengambil data beserta tombol "Coba Lagi"
    box.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-24 gap-3">
        <p class="text-4xl">😵</p>
        <p class="text-red-400 font-semibold text-sm text-center px-4">Gagal memuat produk.</p>
        <p class="text-xs text-gray-400 text-center px-6">${escHtml(err.message)}</p>
        <button onclick="fetchProducts()" class="mt-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs rounded-xl transition-colors">Coba Lagi</button>
      </div>`;
  }
}

// Fungsi untuk menyaring produk berdasarkan kategori tombol yang diklik
function filterCategory(categoryName) {
  currentCategory = categoryName; // Memperbarui status kategori aktif

  // Mengubah gaya tampilan tombol kategori yang sedang aktif (tombol aktif jadi hitam, yang lain putih)
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-category') === categoryName) {
      btn.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
      btn.classList.add('bg-gray-900', 'text-white', 'border-gray-900');
    } else {
      btn.classList.remove('bg-gray-900', 'text-white', 'border-gray-900');
      btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
    }
  });

  // Logika pemfilteran data produk
  if (categoryName === 'all') {
    renderProducts(allProducts); // Jika klik "Semua", tampilkan seluruh data tanpa disaring
  } else {
    // Menyaring isi array produk berdasarkan kecocokan nama kategori (mengabaikan spasi dan huruf besar/kecil)
    const filtered = allProducts.filter(item => {
      const itemCat  = col(item, 'category', '').toLowerCase().replace(/\s+/g, '');
      const targetCat = categoryName.toLowerCase().replace(/\s+/g, '');
      return itemCat.includes(targetCat); // Mengembalikan produk yang kategorinya cocok
    });
    renderProducts(filtered); // Tampilkan produk hasil saringan ke layar
  }
}

// Fungsi untuk mencetak elemen HTML kartu produk ke dalam web browser
function renderProducts(data) {
  const box = document.getElementById('output'); // Mencari tempat mading produk
  if (!box) return;
  box.innerHTML = ''; // Membersihkan produk lama sebelum merender yang baru

  // Jika hasil saringan kosong, tampilkan pesan produk kosong
  if (data.length === 0) {
    box.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
        <p class="text-3xl">🔍</p>
        <p class="text-xs mt-2">Tidak ada produk dalam kategori ini.</p>
      </div>`;
    return;
  }

  // Melakukan perulangan untuk setiap data produk di dalam array
  data.forEach(function (item) {
    const price     = safePrice(col(item, 'price')); // Mengambil harga yang aman
    const name      = col(item, 'name',  'Produk Tanpa Nama'); // Mengambil nama produk
    const image     = col(item, 'image', ''); // Mengambil link gambar
    const itemId    = col(item, 'id'); // Mengambil ID produk

    const card = document.createElement('div'); // Membuat elemen kotak pembungkus produk (div)
    card.className = 'bg-white border border-gray-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200';

    // Menyuntikkan kerangka HTML kartu produk, lengkap dengan gambar, nama, format harga, dan tombol aksi
    card.innerHTML = `
      <div class="w-full h-44 flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden mb-4 p-4">
        <img src="${escHtml(image)}" alt="${escHtml(name)}" class="max-h-[140px] max-w-full object-contain mix-blend-multiply" onerror="this.src='https://placehold.co/150x150?text=No+Image'" loading="lazy">
      </div>
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <h3 class="text-xs font-medium text-gray-800 line-clamp-2 mb-1 min-h-[36px]">${escHtml(name)}</h3>
          <p class="text-sm font-bold text-gray-950 mb-4">${formatHarga(price)}</p>
        </div>
        <div class="grid grid-cols-5 gap-2">
          <button onclick="openDetail(${itemId})" class="col-span-2 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 text-center transition-colors">Detail</button>
          <button onclick="addToCart(${itemId})" class="col-span-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-medium transition-colors text-center">+ Keranjang</button>
        </div>
      </div>`;

    box.appendChild(card); 
  });
}

// Fungsi mengalihkan user ke halaman detail produk dengan membawa parameter ID di URL
function openDetail(id) {
  window.location.href = 'detail.html?id=' + id;
}

// Fungsi mengalihkan user ke halaman keranjang belanja
function openCart() {
  window.location.href = 'cart.html';
}

// Fungsi untuk memasukkan produk pilihan ke dalam keranjang belanja
function addToCart(id) {
  if (!allProducts.length) return; 

  // Mencari data barang di array produk yang ID-nya cocok dengan produk yang diklik user
  const product = allProducts.find(function (p) { return p[COL.id] == id; });
  if (!product) return;

  const name  = col(product, 'name',  'Produk Tanpa Nama');
  const price = safePrice(col(product, 'price'));
  const image = col(product, 'image', '');

  const cart  = getCart(); 
  const index = cart.findIndex(function (c) { return c.id == id; });

  if (index !== -1) {
    cart[index].qty += 1;
  } else {
    cart.push({ id: id, name: name, price: price, image: image, qty: 1 }); 
  }

  saveCart(cart);
  updateCartBadge(); 
  showToast('Produk ditambahkan ke keranjang'); 
}

// Fungsi mengambil data keranjang belanja dari localStorage (diubah kembali dari teks string menjadi Objek/Array)
function getCart() {
  try { return JSON.parse(localStorage.getItem('keranjang')) || []; }
  catch { return []; } 
}

// Fungsi menyimpan data keranjang belanja ke localStorage (diubah menjadi bentuk teks string JSON)
function saveCart(cart) {
  try { localStorage.setItem('keranjang', JSON.stringify(cart)); }
  catch (e) { console.error('[product.js] Tidak bisa menyimpan keranjang:', e); }
}

// Fungsi menghitung total kuantitas barang belanjaan dan menampilkan angkanya di badge ikon navbar
function updateCartBadge() {
  const total = getCart().reduce(function (s, i) { return s + i.qty; }, 0); // Menjumlahkan seluruh qty produk di keranjang
  const badgeNav = document.getElementById('navbar-cart-count'); // Mencari elemen angka badge di navbar
  if (badgeNav) badgeNav.textContent = total; // Mengubah angka teks badge dengan total belanjaan terbaru
}

let _toastTimer = null; // Variabel penampung timer notifikasi agar tidak bentrok
// Fungsi untuk memunculkan pesan melayang kecil (Toast notification) di bagian bawah layar
function showToast(message) {
  const toast   = document.getElementById('toast');
  const toastTx = document.getElementById('toast-text');
  if (!toast || !toastTx) return;

  toastTx.textContent = message; // Mengisi teks notifikasi
  toast.classList.remove('translate-y-24'); // Menghilangkan posisi sembunyi (turun ke bawah layar)
  toast.classList.add('translate-y-0'); // Memunculkan toast bergeser naik ke atas layar
  
  clearTimeout(_toastTimer); // Menghapus sisa timer sebelumnya jika user mengklik tombol berkali-kali secara cepat
  // Mengatur agar toast otomatis turun bersembunyi kembali setelah 2 detik (2000 ms)
  _toastTimer = setTimeout(function () {
    toast.classList.remove('translate-y-0');
    toast.classList.add('translate-y-24');
  }, 2000);
}

// Fungsi pengaman harga untuk memastikan konversi string angka dari database tidak menghasilkan error NaN/Minus
function safePrice(val) {
  const n = typeof val === 'number' ? val : parseFloat(val);
  return isFinite(n) && n >= 0 ? n : 0; // Jika bukan angka yang valid, kembalikan nilai 0
}

// Fungsi sanitasi teks (XSS Protection) untuk mengubah karakter kode HTML berbahaya menjadi teks biasa agar web tidak bisa di-hack
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Event utama: Menjalankan fungsi di bawah ini secara otomatis sesaat setelah seluruh struktur halaman web selesai dimuat sempurna
document.addEventListener('DOMContentLoaded', function () {
  updateCartBadge(); // Sinkronisasi angka keranjang belanja saat web pertama dibuka
  fetchProducts(); // Memulai proses pengambilan data produk dari cloud database Supabase
});