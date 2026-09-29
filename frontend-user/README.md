# SchoolDesk — Pesan Makanan Kantin Sekolah

Website pemesanan makanan kantin sekolah. Frontend memakai **React (JavaScript, tanpa TypeScript)** + **Vite**, transisi halaman memakai **React Router** + **GSAP**.

```bash
npm install
npm run dev      # development (http://localhost:5173)
npm run build    # build produksi ke dist/
npm run preview  # preview hasil build
npm run lint     # cek kode dengan ESLint
npm run smoke    # smoke test jsdom (build + 52 assertion)
```

---

## 1. Perpindahan halaman (routing)

Sebelumnya halaman "berpindah" dengan cara menimpa/mengganti element (`activePage`),
sehingga **URL tidak pernah berubah dan refresh browser selalu kembali ke halaman utama**.
Sekarang setiap halaman punya URL sendiri lewat `react-router-dom`:

| URL             | Halaman                          | Keterangan
|-----------------|----------------------------------|-----------
| `/`             | Beranda                          | daftar vendor
| `/menu/:id`     | Detail menu vendor               | id tidak ada → dialihkan ke `/`
| `/pesanan`      | Keranjang / pesanan saya         |
| `/topup`        | Isi saldo                        | wajib login
| `/profil`       | Profil                           | wajib login
| `/login`        | Masuk                            | hanya untuk yang belum login
| `/register`     | Daftar                           | hanya untuk yang belum login
| `/otp`          | Verifikasi OTP                   | tanpa proses daftar → kembali ke `/register`

Router didefinisikan di `src/App.jsx` (`Shell`), data vendor/menu di `src/data/menuData.js`.

### Guard halaman
- `RequireAuth` → kalau belum login, dialihkan ke `/login` dan membawa pesan + halaman tujuan.
  Setelah sukses login, user kembali ke halaman yang tadi dicoba dibuka.
- `GuestOnly` → kalau sudah login, `/login` & `/register` langsung dialihkan ke beranda.

---

## 2. Animasi (GSAP)

| File | Fungsi
|------|--------
| `src/animation/intro.js`  | Animasi pembuka saat aplikasi dimuat (sidebar slide-in, topbar turun, konten naik bertahap)
| `src/Component/Layout/PageStage.jsx` | Transisi antar halaman: halaman lama fade-out, halaman baru fade-in

Cara kerja `PageStage`: saat URL berubah, halaman lama **ditahan** selama animasi selesai
(maksimal 2 entry) sehingga transisinya benar-benar crossfade, lalu entry lama dibuang.

Prinsip performa yang dipakai (aman untuk HP kentang):
- Hanya `opacity` & `transform` yang dianimasikan → dihandle GPU, **tidak memicu layout/reflow**.
- Animasi pembuka dijalankan di `useLayoutEffect`, jadi nilai awal sudah diterapkan sebelum
  frame pertama digambar → tidak ada kedip (FOUC), tapi juga tidak memblokir.
- Inline style dibersihkan setelah animasi (`clearProps`).
- `prefers-reduced-motion: reduce` dihormati → pengguna yang minta kurangi gerakan langsung
  melihat halaman tanpa animasi.

---

## 3. Responsif (HP & PC)

| Lebar layar | Perilaku
|-------------|---------
| ≥ 768px     | Sidebar kiri (hover untuk melebar), topbar dengan pencarian
| < 768px     | Sidebar diganti **bottom nav** (Beranda / Pesanan / Profil), padding & tipografi mengecil, floating cart bar naik ke atas bottom nav

Aturan ada di `src/App.css` + media query di masing-masing CSS komponen.
Sidebar/topbar tidak pernah di-unmount, jadi state pencarian tetap hidup antar halaman.

---

## 4. Halaman profil (`src/Component/Profile/ProfilePage.jsx`)

