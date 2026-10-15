/**
 * Smoke test integrasi (jsdom + backend sungguhan) untuk frontend-seller.
 * Jalankan:  npm run smoke   (vite build --mode smoke && node scripts/smoke.mjs)
 *
 * Butuh backend berjalan di http://localhost:4000 (npm run dev di folder backend).
 * Ekspektasi diambil dari API saat test berjalan — read-only, tidak ada
 * mutasi data — jadi test tetap valid walau isi database berubah.
 *
 * Catatan: npm run smoke membangun dist dengan --mode smoke
 * (VITE_API_URL=http://localhost:4000). Jalankan `npm run build` lagi
 * kalau butuh dist produksi.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const API = "http://localhost:4000/api";
const SELLER = { email: "andi@seller.test", password: "password456" };

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const distDir = path.join(root, "dist");

const html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
const srcMatch = html.match(/<script[^>]+src="([^"]+)"/);
if (!srcMatch) throw new Error("bundle script tidak ditemukan di dist/index.html");
const bundleHref =
  pathToFileURL(path.join(distDir, srcMatch[1].replace(/^\/+/, ""))).href;

async function api(pathname, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

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
async function until(fn, ms = 5000, step = 100) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      /* coba lagi */
    }
    await sleep(step);
  }
  return null;
}
const digits = (s) => String(s ?? "").replace(/\D/g, "");

let bootCount = 0;
async function boot(url, { session } = {}) {
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

  if (session) {
    w.localStorage.setItem(
      "schooldesk.seller.auth.session",
      JSON.stringify(session)
    );
  }

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
function click(w, el) {
  el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
}
function reportProblems(problems) {
  const bad = problems.filter((p) => /error|warning/i.test(p));
  check(bad.length === 0, "tanpa error/warning console", bad.join(" | "));
}

/* ------------------------------------------------------------------ */
const health = await fetch(`${API}/health`)
  .then((r) => r.ok)
  .catch(() => false);
if (!health) {
  console.error(
    `\nBackend tidak jalan di ${API} — jalankan \`npm run dev\` di folder backend dulu.`
  );
  process.exit(1);
}

const login = await api("/seller/auth/login", { method: "POST", body: SELLER });
if (login.status !== 200) {
  console.error("\nLogin seller gagal:", JSON.stringify(login.data));
  process.exit(1);
}
const session = { token: login.data.token, user: login.data.user };
const [walletRes, menusRes, ordersRes, txRes] = await Promise.all([
  api("/seller/wallet", { token: session.token }),
  api("/seller/menus?includeInactive=true", { token: session.token }),
  api("/seller/orders", { token: session.token }),
  api("/seller/wallet/transactions", { token: session.token }),
]);
const balance = walletRes.data.balance;
const menus = menusRes.data.menus;
const orders = ordersRes.data.orders;
const transactions = txRes.data.transactions;
const earnings = transactions.filter((t) => t.kind === "earning");
const withdrawals = transactions.filter((t) => t.kind === "withdrawal");
const totalEarned = earnings.reduce((sum, e) => sum + e.amount, 0);
const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Math.abs(w.amount), 0);
const pendingCount = orders.filter((o) => o.status === "Menunggu").length;
const revenue = orders
  .filter((o) => o.status === "Selesai")
  .reduce((sum, o) => sum + o.total, 0);

