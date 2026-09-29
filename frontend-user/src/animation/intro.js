import gsap from "gsap";
import { prefersReducedMotion, EASE, DURATION } from "./motion";

/**
 * Animasi pembuka halaman (sekali di awal aplikasi dimuat).
 *
 * Dipanggil dari `useLayoutEffect` sehingga nilai awal animasi sudah
 * diterapkan SEBELUM browser menggambar frame pertama — tidak ada kedip
 * (flash of unstyled content) tapi tetap ringan karena cuma memutar
 * animasi untuk 4 group element.
 *
 * Return: fungsi cleanup (revert) untuk dipanggil saat component unmount.
 */
export function playIntro(scope) {
  if (!scope || prefersReducedMotion()) return () => {};

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      defaults: { ease: EASE.enter, clearProps: "transform,opacity,visibility" },
    });

    // Hanya animasikan target yang benar-benar ada (mis. saat halaman
    // langsung redirect, konten masih kosong) — supaya GSAP tidak
    // melempar warning "target not found".
    const add = (selector, vars, position) => {
      const targets = gsap.utils.toArray(selector, scope);
      if (targets.length > 0) tl.from(targets, vars, position);
    };

    // Sidebar masuk dari kiri
    add("[data-intro='sidebar']", { x: -56, duration: DURATION.intro }, 0);
    // Topbar turun pelan dari atas
    add("[data-intro='topbar']", { y: -24, duration: 0.5 }, 0.06);
    // Bottom nav (mobile) naik dari bawah
    add("[data-intro='bottomnav']", { y: 48, duration: 0.5 }, 0.18);
    // Konten halaman naik + fade, tiap blok sedikit berselang
    add(
      "[data-intro='content'] > * > *",
      { y: 22, autoAlpha: 0, duration: 0.5, stagger: 0.07 },
      0.12
    );
  }, scope);

  return () => ctx.revert();
}
