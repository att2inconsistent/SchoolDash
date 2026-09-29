/** Format angka & tanggal supaya tampilan konsisten di semua halaman. */

export function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

const dateTime = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDateTime(iso) {
  try {
    return dateTime.format(new Date(iso));
  } catch {
    return "-";
  }
}

export function formatDate(iso) {
  try {
    return dateOnly.format(new Date(iso));
  } catch {
    return "-";
  }
}
