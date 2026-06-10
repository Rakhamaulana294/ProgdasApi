'use strict';

let user = [];

// 1. Ambil data user dari file json dengan pengaman (Try-Catch)
async function ambildata() {
  try {
    let response = await fetch("user.json"); 
    if (!response.ok) throw new Error("File user.json tidak merespon");
    user = await response.json();
  } catch (error) {
    // Jika eror, biarkan array tetap kosong agar tidak merusak fungsi login utama
    console.warn("Info: user.json tidak terbaca atau belum dibuat, menggunakan akun admin lokal.");
    user = []; 
  }
}

// Jalankan pengambilan data secara otomatis saat file JS dimuat
ambildata();

// 2. Fungsi utama penanganan login
async function login() {
  const messageDiv = document.getElementById('message');
  if (messageDiv) messageDiv.innerHTML = ""; // Bersihkan pesan eror lama

  // Jaga-jaga jika proses async ambildata belum selesai saat tombol diklik
  if (user.length === 0) {
    await ambildata();
  }
  
  const emailInput = document.getElementById("email").value.trim();
  const passwordInput = document.getElementById("password").value.trim();
  let ditemukan = false;

  // Validasi Input Kosong
  if (!emailInput || !passwordInput) {
    if (messageDiv) {
      messageDiv.innerHTML = "<span class='text-red-500 text-xs font-medium'>Email dan Password tidak boleh kosong!</span>";
    }
    return;
  }

  // A. Pengecekan Akun Utama/Admin Manual (PASTI JALAN)
  if (emailInput === "admin" && passwordInput === "123") {
    ditemukan = true;
  } 
  // B. Pengecekan Akun dari database JSON (Hanya dicek jika array JSON ada isinya)
  else if (user && user.length > 0) {
    for (let i = 0; i < user.length; i++) {
      if (user[i] && user[i].email === emailInput && user[i].password === passwordInput) {
         ditemukan = true;
         break;
      }
    }
  }

  // 3. Aksi penentuan setelah pengecekan status login
  if (ditemukan) {
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "index.html"; // Berpindah ke home utama
  } else {
    if (messageDiv) {
      messageDiv.innerHTML = "<span class='text-red-500 text-xs font-medium'>Email atau Password salah!</span>";
    }
  }
}

// 4. Otomatisasi Tombol Enter pada Form Login
document.addEventListener('DOMContentLoaded', function() {
  const emailField = document.getElementById("email");
  const passwordField = document.getElementById("password");

  const handleEnter = function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      login();
    }
  };

  if (emailField) emailField.addEventListener("keydown", handleEnter);
  if (passwordField) passwordField.addEventListener("keydown", handleEnter);
});