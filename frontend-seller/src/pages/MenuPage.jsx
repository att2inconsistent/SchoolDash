import { useState } from "react";
import { useMenu } from "../context/MenuContext";
import MenuFormModal from "../Component/Menu/MenuFormModal";
import { CATEGORIES, getCategoryLabel } from "../data/seed";
import { formatRupiah } from "../lib/format";
import "./MenuPage.css";

const dishIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 2v6a2 2 0 0 0 2 2v12M7 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2M11 2v20M17 2c-2 0-3 2-3 5v4c0 1.5 1 2 2 2h2v9" />
  </svg>
);

export default function MenuPage() {
  const { myMenus, addMenu, updateMenu, removeMenu, toggleMenu } = useMenu();

  const [category, setCategory] = useState("semua");
  const [modal, setModal] = useState(null); // { mode: "add" } | { mode: "edit", menu }
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const filtered =
    category === "semua"
      ? myMenus
      : myMenus.filter((m) => m.category === category);

  async function handleSave(data) {
    if (modal?.mode === "edit") {
      await updateMenu(modal.menu.id, data);
    } else {
      await addMenu(data);
    }
  }

  async function handleToggle(menu) {
    setError("");
    setBusyId(menu.id);
    try {
      await toggleMenu(menu.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setError("");
    setBusyId(toDelete.id);
    try {
      await removeMenu(toDelete.id);
      setToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="menu-page">
      <div className="section-header">
        <div className="menu-page-heading">
          <h1 className="section-title">Kelola Menu</h1>
          <span className="section-count">{myMenus.length} menu</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setModal({ mode: "add" })}
        >
          + Tambah Menu
        </button>
      </div>

      {/* Filter kategori */}
      <div className="chip-row menu-page-filter">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={"chip" + (category === c.key ? " active" : "")}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <div className="alert-error">{error}</div>}

      {myMenus.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">{dishIcon}</span>
          <p className="empty-state-title">Belum ada menu</p>
          <p className="empty-state-text">
            Tambahkan menu pertama kamu — nama, harga, dan kategorinya. Menu yang
            aktif akan tampil di aplikasi pembeli.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setModal({ mode: "add" })}
          >
            + Tambah Menu
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">
            Tidak ada menu kategori {getCategoryLabel(category)}
          </p>
          <p className="empty-state-text">
            Pilih kategori lain atau tambah menu baru.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={() => setCategory("semua")}>
            Tampilkan semua
          </button>
        </div>
      ) : (
        <div className="menu-list">
          {filtered.map((menu) => (
            <div className="menu-row card" key={menu.id}>
              <div className="menu-row-thumb">
                {menu.image ? (
                  <img src={menu.image} alt={menu.name} />
                ) : (
                  <span className="menu-row-thumb-icon">{dishIcon}</span>
                )}
              </div>

              <div className="menu-row-info">
                <div className="menu-row-top">
                  <span className="menu-row-name">{menu.name}</span>
                  <span className="badge badge--info">
                    {getCategoryLabel(menu.category)}
                  </span>
                </div>
                {menu.description && (
                  <p className="menu-row-desc">{menu.description}</p>
                )}
                <div className="menu-row-bottom">
                  <span className="menu-row-price">
                    {formatRupiah(menu.price)}
                  </span>
                  <span
                    className={
                      "menu-row-status " + (menu.active ? "on" : "off")
                    }
                  >
                    {menu.active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>

              <div className="menu-row-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setModal({ mode: "edit", menu })}
                >
                  Ubah
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleToggle(menu)}
                  disabled={busyId === menu.id}
                >
                  {menu.active ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setToDelete(menu)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal tambah / ubah */}
      {modal && (
        <MenuFormModal
          menu={modal.mode === "edit" ? modal.menu : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Konfirmasi hapus */}
      {toDelete && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setToDelete(null);
          }}
        >
          <div className="modal modal--sm" role="alertdialog" aria-modal="true">
            <div className="modal-header">
              <h2 className="modal-title">Hapus menu?</h2>
            </div>
            <p className="menu-delete-text">
              <strong>{toDelete.name}</strong> akan dihapus permanen dari
              daftar menu kamu.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setToDelete(null)}
                disabled={busyId === toDelete.id}
              >
                Batal
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={busyId === toDelete.id}
              >
                {busyId === toDelete.id ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
