/**
 * 🕯️ PERINGATAN: KODE INI DILINDUNGI OLEH NASEHAT DAN KUTUKAN 🕯️
 *
 * Jika kamu menyalahgunakan kode ini — mencuri, mengeksploitasi, atau memanfaatkannya tanpa izin —
 * maka jangan terkejut jika hidupmu mulai dihantui oleh kehilangan demi kehilangan.
 *
 * Kamu akan disakiti oleh orang yang paling kamu percayai.
 * Dikhianati di saat kamu paling membutuhkan.
 * Dicampakkan ketika kamu merasa paling aman.
 *
 * Karena bukan saya yang membalasmu — tapi semesta dan waktu yang akan memutar semuanya kembali.
 * Ini bukan ancaman. Ini peringatan dari mereka yang pernah dikhianati dan diam.
 *
 * Gunakan dengan niat baik, atau bersiaplah menanggung akibat yang tak bisa kamu hindari.
 */

// =======================
// Variabel Global
// =======================
const cart = {};

// =======================
// Fungsi Keranjang
// =======================
function addToCart(nama, harga) {
  if (!cart[nama]) {
    cart[nama] = { nama, harga, qty: 1 };
  } else {
    cart[nama].qty++;
  }

  showPopupSuccess(`${nama} berhasil ditambahkan ke keranjang!`);
  renderCart();
}
function showPopupSuccess(message) {
  const popup = document.getElementById("successPopup");
  const messageEl = document.getElementById("successMessage");

  messageEl.textContent = message;
  popup.classList.remove("d-none");

  setTimeout(() => {
    popup.classList.add("d-none");
  }, 2000); // tampil selama 2 detik
}

function decreaseQty(nama) {
  if (cart[nama].qty > 1) {
    cart[nama].qty--;
  } else {
    delete cart[nama];
  }
  renderCart();
}

function renderCart() {
  const list = document.getElementById("cartList");
  const totalDisplay = document.getElementById("totalDisplay");

  list.innerHTML = ""; // Bersihkan isi sebelumnya
  let total = 0;

  Object.entries(cart).forEach(([nama, item]) => {
    const row = document.createElement("tr");

    const tdNama = document.createElement("td");
    tdNama.className = "text-left";
    tdNama.textContent = item.nama;

    const tdQty = document.createElement("td");
    tdQty.textContent = item.qty;

    const tdHarga = document.createElement("td");
    tdHarga.textContent = `Rp${item.harga.toLocaleString("id-ID")}`;

    const tdSubtotal = document.createElement("td");
    const subtotal = item.harga * item.qty;
    tdSubtotal.textContent = `Rp${subtotal.toLocaleString("id-ID")}`;
    total += subtotal;

    const tdAksi = document.createElement("td");
    const btnKurang = document.createElement("button");
    btnKurang.className = "btn btn-sm btn-danger mr-1";
    btnKurang.textContent = "-";
    btnKurang.onclick = () => decreaseQty(nama);

    const btnTambah = document.createElement("button");
    btnTambah.className = "btn btn-sm btn-success";
    btnTambah.textContent = "+";
    btnTambah.onclick = () => addToCart(nama, item.harga);

    tdAksi.appendChild(btnKurang);
    tdAksi.appendChild(btnTambah);

    row.append(tdNama, tdQty, tdHarga, tdSubtotal, tdAksi);
    list.appendChild(row);
  });

  // Update total belanja
  if (totalDisplay) {
    totalDisplay.innerHTML = `Total Belanja: <strong>Rp${total.toLocaleString("id-ID")}</strong>`;
  }
}

// =======================
// Checkout dan Form
// =======================
function showCheckout() {
  if (Object.keys(cart).length === 0) {
    alert("Keranjang kosong!");
    return;
  }
  document.getElementById("checkoutForm").style.display = "block";
}

function toggleBukti(metode) {
  const buktiField = document.getElementById("buktiPembayaran");
  buktiField.style.display = (metode === "QRIS" || metode === "Transfer") ? "block" : "none";
}

