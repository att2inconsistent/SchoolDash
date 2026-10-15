/**
 * Smoke test integrasi (jsdom + backend sungguhan).
 * Jalankan:  npm run smoke   (vite build --mode smoke && node scripts/smoke.mjs)
 *
 * Butuh backend berjalan di http://localhost:4000 (npm run dev di folder backend).
 * Ekspektasi diambil dari API saat test berjalan — bukan data hard-coded —
 * jadi test tetap valid walau isi database berubah.
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
const STUDENT = { email: "budi@siswa.test", password: "password123" };

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
    w.localStorage.setItem("schooldesk.auth.session", JSON.stringify(session));
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
function vendorNames(doc) {
  return qa(doc, ".vendor-card-name").map((el) => el.textContent.trim());
}
function menuNames(doc) {
  return qa(doc, ".search-card-name").map((el) => el.textContent.trim());
}
function sameSet(a, b) {
  return (
    a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|")
  );
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

const login = await api("/auth/login", { method: "POST", body: STUDENT });
if (login.status !== 200) {
  console.error("\nLogin siswa gagal:", JSON.stringify(login.data));
  process.exit(1);
}
const session = { token: login.data.token, user: login.data.user };
const [vendorsRes, catsRes] = await Promise.all([
  api("/catalog/vendors"),
  api("/catalog/categories"),
]);
const allVendors = vendorsRes.data.vendors;
const categories = catsRes.data.categories;

/* ------------------------------------------------------------------ */
console.log("\n[1] Beranda tamu — vendor & kategori dari backend");
{
  const { dom, w, problems } = await boot("http://localhost/");
  const doc = w.document;
  await until(() => vendorNames(doc).length > 0);
  check(
    sameSet(vendorNames(doc), allVendors.map((v) => v.name)),
    `${allVendors.length} vendor sesuai API`,
    vendorNames(doc).join(", ")
  );
  const labels = qa(doc, ".category-item").map((el) => el.textContent.trim());
  check(
    sameSet(labels, ["Semua", ...categories.map((c) => c.label)]),
    "tombol kategori = Semua + kategori API",
    labels.join(", ")
  );
  check(q(doc, ".search-results") === null, "belum ada section hasil pencarian");
  check(
    !/\d/.test(q(doc, ".balance-card-amount")?.textContent ?? ""),
    "saldo tamu tanpa angka (belum login)"
  );
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[2] Cari 'goreng' — hasil = API /catalog/menus?q=goreng");
{
  const { data } = await api("/catalog/menus?q=goreng");
  const expected = data.menus.map((m) => m.name);
  const { dom, w, problems } = await boot("http://localhost/?q=goreng");
  const doc = w.document;
  await until(() => menuNames(doc).length > 0);
  check(
    sameSet(menuNames(doc), expected),
    `${expected.length} menu cocok sesuai API`,
    menuNames(doc).join(", ")
  );
  check(
    text(doc, ".search-results-title") === 'Menu cocok dengan "goreng"',
    "judul section menu cocok",
    text(doc, ".search-results-title")
  );
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[3] /?kategori=minuman — vendor terfilter = API category=minuman");
{
  const { data } = await api("/catalog/vendors?category=minuman");
  const expected = data.vendors.map((v) => v.name);
  const { dom, w, problems } = await boot("http://localhost/?kategori=minuman");
  const doc = w.document;
  await until(() => vendorNames(doc).length > 0 || !!q(doc, ".search-empty"));
  check(
    sameSet(vendorNames(doc), expected),
    "vendor Minuman sesuai API",
    vendorNames(doc).join(", ")
  );
  check(
    qa(doc, ".category-item")
      .find((b) => b.textContent.includes("Minuman"))
      ?.classList.contains("active"),
    "tombol Minuman bertanda aktif"
  );
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[4] /?q=zzzz — empty state");
{
  const { dom, w, problems } = await boot("http://localhost/?q=zzzz");
  const doc = w.document;
  await until(() => !!q(doc, ".search-empty"));
  check(!!q(doc, ".search-empty"), "empty state tampil");
  check(bodyText(doc).includes("Tidak ada hasil"), "teks 'Tidak ada hasil' ada");
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[5] Beranda login — saldo = GET /wallet");
{
  const { data } = await api("/wallet", { token: session.token });
  const { dom, w, problems } = await boot("http://localhost/", { session });
  const doc = w.document;
  await until(() => digits(q(doc, ".balance-card-amount")?.textContent) !== "");
  check(
    digits(q(doc, ".balance-card-amount")?.textContent) === String(data.balance),
    `saldo tampil Rp${data.balance?.toLocaleString("id-ID")}`,
    q(doc, ".balance-card-amount")?.textContent
  );
  check(
    bodyText(doc).includes(session.user.name),
    "nama user tampil di beranda"
  );
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[6] Profil login — statistik = GET /orders");
{
  const { data } = await api("/orders", { token: session.token });
  const { dom, w, problems } = await boot("http://localhost/profil", { session });
  const doc = w.document;
  await until(() => bodyText(doc).includes("Kali sudah pesan"));
  const re = new RegExp(`${data.orders.length}\\s*Kali sudah pesan`);
  check(re.test(bodyText(doc)), "jumlah pesanan sesuai API", bodyText(doc).slice(0, 200));
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[7] /profil tamu -> redirect /login");
{
  const { dom, w, problems } = await boot("http://localhost/profil");
  const doc = w.document;
  await until(() => w.location.pathname === "/login");
  check(w.location.pathname === "/login", "redirect ke /login", w.location.pathname);
  check(bodyText(doc).includes("Masuk"), "form login tampil");
  reportProblems(problems);
  dom.window.close();
}

console.log(`\nHasil: ${pass} lulus, ${fail} gagal`);
process.exit(fail > 0 ? 1 : 0);
