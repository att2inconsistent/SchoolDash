/**
 * Smoke test (jsdom) untuk frontend-seller.
 * Jalankan:  npm run smoke   (vite build && node scripts/smoke.mjs)
 *
 * Menguji alur utama penjual:
 *   guard login, login akun demo, terima pesanan -> saldo naik,
 *   tarik dana (valid & melebihi saldo), registrasi + OTP,
 *   CRUD menu, filter kategori, muat pesanan contoh, logout.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const distDir = path.join(root, "dist");

const html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
const srcMatch = html.match(/<script[^>]+src="([^"]+)"/);
if (!srcMatch) throw new Error("bundle script tidak ditemukan di dist/index.html");
const bundleHref =
  pathToFileURL(path.join(distDir, srcMatch[1].replace(/^\/+/, ""))).href;

let pass = 0;
let fail = 0;
function check(cond, label, extra = "") {
  if (cond) {
    pass++;
    console.log(`   ok   ${label}`);
  } else {
    fail++;
    console.log(`   FAIL ${label}${extra ? ` -> ${extra}` : ""}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let bootCount = 0;
async function boot(url) {
  bootCount++;
  const problems = [];
  const vc = new VirtualConsole();
  vc.on("error", (...args) => problems.push("console.error: " + args.join(" ")));
  vc.on("jsdomError", (e) => problems.push("jsdomError: " + (e && e.message)));
  vc.on("warn", (...args) => problems.push("console.warn: " + args.join(" ")));

  const dom = new JSDOM(html, {
    url,
    pretendToBeVisual: true,
    runScripts: "outside-only",
    virtualConsole: vc,
  });
  const w = dom.window;

  w.matchMedia = (media) => ({
    matches: false,
    media,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  });
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = function () {};

  const expose = [
    "window",
    "document",
    "navigator",
    "location",
    "history",
    "localStorage",
    "sessionStorage",
    "HTMLElement",
    "HTMLInputElement",
    "HTMLSelectElement",
    "HTMLTextAreaElement",
    "HTMLButtonElement",
    "HTMLDivElement",
    "HTMLAnchorElement",
    "HTMLFormElement",
    "SVGElement",
    "Element",
    "Node",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "CustomEvent",
    "FocusEvent",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "DOMRect",
    "DocumentFragment",
    "MutationObserver",
    "CSSStyleDeclaration",
    "NodeList",
    "FileReader",
    "FormData",
    "Image",
  ];
  for (const key of expose) {
    if (!(key in w)) continue;
    const value = w[key];
    try {
      Object.defineProperty(globalThis, key, {
        value: typeof value === "function" && key !== "window" ? value.bind(w) : value,
        writable: true,
        configurable: true,
        enumerable: false,
      });
    } catch {
      /* abaikan kalau global tidak bisa diganti */
    }
  }

  // cache-buster supaya tiap case mendapat salinan modul yang segar
  await import(`${bundleHref}?case=${bootCount}`);
  await sleep(900); // tunggu animasi intro selesai

  return { dom, w, problems };
}

function q(doc, sel) {
  return doc.querySelector(sel);
}
function qa(doc, sel) {
  return [...doc.querySelectorAll(sel)];
}
function text(doc, sel) {
  const el = q(doc, sel);
  return el ? el.textContent.trim() : null;
}
function bodyText(doc) {
  return doc.body.textContent.replace(/\s+/g, " ");
}
function typeInto(w, input, value) {
  // Ambil setter dari prototype milik elemennya sendiri
  // (input, textarea, atau select — semuanya punya properti `value`).
  const proto = Object.getPrototypeOf(input);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter.call(input, value);
  input.dispatchEvent(new w.Event("input", { bubbles: true }));
}
function setSelect(w, select, value) {
  const setter = Object.getOwnPropertyDescriptor(
    w.HTMLSelectElement.prototype,
    "value"
  ).set;
  setter.call(select, value);
  select.dispatchEvent(new w.Event("change", { bubbles: true }));
}
function click(w, el) {
  el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
}
/** Submit form persis seperti user menekan tombol (jsdom tak navigasi). */
function submit(w, form) {
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
}
function sidebarBtn(doc, label) {
  return qa(doc, ".sidebar-item").find((b) =>
    b.textContent.includes(label)
  );
}
function statValue(doc, label) {
  const card = qa(doc, ".stat-card").find((c) =>
    (q(c, ".stat-card-label")?.textContent || "").includes(label)
  );
  return card ? card.querySelector(".stat-card-value")?.textContent.trim() : null;
}
function reportProblems(problems) {
  const bad = problems.filter((p) => /error|warning/i.test(p));
  check(bad.length === 0, "tanpa error/warning console", bad.join(" | "));
}
/** Cari ulang kartu pesanan berdasar ID (elemennya bisa diganti React). */
function orderCard(doc, id) {
  return qa(doc, ".order-card").find((c) =>
    (q(c, ".order-card-id")?.textContent || "").trim() === id
  );
}

