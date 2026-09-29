import { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import gsap from "gsap";
import { prefersReducedMotion, EASE, DURATION } from "../../animation/motion";
import "./PageStage.css";

/**
 * PageStage = "panggung" perpindahan halaman.
 *
 * Dulu: <main> cuma menimpa element (activePage) sehingga URL tidak pernah
 * berubah dan refresh browser selalu kembali ke halaman utama.
 *
 * Sekarang: setiap route punya URL sendiri, dan PageStage menahan halaman
 * LAMA selama animasi selesai (maksimal 2 entry) sehingga bisa melakukan
 * crossfade dua arah — halaman lama fade-out, halaman baru fade-in —
 * lalu entry lama dibuang dari state.
 *
 * Element lama disimpan apa adanya (bukan di-render ulang dari route baru),
 * jadi params seperti /menu/:vendorId tetap benar selama transisi.
 */
export default function PageStage() {
  const location = useLocation();
  const outlet = useOutlet();
  const stageRef = useRef(null);

  // `key`  = React key — STABIL per halaman, tidak boleh berubah saat query
  //          berubah (kalau berubah, halaman jadi remount tiap ketikan).
  // `seen` = location.key terakhir yang sudah diproses (penanda sudah sinkron).
  // `pathname` = dipakai membedakan pindah HALAMAN vs ganti QUERY saja.
  const [entries, setEntries] = useState(() => [
    {
      key: location.key,
      seen: location.key,
      pathname: location.pathname,
      element: outlet,
    },
  ]);

  // Penanda "halaman BARU sudah masuk" — dipakai sebagai dependency animasi
  // crossfade. Menukar element entry karena perubahan query TIDAK menaikkan
  // nilai ini, jadi animasi tidak ikut berjalan/restart.
  const [stageVersion, setStageVersion] = useState(0);

  const entriesRef = useRef(entries);
  // Sinkron ref di effect (bukan saat render) — urutan layout effect penting:
  // effect ini harus dideklarasikan SEBELUM animasi crossfade supaya nilai
  // entries yang terbaru sudah terbaca saat animasi jalan.
  useLayoutEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  // Derived-state pattern: kalau URL berubah, tambahkan entry baru.
  // (setState saat render aman di React selama kondisinya berhenti saat state ter-update)
  // User yang minta reduced-motion tidak perlu entry lama sama sekali,
  // jadi halaman lama langsung diganti tanpa animasi.
  //
  // Catatan: perubahan HANYA pada query (mis. /?q=nasi saat user mengetik di
  // kolom pencarian) TIDAK boleh membuat entry baru — kalau tidak, crossfade
  // akan berjalan tiap huruf dan halaman berkedip. Query change cukup menukar
  // element di entry terakhir (key & pathname tetap, jadi tanpa animasi).
  const last = entries[entries.length - 1];
  if (last.seen !== location.key) {
    if (last.pathname === location.pathname) {
      // Query/hash saja (mis. user mengetik di kolom search): perbarui
      // element di entry terakhir TANPA mengganti React key & tanpa animasi.
      setEntries((prev) => {
        const next = [...prev];
        const current = next[next.length - 1];
        next[next.length - 1] = {
          ...current,
          seen: location.key,
          element: outlet,
        };
        return next;
      });
    } else {
      const nextEntry = {
        key: location.key,
        seen: location.key,
        pathname: location.pathname,
        element: outlet,
      };
      if (prefersReducedMotion()) {
        setEntries([nextEntry]);
      } else {
        setEntries((prev) => [...prev, nextEntry].slice(-2));
      }
      setStageVersion((v) => v + 1);
    }
  }

  // Selalu mulai dari atas saat pindah halaman.
  // useLayoutEffect supaya scroll direset SEBELUM frame digambar,
  // jadi tidak terlihat "lompat" dari posisi scroll halaman lama.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || entriesRef.current.length < 2) return;

    const items = Array.from(stage.children);
    const incoming = items[items.length - 1];
    const outgoing = items.slice(0, -1);

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          onComplete: () => setEntries((prev) => prev.slice(-1)),
        })
        .to(outgoing, {
          autoAlpha: 0,
          y: -10,
          duration: DURATION.pageOut,
          ease: EASE.exit,
        })
        .fromTo(
          incoming,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: DURATION.pageIn,
            ease: EASE.enter,
            clearProps: "transform,opacity,visibility",
          },
          0.06
        );
    }, stage);

    return () => ctx.revert();
    // deps = stageVersion: hanya halaman BARU yang memicu crossfade.
    // Menukar element entry (perubahan query seperti ?q= saat mengetik)
    // tidak boleh me-restart animasi yang sedang berjalan.
  }, [stageVersion]);

  return (
    <div className="page-stage" ref={stageRef} data-intro="content">
      {entries.map((entry, index) => {
        const isCurrent = index === entries.length - 1;
        return (
          <div
            key={entry.key}
            className={
              "page-stage-item" + (isCurrent ? "" : " page-stage-item--leaving")
            }
          >
            {entry.element}
          </div>
        );
      })}
    </div>
  );
}
