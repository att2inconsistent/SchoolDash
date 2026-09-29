/**
 * Smoke test sementara (jsdom) untuk fitur pencarian & kategori.
 * Jalankan:  node scripts/smoke.mjs
 * Hapus setelah selesai — bukan bagian dari aplikasi.
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
  const setter = Object.getOwnPropertyDescriptor(
    w.HTMLInputElement.prototype,
    "value"
  ).set;
  setter.call(input, value);
  input.dispatchEvent(new w.Event("input", { bubbles: true }));
}
function click(w, el) {
  el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
}
function vendorNames(doc) {
  return qa(doc, ".vendor-card-name").map((el) => el.textContent.trim());
}
function menuNames(doc) {
  return qa(doc, ".search-card-name").map((el) => el.textContent.trim());
}
function categoryButton(doc, label) {
  return qa(doc, ".category-item").find((b) => b.textContent.includes(label));
}
function reportProblems(problems) {
  const bad = problems.filter((p) => /error|warning/i.test(p));
  check(bad.length === 0, "tanpa error/warning console", bad.join(" | "));
}

/* ------------------------------------------------------------------ */
console.log("\n[1] Home + ketik di kolom pencarian");
{
  const { dom, w, problems } = await boot("http://localhost/");
  const doc = w.document;

  check(
    text(doc, ".vendor-list-title") === "Vendor Kantin Terpopuler",
    "judul default 'Vendor Kantin Terpopuler'",
    text(doc, ".vendor-list-title")
  );
  check(vendorNames(doc).length === 3, "3 vendor tampil", String(vendorNames(doc).length));
  check(!!categoryButton(doc, "Makanan Berat"), "tombol kategori Makanan Berat ada");
  check(q(doc, ".search-results") === null, "belum ada section hasil pencarian");
  check(qa(doc, ".page-stage-item").length === 1, "hanya 1 entry panggung");
  check(q(doc, ".topbar-search-clear") === null, "tombol X belum muncul (input kosong)");

  // ketik huruf demi huruf seperti user asli (focus dulu, seperti user asli)
  const input = q(doc, ".topbar-search input");
  check(!!input, "kolom pencarian ada");
  input.focus();
  for (const value of ["g", "go", "gor", "gore", "goreng"]) {
    typeInto(w, input, value);
    await sleep(60);
  }
  await sleep(400);

  check(w.location.search === "?q=goreng", "URL jadi /?q=goreng", w.location.search);
  check(input.value === "goreng", "nilai input tidak hilang saat ketik cepat", input.value);
  check(doc.activeElement === input, "input tetap fokus");
  check(qa(doc, ".page-stage-item").length === 1, "ketik search tidak menambah entry crossfade", String(qa(doc, ".page-stage-item").length));
  check(
    menuNames(doc).includes("Nasi Goreng"),
    "makanan 'Nasi Goreng' muncul di hasil",
    menuNames(doc).join(", ")
  );
  check(
    text(doc, ".vendor-list-title") === 'Vendor untuk "goreng"',
    "judul vendor berubah mengikuti pencarian",
    text(doc, ".vendor-list-title")
  );
  check(!!q(doc, ".topbar-search-clear"), "tombol X muncul saat ada teks");

  // klik X untuk mengosongkan
  click(w, q(doc, ".topbar-search-clear"));
  await sleep(400);
  check(w.location.search === "", "X menghapus param q", w.location.search);
  check(input.value === "", "X mengosongkan input", input.value);
  check(
    text(doc, ".vendor-list-title") === "Vendor Kantin Terpopuler",
    "vendor kembali ke judul default"
  );

  // klik kategori Cemilan
  click(w, categoryButton(doc, "Cemilan"));
  await sleep(400);
  check(w.location.search === "?kategori=cemilan", "URL jadi ?kategori=cemilan", w.location.search);
  check(
    menuNames(doc).includes("Pisang Goreng") && menuNames(doc).includes("Tahu Crispy"),
    "menu Cemilan tampil (Pisang Goreng, Tahu Crispy)",
    menuNames(doc).join(", ")
  );
  const names = vendorNames(doc);
  check(
    names.includes("Konsinyasi") && names.includes("Mie Ayam") && !names.includes("Kedai Jus"),
    "vendor tanpa menu Cemilan ikut terfilter",
    names.join(", ")
  );
  check(text(doc, ".vendor-list-count") === "2 vendor", "badge jumlah vendor = 2", text(doc, ".vendor-list-count"));
  check(qa(doc, ".page-stage-item").length === 1, "ganti kategori tidak menambah entry crossfade");

  // tombol "Hapus filter" di header vendor
  click(w, q(doc, ".vendor-list-filter"));
  await sleep(400);
  check(w.location.search === "", "'Hapus filter' mengosongkan URL", w.location.search);
  check(vendorNames(doc).length === 3, "vendor kembali penuh");

  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[2] Buka langsung /?kategori=minuman");
{
  const { dom, w, problems } = await boot("http://localhost/?kategori=minuman");
  const doc = w.document;
  check(
    text(doc, ".vendor-list-title") === "Vendor kategori Minuman",
    "judul 'Vendor kategori Minuman'",
    text(doc, ".vendor-list-title")
  );
  check(vendorNames(doc).join(",") === "Kedai Jus", "hanya Kedai Jus", vendorNames(doc).join(","));
  check(menuNames(doc).includes("Jus Alpukat"), "menu jus tampil", menuNames(doc).join(","));
  check(
    categoryButton(doc, "Minuman")?.classList.contains("active"),
    "tombol Minuman bertanda aktif"
  );
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[3] Buka langsung /?q=konsinyasi (cari nama vendor)");
{
  const { dom, w, problems } = await boot("http://localhost/?q=konsinyasi");
  const doc = w.document;
  check(
    text(doc, ".search-results-title") === 'Menu cocok dengan "konsinyasi"',
    "judul section menu cocok",
    text(doc, ".search-results-title")
  );
  check(menuNames(doc).length === 4, "4 menu vendor Konsinyasi tampil", String(menuNames(doc).length));
  check(vendorNames(doc).join(",") === "Konsinyasi", "vendor Konsinyasi tampil", vendorNames(doc).join(","));
  check(q(doc, ".topbar-search input").value === "konsinyasi", "input terisi dari URL");
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[4] Buka langsung /?q=zzzz (tidak ada hasil) + Hapus filter");
{
  const { dom, w, problems } = await boot("http://localhost/?q=zzzz");
  const doc = w.document;
  check(!!q(doc, ".search-empty"), "empty state tampil");
  check(bodyText(doc).includes("Tidak ada hasil"), "teks 'Tidak ada hasil' ada");
  check(q(doc, ".vendor-list") === null, "daftar vendor tidak ikut dirender");
  click(w, q(doc, ".search-empty-btn"));
  await sleep(400);
  check(w.location.search === "", "tombol Hapus filter mengosongkan URL", w.location.search);
  check(vendorNames(doc).length === 3, "vendor kembali penuh");
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[5] Kombinasi /?q=jus&kategori=minuman");
{
  const { dom, w, problems } = await boot("http://localhost/?q=jus&kategori=minuman");
  const doc = w.document;
  check(
    menuNames(doc).join(",") === "Jus Alpukat,Jus Jeruk",
    "hanya menu jus yang cocok",
    menuNames(doc).join(",")
  );
  check(vendorNames(doc).join(",") === "Kedai Jus", "vendor Kedai Jus");
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[6] Dari /menu/1 lalu ketik search -> pindah ke beranda");
{
  const { dom, w, problems } = await boot("http://localhost/menu/1");
  const doc = w.document;
  check(bodyText(doc).includes("Nasi Kulit Jeruk"), "halaman menu vendor tampil");

  const input = q(doc, ".topbar-search input");
  typeInto(w, input, "salad");
  await sleep(700);
  check(w.location.pathname === "/", "otomatis pindah ke beranda", w.location.pathname);
  check(w.location.search === "?q=salad", "param q terbawa", w.location.search);
  check(
    menuNames(doc).includes("Salad Buah"),
    "hasil pencarian tampil",
    menuNames(doc).join(",")
  );
  reportProblems(problems);
  dom.window.close();
}

/* ------------------------------------------------------------------ */
console.log("\n[7] /profil tanpa login -> dialihkan ke /login");
{
  const { dom, w, problems } = await boot("http://localhost/profil");
  const doc = w.document;
  check(w.location.pathname === "/login", "redirect ke /login", w.location.pathname);
  check(bodyText(doc).includes("Masuk") || bodyText(doc).includes("login"), "form login tampil");
  reportProblems(problems);
  dom.window.close();
}

console.log(`\nHasil: ${pass} lulus, ${fail} gagal`);
process.exit(fail > 0 ? 1 : 0);