async function login(w, doc, email, password) {
  typeInto(w, q(doc, "#email"), email);
  typeInto(w, q(doc, "#password"), password);
  submit(w, q(doc, "form"));
  await sleep(900);
}

/* ------------------------------------------------------------------ */
console.log("\n[1] Buka / tanpa login -> dialihkan ke /login");
{
  const { dom, w, problems } = await boot("http://localhost/");
  const doc = w.document;

  check(w.location.pathname === "/login", "redirect ke /login", w.location.pathname);
  check(!!q(doc, ".auth-layout"), "halaman auth tampil");
  check(
    bodyText(doc).includes("Masuk sebagai Penjual"),
    "judul login penjual"
  );
  check(!!q(doc, ".auth-demo-box"), "kotak akun demo tampil");
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[2] Buka /saldo & /menu tanpa login -> pesan guard tampil");
{
  const { dom, w, problems } = await boot("http://localhost/saldo");
  const doc = w.document;
  check(w.location.pathname === "/login", "/saldo dilempar ke /login", w.location.pathname);
  check(
    bodyText(doc).includes("Silakan login untuk membuka dashboard penjual"),
    "pesan guard tampil di halaman login",
    bodyText(doc).slice(0, 120)
  );
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[3] Login akun demo -> dashboard -> terima pesanan -> tarik dana");
{
  const { dom, w, problems } = await boot("http://localhost/login");
  const doc = w.document;

  check(!!q(doc, "#email"), "form login punya kolom email");
  await login(w, doc, "konsinyasi@seller.test", "password123");

  check(w.location.pathname === "/", "setelah login ke dashboard", w.location.pathname);
  check(
    text(doc, ".dash-hero-title") === "Selamat Datang, Andi Saputra!",
    "sapaan dashboard benar",
    text(doc, ".dash-hero-title")
  );
  check(
    text(doc, ".topbar-store-name") === "Konsinyasi",
    "nama kantin tampil di topbar",
    text(doc, ".topbar-store-name")
  );
  check(statValue(doc, "Saldo tersedia") === "Rp25.000", "saldo awal Rp25.000", statValue(doc, "Saldo tersedia"));
  check(statValue(doc, "menunggu") === "1", "1 pesanan menunggu", statValue(doc, "menunggu"));
  check(statValue(doc, "Total pendapatan") === "Rp75.000", "pendapatan awal Rp75.000", statValue(doc, "Total pendapatan"));

  // --- Pesanan masuk ---
  click(w, sidebarBtn(doc, "Pesanan Masuk"));
  await sleep(500);
  check(w.location.pathname === "/pesanan", "pindah ke /pesanan", w.location.pathname);
  check(
    qa(doc, ".order-card").length === 2,
    "2 pesanan seed untuk kantin ini",
    String(qa(doc, ".order-card").length)
  );
  let pendingCard = orderCard(doc, "ORD-M4X9");
  check(!!pendingCard, "pesanan ORD-M4X9 tampil");
  check(
    !!pendingCard && pendingCard.textContent.includes("Menunggu"),
    "ORD-M4X9 berstatus Menunggu"
  );

  // Muat pesanan contoh (placeholder)
  const before = qa(doc, ".order-card").length;
  const demoBtn = qa(doc, "button").find((b) =>
    b.textContent.includes("Muat pesanan contoh")
  );
  click(w, demoBtn);
  await sleep(900);
  check(
    qa(doc, ".order-card").length === before + 1,
    "pesanan contoh bertambah 1",
    `${before} -> ${qa(doc, ".order-card").length}`
  );
  check(
    bodyText(doc).includes("berhasil dimuat"),
    "notifikasi sukses memuat contoh"
  );

  // Terima pesanan ORD-M4X9 (referensi kartu diambil ulang, siapa tahu
  // React mengganti elemennya setelah render pesanan contoh)
  pendingCard = orderCard(doc, "ORD-M4X9");
  const acceptBtn = [...pendingCard.querySelectorAll("button")].find((b) =>
    b.textContent.includes("Terima Pesanan")
  );
  click(w, acceptBtn);
  await sleep(900);
  pendingCard = orderCard(doc, "ORD-M4X9");
  check(
    !!pendingCard && pendingCard.textContent.includes("Selesai"),
    "status berubah jadi Selesai"
  );
  check(
    !!pendingCard && pendingCard.textContent.includes("Dana sudah masuk ke saldo"),
    "catatan dana masuk tampil"
  );
  check(
    bodyText(doc).includes("masuk ke saldo kamu"),
    "notifikasi diterima tampil"
  );

  // --- Saldo ---
  click(w, sidebarBtn(doc, "Saldo & Penarikan"));
  await sleep(500);
  check(w.location.pathname === "/saldo", "pindah ke /saldo", w.location.pathname);
  check(
    text(doc, ".wallet-hero-value") === "Rp49.000",
    "saldo naik jadi Rp49.000 (25.000 + 24.000)",
    text(doc, ".wallet-hero-value")
  );
  check(statValue(doc, "Total pendapatan") === "Rp99.000", "pendapatan Rp99.000", statValue(doc, "Total pendapatan"));

  // Tarik dana melebihi saldo -> error
  click(w, qa(doc, "button").find((b) => b.textContent.includes("Tarik Dana")));
  await sleep(300);
  check(!!q(doc, "#wd-bank"), "modal tarik dana terbuka");
  setSelect(w, q(doc, "#wd-bank"), "BCA");
  typeInto(w, q(doc, "#wd-account"), "1234567890");
  typeInto(w, q(doc, "#wd-amount"), "100000");
  submit(w, q(doc, ".modal form"));
  await sleep(1200);
  check(
    bodyText(doc).includes("Saldo tidak mencukupi"),
    "validasi saldo tidak cukup muncul",
    bodyText(doc).slice(0, 160)
  );
  check(!!q(doc, ".modal"), "modal tetap terbuka saat error");

  // Tarik dana valid
  typeInto(w, q(doc, "#wd-amount"), "40000");
  submit(w, q(doc, ".modal form"));
  await sleep(1400);
  check(q(doc, ".modal") === null, "modal tertutup setelah berhasil");
  check(
    text(doc, ".wallet-hero-value") === "Rp9.000",
    "saldo terpotong jadi Rp9.000",
    text(doc, ".wallet-hero-value")
  );
  check(
    statValue(doc, "Total penarikan") === "Rp90.000",
    "total penarikan Rp90.000 (50.000 + 40.000)",
    statValue(doc, "Total penarikan")
  );
  check(
    bodyText(doc).includes("ke BCA 1234567890 berhasil"),
    "notifikasi penarikan sukses"
  );
  const wRows = qa(doc, ".wallet-row");
  check(
    wRows.some((r) => r.textContent.includes("BCA • 1234567890") && r.textContent.includes("Rp40.000")),
    "riwayat penarikan berisi BCA Rp40.000"
  );

  // --- Logout lewat dropdown topbar ---
  click(w, q(doc, ".topbar-profile-trigger"));
  await sleep(200);
  const logoutBtn = qa(doc, ".topbar-dropdown-item").find((b) =>
    b.textContent.includes("Keluar")
  );
  check(!!logoutBtn, "menu dropdown Keluar tampil");
  click(w, logoutBtn);
  await sleep(600);
  check(w.location.pathname === "/login", "setelah keluar ke /login", w.location.pathname);

  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[4] Registrasi kantin baru -> OTP -> dashboard kantin kosong");
{
  const { dom, w, problems } = await boot("http://localhost/register");
  const doc = w.document;

  check(bodyText(doc).includes("Daftar Toko Baru"), "form daftar tampil");
  typeInto(w, q(doc, "#name"), "Budi Hartono");
  typeInto(w, q(doc, "#storeName"), "Warung Uji Coba");
  typeInto(w, q(doc, "#email"), "uji@seller.test");
  typeInto(w, q(doc, "#password"), "rahasia123");
  submit(w, q(doc, "form"));
  await sleep(900);

  check(w.location.pathname === "/otp", "berhasil pindah ke /otp", w.location.pathname);
  const otpCode = text(doc, ".otp-dev-note strong");
  check(otpCode && /^\d{6}$/.test(otpCode), "kode OTP 6 digit ditampilkan (mode demo)", otpCode);
  check(
    bodyText(doc).includes("uji@seller.test"),
    "email tujuan OTP tampil"
  );

  // Isi 6 kotak OTP — tunggu crossfade PageStage selesai dulu (0.28+0.45s)
  // supaya entry halaman Register benar-benar dibuang, lalu elemen diambil
  // dari entry TERAKHIR (halaman OTP yang sedang aktif).
  await sleep(1100);
  check(
    qa(doc, ".page-stage-item").length === 1,
    "entry lama PageStage dibuang setelah crossfade",
    String(qa(doc, ".page-stage-item").length)
  );
  const lastStage = qa(doc, ".page-stage-item").pop();
  const boxes = qa(lastStage, ".otp-input-box");
  check(boxes.length === 6, "6 kotak OTP", String(boxes.length));
  otpCode.split("").forEach((d, i) => typeInto(w, boxes[i], d));
  await sleep(100);
  check(
    boxes.map((b) => b.value).join("") === otpCode,
    "nilai kotak OTP terisi",
    boxes.map((b) => b.value).join("")
  );

  // Verifikasi: submit form OTP yang ada di entry aktif
  const otpForm = q(lastStage, "form");
  check(!!otpForm, "form OTP ditemukan di entry aktif");
  const verifyBtn = q(lastStage, ".auth-submit-btn");
  check(
    verifyBtn && verifyBtn.type === "submit",
    "tombol Verifikasi bertipe submit",
    verifyBtn ? verifyBtn.type : "(null)"
  );
  submit(w, otpForm);
  await sleep(120);
  check(
    text(doc, ".auth-submit-btn") !== "Verifikasi",
    "tombol berubah jadi 'Memverifikasi...' (handler jalan)",
    text(doc, ".auth-submit-btn")
  );
  await sleep(900);

  check(
    w.location.pathname === "/",
    "verifikasi -> dashboard",
    `path=${w.location.pathname} | btn=${
      text(doc, ".auth-submit-btn")
    } | err=${text(doc, ".auth-error") || "(none)"}`
  );
  check(
    text(doc, ".dash-hero-title") === "Selamat Datang, Budi Hartono!",
    "sapaan sesuai nama pendaftar",
    text(doc, ".dash-hero-title")
  );
  check(
    text(doc, ".topbar-store-name") === "Warung Uji Coba",
    "kantin baru jadi & tampil di topbar",
    text(doc, ".topbar-store-name")
  );
  check(
    text(doc, ".dash-hero-store")?.includes("Warung Uji Coba"),
    "nama kantin di kartu sapaan",
    text(doc, ".dash-hero-store")
  );
  check(statValue(doc, "Saldo tersedia") === "Rp0", "saldo kantin baru Rp0", statValue(doc, "Saldo tersedia"));
  check(statValue(doc, "menunggu") === "0", "belum ada pesanan", statValue(doc, "menunggu"));

  /* --- lanjut: CRUD menu di kantin yang baru dibuat --- */
  console.log("\n[5] CRUD menu (tambah -> ubah -> nonaktif -> hapus)");
  click(w, sidebarBtn(doc, "Menu Makanan"));
  await sleep(500);
  check(w.location.pathname === "/menu", "buka /menu", w.location.pathname);
  check(
    bodyText(doc).includes("Belum ada menu"),
    "empty state kantin baru"
  );

  // Tambah menu
  click(
    w,
    qa(doc, "button").find((b) => b.textContent.includes("Tambah Menu"))
  );
  await sleep(300);
  check(!!q(doc, "#menu-name"), "modal tambah menu terbuka");
  typeInto(w, q(doc, "#menu-name"), "Nasi Kuning");
  typeInto(w, q(doc, "#menu-price"), "9000");
  typeInto(w, q(doc, "#menu-desc"), "Nasi kuning + telur + mie");
  setSelect(w, q(doc, "#menu-category"), "berat");
  // --- Upload gambar menu (bukan URL lagi) ---
  const fileInput = q(doc, "#menu-image");
  check(!!fileInput && fileInput.type === "file", "input upload gambar bertipe file", fileInput ? fileInput.type : "(null)");
  check(q(doc, "#menu-image[type=url]") === null, "input URL gambar sudah dihapus");
  // Buat file PNG kecil (1x1 pixel) lalu pasang ke input & picu change
  const pngBytes = w.atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
  );
  const testFile = new w.File(
    [new w.Uint8Array([...pngBytes].map((c) => c.charCodeAt(0)))],
    "menu.png",
    { type: "image/png" }
  );
  Object.defineProperty(fileInput, "files", {
    value: [testFile],
    configurable: true,
  });
  fileInput.dispatchEvent(new w.Event("change", { bubbles: true }));
  await sleep(500);
  const preview = q(doc, ".menu-form-preview img");
  check(!!preview, "pratinjau gambar muncul setelah upload", preview ? preview.src.slice(0, 30) : "(tidak ada)");
  check(
    !!preview && preview.src.startsWith("data:image/"),
    "gambar disimpan sebagai data URL",
    preview ? preview.src.slice(0, 40) : ""
  );
  check(
    bodyText(doc).includes("Hapus foto"),
    "tombol Hapus foto tampil"
  );
  // Submit dengan gambar
  submit(w, q(doc, ".modal form"));
  await sleep(900);

  check(q(doc, ".modal") === null, "modal tertutup setelah simpan");
  check(qa(doc, ".menu-row").length === 1, "1 menu tampil", String(qa(doc, ".menu-row").length));
  check(text(doc, ".menu-row-name") === "Nasi Kuning", "nama menu benar", text(doc, ".menu-row-name"));
  check(bodyText(doc).includes("Rp9.000"), "harga Rp9.000 tampil");
  check(bodyText(doc).includes("1 menu"), "badge jumlah menu = 1");

  // Ubah harga
  click(w, qa(doc, "button").find((b) => b.textContent.includes("Ubah")));
  await sleep(300);
  check(q(doc, "#menu-name").value === "Nasi Kuning", "form terisi data lama");
  check(q(doc, "#menu-price").value === "9000", "harga lama terisi");
  typeInto(w, q(doc, "#menu-price"), "11000");
  submit(w, q(doc, ".modal form"));
  await sleep(900);
  check(bodyText(doc).includes("Rp11.000"), "harga ter-update jadi Rp11.000");

  // Nonaktifkan
  click(w, qa(doc, "button").find((b) => b.textContent.includes("Nonaktifkan")));
  await sleep(700);
  check(bodyText(doc).includes("Nonaktif"), "status jadi Nonaktif");

  // Hapus + konfirmasi
  click(w, qa(doc, "button").find((b) => b.textContent.trim() === "Hapus"));
  await sleep(300);
  check(bodyText(doc).includes("Hapus menu?"), "dialog konfirmasi hapus muncul");
  click(w, qa(doc, "button").find((b) => b.textContent.includes("Ya, Hapus")));
  await sleep(900);
  check(qa(doc, ".menu-row").length === 0, "menu terhapus", String(qa(doc, ".menu-row").length));
  check(bodyText(doc).includes("Belum ada menu"), "kembali ke empty state");

  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[6] Filter kategori di halaman menu (akun demo)");
{
  const { dom, w, problems } = await boot("http://localhost/login");
  const doc = w.document;
  await login(w, doc, "konsinyasi@seller.test", "password123");

  click(w, sidebarBtn(doc, "Menu Makanan"));
  await sleep(500);
  check(qa(doc, ".menu-row").length === 4, "kantin Konsinyasi punya 4 menu", String(qa(doc, ".menu-row").length));
  check(
    bodyText(doc).includes("4 menu"),
    "badge jumlah menu = 4"
  );

  const chips = qa(doc, ".menu-page-filter .chip");
  const minuman = chips.find((c) => c.textContent.includes("Minuman"));
  click(w, minuman);
  await sleep(400);
  check(
    bodyText(doc).includes("Tidak ada menu kategori Minuman"),
    "empty state filter Minuman (kantin ini tak punya jus)"
  );
  check(minuman.classList.contains("active"), "chip Minuman aktif");

  const cemilan = chips.find((c) => c.textContent.includes("Cemilan"));
  click(w, cemilan);
  await sleep(400);
  check(
    qa(doc, ".menu-row").length === 1 && bodyText(doc).includes("Pisang Goreng"),
    "filter Cemilan -> hanya Pisang Goreng"
  );

  click(w, chips.find((c) => c.textContent.includes("Semua")));
  await sleep(400);
  check(qa(doc, ".menu-row").length === 4, "kembali tampil 4 menu");

  reportProblems(problems);
  dom.window.close();
}

console.log(`\nHasil: ${pass} lulus, ${fail} gagal`);
process.exit(fail > 0 ? 1 : 0);
