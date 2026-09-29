/**
 * Helper upload gambar menu.
 *
 * Gambar dari file (kamera/galeri) diubah jadi data URL (base64) lalu
 * dikompres supaya kecil — karena penyimpanan sekarang masih localStorage
 * (kuotanya terbatas, ~5 MB per origin).
 *
 * TODO(backend): setelah ada backend, ganti langkah simpan data URL ini
 * dengan POST /api/seller/upload (object storage: S3/Supabase/etc) dan
 * simpan hanya URL publiknya di field `image`.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB asli sebelum dikompres
const MAX_DIMENSION = 960; // sisi terpanjang hasil kompres
const JPEG_QUALITY = 0.78;

function isCanvasAvailable() {
  // jsdom (dipakai smoke test) tidak punya canvas sungguhan — memanggil
  // getContext hanya memicu error "Not implemented". Lewati kompresi di sana.
  if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) {
    return false;
  }
  try {
    return !!document.createElement("canvas")?.getContext?.("2d");
  } catch {
    return false;
  }
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gambar gagal dibaca."));
    reader.readAsDataURL(file);
  });
}

/** Skalakan & kompres data URL via canvas; hasil = JPEG kecil. */
function compressDataURL(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(
          1,
          MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight)
        );
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl); // canvas tidak siap — pakai gambar apa adanya
          return;
        }
        // Latar putih supaya PNG transparan tidak jadi hitam saat jadi JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      } catch {
        resolve(dataUrl); // gagal kompres — gambar asli tetap dipakai
      }
    };
    img.onerror = () => resolve(dataUrl); // format tak didukung — pakai asli
    img.src = dataUrl;
  });
}

/**
 * Proses file gambar dari input upload menjadi data URL siap simpan.
 * Melempar Error dengan pesan ramah user bila file tidak valid.
 */
export async function fileToDataUrl(file) {
  if (!file) throw new Error("Pilih gambar dulu.");
  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar (JPG/PNG/WebP).");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran gambar maksimal 5 MB.");
  }

  const dataUrl = await readAsDataURL(file);

  // Tanpa canvas (mis. jsdom di smoke test) gambar dipakai apa adanya.
  if (!isCanvasAvailable()) return dataUrl;

  return compressDataURL(dataUrl);
}