/* ------------------------------------------------------------------ */
console.log("\n[1] Halaman / tamu -> /login");
{
  const { dom, w, problems } = await boot("http://localhost/");
  const doc = w.document;
  await until(() => bodyText(doc).includes("Masuk sebagai Penjual"));
  check(w.location.pathname === "/login", "guard: redirect /login", w.location.pathname);
  check(bodyText(doc).includes("Masuk sebagai Penjual"), "judul halaman login tampil");
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[2] Dashboard login — angka = API wallet/menus/orders");
{
  const { dom, w, problems } = await boot("http://localhost/", { session });
  const doc = w.document;
  await until(() => {
    const b = bodyText(doc);
    // wait until skeleton placeholders ("Rp—", "—", "memuat…") are all gone
    return (
      b.includes("Saldo tersedia") &&
      !b.includes("Rp—") &&
      !b.includes("memuat…")
    );
  });
  const body = bodyText(doc);

  const saldo = body.match(/Saldo tersedia\s*Rp([\d.,]+)/);
  check(
    saldo && digits(saldo[1]) === String(balance),
    `saldo Rp${balance?.toLocaleString("id-ID")}`,
    saldo?.[1]
  );
  const menuHint = qa(doc, ".stat-card-hint")
    .map((el) => el.textContent.trim())
    .find((t) => t.includes("menu ("));
  const menuCount = menuHint?.match(/^(\d+)\s*menu/);
  check(
    menuCount && Number(menuCount[1]) === menus.length,
    `jumlah menu = ${menus.length}`,
    menuCount?.[1]
  );
  const menunggu = body.match(/Pesanan menunggu\s*(\d+)/);
  check(
    menunggu && Number(menunggu[1]) === pendingCount,
    `pesanan menunggu = ${pendingCount}`,
    menunggu?.[1]
  );
  const earned = body.match(/Total pendapatan\s*Rp([\d.,]+)/);
  check(
    earned && digits(earned[1]) === String(totalEarned),
    `total pendapatan = Rp${totalEarned}`,
    earned?.[1]
  );
  const rev = body.match(/Rp([\d.,]+)\s*dari pesanan selesai/);
  check(
    rev && digits(rev[1]) === String(revenue),
    `pendapatan pesanan selesai = Rp${revenue}`,
    rev?.[1]
  );
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[3] /menu — baris = API /seller/menus?includeInactive=true");
{
  const { dom, w, problems } = await boot("http://localhost/menu", { session });
  const doc = w.document;
  await until(() => qa(doc, ".menu-row").length > 0 || !!q(doc, ".empty-state"));
  check(
    qa(doc, ".menu-row").length === menus.length,
    `${menus.length} baris menu (termasuk nonaktif)`,
    String(qa(doc, ".menu-row").length)
  );
  check(
    text(doc, ".section-count") === `${menus.length} menu`,
    "badge jumlah menu",
    text(doc, ".section-count")
  );
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[4] /pesanan — kartu = API /seller/orders");
{
  const { dom, w, problems } = await boot("http://localhost/pesanan", { session });
  const doc = w.document;
  await until(() => qa(doc, ".order-card").length === orders.length || !!q(doc, ".empty-state"));
  check(
    qa(doc, ".order-card").length === orders.length,
    `${orders.length} kartu pesanan`,
    String(qa(doc, ".order-card").length)
  );
  if (orders.length > 0) {
    const first = q(doc, ".order-card")?.textContent ?? "";
    check(
      first.includes(orders[0].studentName || "-"),
      "nama pembeli (mapping studentName) tampil",
      orders[0].studentName
    );
  }
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[5] /saldo — saldo, total, & riwayat = API transaksi");
{
  const { dom, w, problems } = await boot("http://localhost/saldo", { session });
  const doc = w.document;
  await until(() => !!q(doc, ".wallet-hero-value") && /\d/.test(q(doc, ".wallet-hero-value")?.textContent ?? ""));
  check(
    digits(text(doc, ".wallet-hero-value")) === String(balance),
    "hero saldo sesuai /seller/wallet",
    text(doc, ".wallet-hero-value")
  );
  const body = bodyText(doc);
  const earned = body.match(/Total pendapatan\s*Rp([\d.,]+)/);
  check(
    earned && digits(earned[1]) === String(totalEarned),
    `total pendapatan = Rp${totalEarned}`,
    earned?.[1]
  );
  const withdrawn = body.match(/Total penarikan\s*Rp([\d.,]+)/);
  check(
    withdrawn && digits(withdrawn[1]) === String(totalWithdrawn),
    `total penarikan = Rp${totalWithdrawn}`,
    withdrawn?.[1]
  );
  check(
    qa(doc, ".wallet-row").length === earnings.length,
    `tab dana masuk: ${earnings.length} baris`,
    String(qa(doc, ".wallet-row").length)
  );

  const tab = qa(doc, "button").find((b) => b.textContent.includes("Penarikan ("));
  check(!!tab, "tab Penarikan ada");
  if (tab) {
    click(w, tab);
    await until(() => qa(doc, ".wallet-row").length === withdrawals.length);
    check(
      qa(doc, ".wallet-row").length === withdrawals.length,
      `tab penarikan: ${withdrawals.length} baris`,
      String(qa(doc, ".wallet-row").length)
    );
    const rowText = q(doc, ".wallet-row")?.textContent ?? "";
    check(!/-\s*Rp-/.test(rowText), "jumlah penarikan tampil positif (bukan Rp-…)", rowText.slice(0, 80));
  }
  reportProblems(problems);
  dom.window.close();
}

console.log(`\nHasil: ${pass} lulus, ${fail} gagal`);
process.exit(fail > 0 ? 1 : 0);
