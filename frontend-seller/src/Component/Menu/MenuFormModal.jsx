import { useState } from "react";
import { CATEGORIES } from "../../data/seed";
import { formatRupiah } from "../../lib/format";
import { fileToDataUrl } from "../../lib/image";

/**
 * Form tambah/ubah menu (modal).
 * Validasi ringan ada di sini supaya user langsung dapat balasan;
 * validasi final & penyimpanan ada di MenuContext (addMenu/updateMenu).
 */
export default function MenuFormModal({ menu, onSave, onClose }) {
  const [form, setForm] = useState({
    name: menu?.name || "",
    description: menu?.description || "",
    price: menu?.price ? String(menu.price) : "",
    category: menu?.category || "berat",
    image: menu?.image || "",
    active: menu ? menu.active : true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");

  const categories = CATEGORIES.filter((c) => c.key !== "semua");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // Upload gambar: file dibaca jadi data URL lalu dikompres (lihat lib/image).
  async function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setImageError("");
    setImageUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({ ...prev, image: dataUrl }));
    } catch (err) {
      setImageError(err.message || "Gambar gagal diunggah.");
    } finally {
      setImageUploading(false);
      // Reset value supaya memilih file yang sama bisa memicu change lagi
      e.target.value = "";
    }
  }

  function handleRemoveImage() {
    setImageError("");
    setForm((prev) => ({ ...prev, image: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (imageUploading) {
      setError("Tunggu gambar selesai diunggah.");
      return;
    }
    if (form.name.trim().length < 3) {
      setError("Nama menu minimal 3 karakter.");
      return;
    }
    if (!(Number(form.price) > 0)) {
      setError("Harga harus lebih dari 0.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      await onSave({ ...form, price: Number(form.price) });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">
            {menu ? "Ubah Menu" : "Tambah Menu Baru"}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Tutup"
            disabled={saving}
          >
            ✕
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="menu-name">Nama menu</label>
            <input
              id="menu-name"
              name="name"
              type="text"
              placeholder="Contoh: Nasi Goreng Spesial"
              value={form.name}
              onChange={handleChange}
              autoFocus
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="menu-price">Harga (Rp)</label>
              <input
                id="menu-price"
                name="price"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="10000"
                value={form.price}
                onChange={handleChange}
                required
              />
              <span className="field-hint">
                {form.price ? formatRupiah(Number(form.price)) : "Isi dalam rupiah"}
              </span>
            </div>

            <div className="form-field">
              <label htmlFor="menu-category">Kategori</label>
              <select
                id="menu-category"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="menu-desc">Deskripsi</label>
            <textarea
              id="menu-desc"
              name="description"
              placeholder="Contoh: Nasi + telur + bakmi goreng + acar"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="menu-image">Foto menu (opsional)</label>
            <input
              id="menu-image"
              className="menu-form-file"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={imageUploading}
            />
            <span className="field-hint">
              {imageUploading
                ? "Mengunggah gambar..."
                : "Format JPG/PNG/WebP, maksimal 5 MB. Gambar otomatis dikompres."}
            </span>
            {imageError && <span className="menu-form-file-error">{imageError}</span>}
            {form.image && (
              <div className="menu-form-preview">
                <img src={form.image} alt="Pratinjau menu" />
                <button
                  type="button"
                  className="menu-form-remove"
                  onClick={handleRemoveImage}
                  disabled={imageUploading}
                >
                  Hapus foto
                </button>
              </div>
            )}
          </div>

          <label className="menu-form-active">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
            />
            Tampilkan menu ini di aplikasi pembeli
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : menu ? "Simpan Perubahan" : "Tambah Menu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
