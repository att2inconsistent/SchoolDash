# SchoolDesk Seller — Dashboard Penjual

Frontend penjual untuk kantin sekolah: kelola menu, terima pesanan, dan tarik
saldo (transfer antar bank). Dibangun dengan **React 19 + JavaScript + Vite**,
gaya visual dan pola kode disamakan dengan `frontend-user`.

> ⚠️ **Ini masih frontend-only (placeholder).** Belum tersambung ke backend /
> database. Semua data disimpan di `localStorage` browser. Titik sambung
> backend sudah ditandai `TODO(backend)` di seluruh context — lihat bagian
> [Menyambungkan ke Backend](#menyambungkan-ke-backend).

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5174 (port berbeda dari frontend-user: 5173)
```

| Perintah           | Fungsi                                              |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Dev server Vite di port **5174**                    |
| `npm run build`    | Build produksi ke `dist/`                           |
| `npm run lint`     | ESLint                                              |
| `npm run preview`  | Pratinjau hasil build                              |
| `npm run smoke`    | Build + jalankan smoke test jsdom (82 asersi)       |

> Deploy: SPA fallback diperlukan — `/* /index.html 200`.

## Akun demo

| Email                  | Password     | Kantin      |
| ---------------------- | ------------ | ----------- |
| `konsinyasi@seller.test` | `password123` | Konsinyasi  |
| `jus@seller.test`        | `password123` | Kedai Jus   |

Kedua akun sudah punya menu, pesanan, saldo, dan riwayat penarikan contoh
(data seed di `src/data/seed.js`, hanya ditulis saat pertama kali dibuka).

Alur registrasi juga bisa dicoba (membuat kantin baru + verifikasi OTP).
Karena belum ada email asli, **kode OTP ditampilkan di layar** (mode demo).

## Rute

| Rute       | Halaman                     | Akses          |
| ---------- | --------------------------- | -------------- |
| `/`        | Dashboard (statistik)       | Login wajib    |
| `/menu`    | Kelola menu (CRUD + filter) | Login wajib    |
| `/pesanan` | Pesanan masuk + terima      | Login wajib    |
| `/saldo`   | Saldo, tarik dana, riwayat  | Login wajib    |
| `/profil`  | Data toko + ganti password  | Login wajib    |
| `/login`   | Masuk penjual               | Hanya tamu     |
| `/register`| Daftar kantin baru          | Hanya tamu     |
| `/otp`     | Verifikasi OTP              | Saat daftar    |

Guard memakai pola yang sama dengan `frontend-user` (`RequireAuth`,
`GuestOnly`, `OtpRoute`). Halaman auth tidak menampilkan sidebar/topbar/bottom
nav (kelas `app--auth`).

## Alur duit (inti aplikasi)

```
Pesanan "Menunggu"  --Terima Pesanan-->  Status "Selesai"
                                          └─> WalletContext.creditEarning()
                                               └─> saldo bertambah + riwayat "Dana masuk"

Tarik Dana (modal)  --validasi-->  saldo terpotong + riwayat penarikan "Selesai"
```

- **Terima pesanan** → `OrderContext.acceptOrder()` memanggil
  `WalletContext.creditEarning()` — saldo langsung naik.
- **Tarik dana** → transfer antar bank (BCA/Mandiri/BRI/BNI/BSI), divalidasi:
  nominal > 0 dan ≤ saldo, langsung berstatus **Selesai** (instan, sesuai
  keputusan desain). Riwayat tersimpan.
- **Muat pesanan contoh** (halaman Pesanan) — placeholder demo agar alur
  "pesanan masuk → terima → saldo naik" bisa ditunjukkan tanpa backend.

## Struktur

```
src/
├── App.jsx                  # Shell + rute + guard
├── main.jsx                 # Provider: Auth > Menu > Wallet > Order
├── styles/ui.css            # Elemen UI bersama (btn, card, badge, modal, dsb.)
├── lib/
│   ├── storage.js           # STORAGE_KEYS + helper baca/tulis localStorage
│   └── format.js            # formatRupiah, formatDateTime
├── data/seed.js             # Data contoh: kantin, menu, akun, pesanan, saldo
├── context/                 # ✨ semua seam backend di sini
│   ├── AuthContext.jsx      # login/register/OTP/ganti password
│   ├── MenuContext.jsx      # kantin + CRUD menu
│   ├── OrderContext.jsx     # pesanan masuk + terima pesanan
│   └── WalletContext.jsx    # saldo, dana masuk, penarikan
├── animation/               # GSAP: intro + preset easing (disalin dari user app)
└── pages/                   # Dashboard, Menu, Pesanan, Saldo, Profil (+ CSS)
    └── Component/           # Sidebar, BottomNav, Topbar, Auth, MenuFormModal
```

## Menyambungkan ke Backend

Semua komunikasi data terpusat di empat context. Halaman **tidak perlu diubah**
— cukup ganti isi fungsi di context dari `localStorage` + `setTimeout` menjadi
`fetch`/`axios`:

| Context        | Fungsi                          | Contoh endpoint (TODO di kode)              |
| -------------- | ------------------------------- | ------------------------------------------- |
| `AuthContext`  | `login`                         | `POST /api/seller/auth/login`               |
|                | `register`                      | `POST /api/seller/auth/register`            |
|                | `verifyOtp` / `resendOtp`       | `POST /api/seller/auth/verify-otp`          |
|                | `changePassword`                | `POST /api/seller/auth/change-password`     |
| `MenuContext`  | `addMenu` / `updateMenu`        | `POST/PUT /api/seller/menus`                |
|                | `removeMenu` / `toggleMenu`     | `DELETE/PATCH /api/seller/menus/:id`        |
|                | `updateVendor`                  | `PUT /api/seller/store`                     |
|                | *(foto menu)* `lib/image.js`    | `POST /api/seller/upload` (object storage)  |
| `OrderContext` | `acceptOrder`                   | `POST /api/seller/orders/:id/accept`        |
|                | `loadDemoOrders`                | hapus — pesanan asli datang dari API        |
| `WalletContext`| `creditEarning`                 | `POST /api/seller/earnings`                 |
|                | `withdraw`                      | `POST /api/seller/withdrawals`              |

Catatan untuk tim backend:

- Bentuk data (menu/vendor/pesanan) sengaja disamakan dengan `frontend-user`
  (`menuData.js`, `OrderContext`) supaya kontrak API mudah disatukan.
- Password disimpan **plaintext hanya untuk demo lokal** — di backend wajib
  di-hash (bcrypt/argon2).
- **Foto menu** saat ini di-upload dari HP/komputer, lalu disimpan sebagai
  data URL (base64) di `localStorage` dan otomatis dikompres (maks 960px,
  JPEG). Karena kuota `localStorage` terbatas, setelah backend ada: terima
  file di `POST /api/seller/upload`, simpan ke object storage, dan simpan
  hanya URL publiknya di field `image` (`src/lib/image.js` sudah ditandai).
- `frontend-user` dan `frontend-seller` berjalan di origin berbeda saat dev
  (5173 vs 5174), jadi `localStorage` tidak saling sync — sinkronisasi menu &
  pesanan antar aplikasi hanya bisa terjadi lewat backend.
- Setelah API tersambung, effect/blok pen-seedan (`ensureSeed`) dan tombol
  "Muat pesanan contoh" bisa dihapus.

## Smoke test

`scripts/smoke.mjs` (jsdom) menjalankan build produksi dan menguji alur utama:

1. Guard rute (`/`, `/saldo` tanpa login → `/login` + pesan guard)
2. Login akun demo → dashboard → terima pesanan → **saldo naik** → tarik dana
   (validasi melebihi saldo → penarikan sukses → riwayat) → logout
3. Registrasi kantin baru → OTP → dashboard kantin kosong
4. CRUD menu (tambah + **upload foto** → ubah → nonaktif → hapus + konfirmasi)
5. Filter kategori di halaman menu

Total **82 asersi**, semua lulus.

## Perbedaan dengan frontend-user

- Tanpa keranjang/pembayaran — fokus kelola toko.
- Topbar tanpa pencarian; lonceng = jumlah pesanan menunggu → halaman Pesanan.
- Sidebar/bottom nav punya item Dashboard, Menu, Pesanan, Saldo, Profil.
- Halaman Saldo memakai kartu saldo gradien + modal penarikan.

