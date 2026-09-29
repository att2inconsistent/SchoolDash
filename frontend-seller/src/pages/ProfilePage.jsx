import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMenu } from "../context/MenuContext";
import { useOrders } from "../context/OrderContext";
import { useWallet } from "../context/WalletContext";
import { formatRupiah } from "../lib/format";
import "./ProfilePage.css";

const starIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L5.8 21l1.6-7L2 9.2l7.1-.6L12 2z" />
  </svg>
);

export default function ProfilePage() {
  const { user, changePassword } = useAuth();
  const { myVendor, updateVendor, menuCount, activeMenuCount } = useMenu();
  const { orders } = useOrders();
  const { totalEarned } = useWallet();

  // --- Data toko ---
  const [editingStore, setEditingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: myVendor?.name || "",
    tags: (myVendor?.tags || []).join(", "),
  });
  const [storeError, setStoreError] = useState("");
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState("");

  // --- Ganti password ---
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  async function handleSaveStore(e) {
    e.preventDefault();
    setStoreError("");
    setStoreSuccess("");
    setStoreSaving(true);
    try {
      await updateVendor(storeForm);
      setStoreSuccess("Data toko berhasil disimpan.");
      setEditingStore(false);
    } catch (err) {
      setStoreError(err.message);
    } finally {
      setStoreSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (pwd.next !== pwd.confirm) {
      setPwdError("Konfirmasi password baru tidak sama.");
      return;
    }

    setPwdSaving(true);
    try {
      await changePassword(pwd.current, pwd.next);
      setPwdSuccess("Password berhasil diganti.");
      setPwd({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setPwdSaving(false);
    }
  }

  return (
    <div className="profile-page">
      {/* --- Kartu toko --- */}
      <section className="card profile-store">
        <div className="profile-store-head">
          <div className="profile-store-avatar">{initials}</div>
          <div className="profile-store-info">
            <h1 className="profile-store-name">
              {myVendor?.name || user?.storeName || "-"}
            </h1>
            <p className="profile-store-tags">
              {(myVendor?.tags || []).join(" • ") || "Belum ada tag jualan"}
            </p>
            <div className="profile-store-meta">
              <span className="profile-store-rating">
                <span className="profile-store-star">{starIcon}</span>
                {Number(myVendor?.rating || 0).toFixed(1)}
              </span>
              <span>{myVendor?.time || "-"}</span>
              <span>{user?.email}</span>
            </div>
          </div>
          {!editingStore && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setStoreForm({
                  name: myVendor?.name || "",
                  tags: (myVendor?.tags || []).join(", "),
                });
                setStoreError("");
                setStoreSuccess("");
                setEditingStore(true);
              }}
            >
              Ubah Data Toko
            </button>
          )}
        </div>

        {editingStore ? (
          <form className="profile-store-form" onSubmit={handleSaveStore}>
            {storeError && <div className="alert-error">{storeError}</div>}
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="store-name">Nama kantin</label>
                <input
                  id="store-name"
                  type="text"
                  value={storeForm.name}
                  onChange={(e) =>
                    setStoreForm((p) => ({ ...p, name: e.target.value }))
                  }
                  minLength={3}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="store-tags">Tag jualan (pisahkan koma)</label>
                <input
                  id="store-tags"
                  type="text"
                  placeholder="Nasi goreng, Ayam geprek"
                  value={storeForm.tags}
                  onChange={(e) =>
                    setStoreForm((p) => ({ ...p, tags: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="profile-store-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditingStore(false)}
                disabled={storeSaving}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={storeSaving}
              >
                {storeSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        ) : (
          storeSuccess && <div className="alert-success">{storeSuccess}</div>
        )}
      </section>

      {/* --- Statistik toko --- */}
      <div className="profile-stats">
        <div className="stat-card">
          <span className="stat-card-label">Menu</span>
          <span className="stat-card-value">{menuCount}</span>
          <span className="stat-card-hint">{activeMenuCount} aktif</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Pesanan</span>
          <span className="stat-card-value">{orders.length}</span>
          <span className="stat-card-hint">sejak bergabung</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Pendapatan</span>
          <span className="stat-card-value">{formatRupiah(totalEarned)}</span>
          <span className="stat-card-hint">total dana masuk</span>
        </div>
      </div>

      {/* --- Ganti password --- */}
      <section className="card profile-password">
        <div className="section-header">
          <h2 className="section-title">Ganti Password</h2>
        </div>

        {pwdError && <div className="alert-error">{pwdError}</div>}
        {pwdSuccess && <div className="alert-success">{pwdSuccess}</div>}

        <form className="profile-password-form" onSubmit={handleChangePassword}>
          <div className="form-field">
            <label htmlFor="pwd-current">Password saat ini</label>
            <input
              id="pwd-current"
              type="password"
              placeholder="••••••••"
              value={pwd.current}
              onChange={(e) =>
                setPwd((p) => ({ ...p, current: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="pwd-next">Password baru</label>
              <input
                id="pwd-next"
                type="password"
                placeholder="Minimal 8 karakter"
                minLength={8}
                value={pwd.next}
                onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="pwd-confirm">Ulangi password baru</label>
              <input
                id="pwd-confirm"
                type="password"
                placeholder="Sama dengan di atas"
                minLength={8}
                value={pwd.confirm}
                onChange={(e) =>
                  setPwd((p) => ({ ...p, confirm: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={pwdSaving}
          >
            {pwdSaving ? "Menyimpan..." : "Simpan Password"}
          </button>
        </form>
      </section>
    </div>
  );
}
