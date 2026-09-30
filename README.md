# SchoolDesk — Pesan Makanan Kantin Sekolah

Aplikasi web pemesanan makanan kantin sekolah. Siswa bisa melihat menu, mencari &
memilih makanan, memesan, dan memantau status pesanan tanpa mengantre lama;
penjual bisa mengelola menu, menerima pesanan, dan menarik hasil penjualan.

Saat ini repo ini berisi **dua aplikasi frontend** (React + Vite) yang masih
menyimpan data di `localStorage`, dengan penanda `TODO(backend)` di setiap titik
yang nanti disambungkan ke backend.

## Struktur repo

```
reak/
├── frontend-user/      # Aplikasi pembeli (siswa)      → http://localhost:5173
├── frontend-seller/    # Dashboard penjual             → http://localhost:5174
├── BRD.md              # Business Requirements Doc: alur lama vs alur yang diinginkan
├── PRD.md              # Product Requirements Doc: fitur & kebutuhan aplikasi
├── SRS.md              # Software Requirements Spec: rancangan fitur & alur data
└── README.md           # File ini
```

## Dokumen referensi

| Dokumen | Isi |
| --- | --- |
| [BRD.md](BRD.md) | Masalah saat ini (antrean panjang, pencatatan manual) dan alur yang diinginkan |
| [PRD.md](PRD.md) | Fitur yang dibangun: login, daftar menu, pemesanan, keranjang, status pesanan |
| [SRS.md](SRS.md) | Spesifikasi sistem, rancangan alur tiap fitur, input/output, alur data |

---

## frontend-user — Aplikasi Pembeli

Halaman siswa untuk menjelajah menu dan memesan makanan.

**Fitur**

- Beranda dengan daftar kantin/vendor
- Pencarian & filter kategori makanan
- Halaman menu per kantin, tambah ke keranjang, jumlah item
- Keranjang (tersimpan saat refresh/pindah halaman) & pemesanan
- Halaman "Pesanan saya" beserta status pesanan
- Top-up saldo dengan QR code QRIS (demo), profil, ganti password
- Login / register / OTP, animasi transisi halaman (GSAP)
- Responsif untuk HP dan PC

**Menjalankan**

```bash
cd frontend-user
npm install
npm run dev        # http://localhost:5173
```

**Script lain**

```bash
npm run lint       # ESLint
npm run smoke      # build + smoke test jsdom (52 asersi)
```

Detail: [`frontend-user/README.md`](frontend-user/README.md)

---

## frontend-seller — Dashboard Penjual

Halaman penjual untuk mengurus menu dan pesanan masuk.

**Fitur**

- Login / registrasi kantin baru + verifikasi OTP
- CRUD menu: tambah, ubah, aktif/nonaktif, hapus — harga bebas berapa pun rupiah
- **Upload foto menu** (file, bukan URL — otomatis dikompres)
- Daftar pesanan masuk: terima / proses / selesai
- Saldo penjualan bertambah saat pesanan diterima
- Penarikan dana instan ke bank (BCA, Mandiri, BRI, BNI, BSI) + riwayat penarikan
- Halaman profil kantin

**Menjalankan**

```bash
cd frontend-seller
npm install
npm run dev        # http://localhost:5174
```

**Script lain**

```bash
npm run lint       # ESLint
npm run smoke      # build + smoke test jsdom (82 asersi)
```

**Akun demo** (password: `password123`)

| Email | Keterangan |
| --- | --- |
| `konsinyasi@seller.test` | Kantin contoh 1 |
| `jus@seller.test` | Kantin contoh 2 |

Detail: [`frontend-seller/README.md`](frontend-seller/README.md)

---

## Menjalankan keduanya berdampingan

Buka dua terminal (port sudah dibedakan agar tidak bentrok):

```bash
# Terminal 1
cd frontend-user && npm run dev      # http://localhost:5173

# Terminal 2
cd frontend-seller && npm run dev    # http://localhost:5174
```

## Status & catatan penting

- **Frontend-only.** Semua data (akun, menu, pesanan, saldo) disimpan di
  `localStorage` masing-masing browser.
- **Dua origin terpisah** (port beda), jadi data `frontend-user` dan
  `frontend-seller` **belum saling tersinkron** — sinkronisasi menunggu backend.
- Setiap penyimpanan/pengambilan data punya penanda **`TODO(backend)`** beserta
  endpoint yang disarankan, agar tim backend tinggal mengganti antrean pemanggilan.
- **Password disimpan plaintext hanya untuk demo lokal.** Backend wajib
  meng-hash password (bcrypt/argon2).
- Untuk deploy, SPA butuh fallback rule: `/* /index.html 200`.

## Teknologi

- React 19 + Vite, JavaScript (bukan TypeScript)
- React Router 7 — routing
- GSAP — animasi transisi halaman
- ESLint — linting
- jsdom — smoke test untuk alur utama tiap aplikasi