Berisi:
- **Nama, kelas, email** (dari akun yang login)
- **Statistik**: berapa kali sudah pesan, jumlah item dibeli, total belanja
- **Riwayat pemesanan** (dari `OrderContext`) — checkout yang berhasil otomatis tercatat
- **Ganti password** (validasi password lama + konfirmasi password baru)

Checkout di `/pesanan` mewajibkan login supaya pesanan bisa masuk ke riwayat.

---

## 5. Pencarian & kategori makanan

Kolom pencarian di topbar dan tombol kategori di beranda keduanya sudah berfungsi penuh:

- Mengetik langsung memfilter (tanpa perlu Enter), **case-insensitive**, mencocokkan
  **nama kantin, tags, nama menu, dan deskripsi**.
- Hasilnya dua bagian: **"Menu Cocok"** (makanannya langsung + nama kantin + tombol
  *Lihat Menu* → `/menu/:id`) dan **daftar vendor** yang cocok (dengan badge jumlah).
- Tombol kategori (`Semua / Makanan Berat / Minuman / Cemilan / Sehat`) memfilter
  menu **dan** vendor — vendor ikut tampil kalau punya minimal satu menu di kategori itu.
- Tidak ada yang cocok → empty state + tombol **Hapus filter**; tombol *Filter* di
  header vendor juga berubah jadi *Hapus filter* saat filter sedang aktif.
- Pencarian tetap tampil di HP: di layar ≤640px kolomnya dikompakkan dan lonceng
  notifikasi disembunyikan supaya muat.

### Filter disimpan di URL query

| URL                        | Arti
|----------------------------|------
| `/?q=nasi+goreng`          | hasil pencarian "nasi goreng"
| `/?kategori=cemilan`       | kategori Cemilan
| `/?q=jus&kategori=minuman` | kombinasi keduanya

Karena filter ada di URL: **tetap tersimpan saat refresh**, bisa dibagikan ke teman,
dan tombol Back/Forward browser berfungsi. Kolom pencarian menulis ke URL dengan
`replace` supaya riwayat browser tidak dipenuhi tiap huruf yang diketik, sedangkan
klik kategori memakai `push` supaya Back bisa mengembalikan kategori sebelumnya.

### Logika filter (`src/data/menuData.js`)

- `CATEGORIES` — sumber tunggal daftar kategori (dipakai tombol & logika filter)
- setiap item menu punya field `category` (`berat` | `minuman` | `cemilan` | `sehat`)
- `filterVendors({ query, kategori })` dan `searchMenuItems({ query, kategori })` —
  fungsi murni tanpa React, dipakai `src/pages/BerandaPage.jsx` lewat `useMemo`
- UI hasil: `src/Component/Search/SearchResults.jsx`

Catatan: `PageStage` sengaja **tidak** memutar crossfade untuk perubahan yang hanya
mengganti query (ketikan search / klik kategori). Animasi hanya jalan saat `pathname`
berubah, jadi halaman tidak berkedip tiap huruf yang diketik.

---

## 6. Catatan untuk tim backend

Semua data masih **placeholder** dan disimpan di `localStorage` (hilang kalau ganti browser).
Titik-titik yang perlu diganti ke API sudah diberi komentar `TODO(backend)`:

- `src/context/AuthContext.jsx` — login, register, OTP, Google, **changePassword**
- `src/context/WalletContext.jsx` — top up QRIS
- `src/context/OrderContext.jsx` — buat & ambil riwayat pesanan
- `src/data/menuData.js` — daftar vendor & menu

> Password disimpan plaintext **hanya untuk demo lokal**. Di backend asli wajib di-hash
> (bcrypt/argon2) di server.

### Deploy
Karena memakai URL routing, hosting statis harus di-set agar semua path jatuh ke `index.html`:

- **Netlify/Static**: tambah file `public/_redirects` → `/*  /index.html  200`
- **Vercel**: tambah `vercel.json` → `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

---

## Template asli Vite

Setup minimal React + Vite dengan HMR dan beberapa aturan ESLint.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) memakai [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) memakai [SWC](https://swc.rs/)