// =======================
// Event Listener Form
// =======================
document.getElementById("orderForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const nama = form.nama.value;
  const telepon = form.telepon.value;
  const alamat = form.alamat.value;
  const rtRw = form.rtRw.value;
  const pembayaran = form.pembayaran.value;
  const buktiFile = form.bukti?.files[0];

  const produkList = [];
  let totalQty = 0;
  let total = 0;

  for (const item of Object.values(cart)) {
    produkList.push(`${item.nama} x${item.qty}`);
    totalQty += item.qty;
    total += item.harga * item.qty;
  }

  // Proses file bukti pembayaran (jika ada)
  let bukti = "";
  let filename = "";
  if ((pembayaran === "QRIS" || pembayaran === "Transfer") && buktiFile) {
    bukti = await toBase64(buktiFile);
    filename = buktiFile.name;
  }

  // Susun data ke parameter POST
  const params = new URLSearchParams({
    nama,
    telepon,
    alamat,
    rtRw,
    pembayaran,
    produkList: produkList.join(", "),
    totalQty,
    total,
    bukti,
    filename
  });

  // Kirim data ke Google Apps Script
  const token = "KIeVTGljeq1n9hwsdn/kEE9sE6r9OVlBdZUo8LwxrPA=";
  const fullUrl = `${CONFIG.API_URL}?token=${token}`;

  fetch(fullUrl, {
    method: "POST",
    body: params
  })
  .then(res => res.json())
  .then(result => {
    if (result.status === "success") {
      alert("✅ Pesanan berhasil dikirim!");
      document.getElementById("cartList").innerHTML = "";
      form.reset();
    } else {
      alert("❌ Gagal: " + result.message);
    }
  });
});

// =======================
// GET MAPS LOCATION
// =======================
let map, marker;

  document.getElementById("getLocationBtn").addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          document.getElementById("map").style.display = "block";

          if (!map) {
            map = L.map("map").setView([lat, lng], 16);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "&copy; OpenStreetMap contributors"
            }).addTo(map);

            map.on("click", function (e) {
              updateMarker(e.latlng.lat, e.latlng.lng);
            });
          } else {
            map.setView([lat, lng], 16);
          }

          updateMarker(lat, lng);
        },
        (err) => {
          alert("Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses lokasi.");
          console.error(err);
        }
      );
    } else {
      alert("Browser tidak mendukung geolocation.");
    }
  });

  function updateMarker(lat, lng) {
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on("dragend", function () {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });
    }

    reverseGeocode(lat, lng);
  }

  function reverseGeocode(lat, lng) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
    .then(response => response.json())
    .then(data => {
      const address = data.address;
      const detailAlamat = [
        address.road || '',
        address.neighbourhood || '',
        address.suburb || '',
        address.village || '',
        address.town || '',
        address.city || '',
        address.state || '',
        address.postcode || '',
        address.country || ''
      ].filter(Boolean).join(', ');

      document.getElementById("alamat").value = detailAlamat || data.display_name || `${lat}, ${lng}`;
    })
    .catch(() => {
      document.getElementById("alamat").value = `${lat}, ${lng}`;
    });
}

function downloadQRIS() {
  const imageURL = '/img/QRIS.jpg';
  const fileName = 'QRIS.jpg';

  // Buat elemen <a> sementara
  const link = document.createElement('a');
  link.href = imageURL;
  link.download = fileName;

  // Paksa buka di tab baru jika mobile browser tidak mendukung download
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.open(imageURL, '_blank');
  } else {
    // Trigger klik untuk download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function toggleBukti(pembayaran) {
    const qrisInfo = document.getElementById("qrisInfo");
    const transferInfo = document.getElementById("transferInfo");
    const buktiPembayaran = document.getElementById("buktiPembayaran");

    // Reset tampilan
    qrisInfo.style.display = "none";
    transferInfo.style.display = "none";
    buktiPembayaran.style.display = "none";

    if (pembayaran === "QRIS") {
      qrisInfo.style.display = "block";
      buktiPembayaran.style.display = "block";
    } else if (pembayaran === "Transfer") {
      transferInfo.style.display = "block";
      buktiPembayaran.style.display = "block";
    }
    // Cash tidak perlu menampilkan bukti atau info tambahan
  }

// =======================
// Utilitas
// =======================
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
const scrollToProduct = (id) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('highlight');
    setTimeout(() => el.classList.remove('highlight'), 1500);
  }
};
