/**
 * Pengaturan animasi global.
 *
 * Aturan performa yang dipakai sepanjang aplikasi:
 * 1. Hanya animasikan `opacity` dan `transform` (di-handle GPU/compositor,
 *    tidak memicu layout/reflow seperti `width`, `top`, `margin`).
 * 2. Hormati `prefers-reduced-motion` — user yang minta kurangi gerakan
 *    akan langsung melihat halaman tanpa animasi.
 * 3. Bersihkan inline style setelah animasi (`clearProps`) supaya tidak ada
 *    sisa `transform` yang bisa membuat element `position: fixed` di dalamnya
 *    berperilaku aneh.
 */

export const EASE = {
  enter: "power2.out",
  exit: "power1.in",
};

export const DURATION = {
  pageIn: 0.45,
  pageOut: 0.28,
  intro: 0.55,
};

export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
