import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrderContext";
import "./ProfilePage.css";

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

function formatDate(iso) {
  const date = new Date(iso);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const icons = {
  order: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2h12l1 5H5l1-5z" />
      <path d="M5 7v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7" />
      <path d="M9 11a3 3 0 0 0 6 0" />
    </svg>
  ),
  item: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="17" cy="14.5" r="1.2" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  receipt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
};

/**
 * Halaman Profil — hanya bisa dibuka kalau sudah login
 * (dikunci oleh RequireAuth di App.jsx).
 *
 * Berisi: identitas (nama & kelas), jumlah pemesanan, riwayat pemesanan,
 * dan fitur ganti password.
 */
export default function ProfilePage() {
  const { user, logout, changePassword } = useAuth();
  const { orders, totalOrders, totalItemsBought, totalSpent } = useOrders();
  const navigate = useNavigate();

  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [notice, setNotice] = useState(null); // { type, text }
  const [loading, setLoading] = useState(false);

  const initials = (user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (notice) setNotice(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice(null);

    if (form.next !== form.confirm) {
      setNotice({ type: "error", text: "Konfirmasi password baru tidak sama." });
      return;
    }

    setLoading(true);
    try {
      await changePassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      setNotice({ type: "success", text: "Password berhasil diganti." });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="profile-page">
      {/* ---------------- IDENTITAS ---------------- */}
      <header className="profile-hero">
        <div className="profile-avatar">{initials}</div>

        <div className="profile-hero-info">
          <h1 className="profile-name">{user?.name}</h1>
          <div className="profile-meta">
            <span className="profile-chip">{user?.kelas || "-"}</span>
            <span className="profile-email">{user?.email}</span>
          </div>
        </div>

        <button className="profile-logout" onClick={handleLogout}>
          Keluar
        </button>
      </header>

      {/* ---------------- STATISTIK ---------------- */}
      <section className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-icon">{icons.order}</span>
          <span className="profile-stat-value">{totalOrders}</span>
          <span className="profile-stat-label">Kali sudah pesan</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-icon">{icons.item}</span>
          <span className="profile-stat-value">{totalItemsBought}</span>
          <span className="profile-stat-label">Item dibeli</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-icon">{icons.wallet}</span>
          <span className="profile-stat-value">{formatRupiah(totalSpent)}</span>
          <span className="profile-stat-label">Total belanja</span>
        </div>
      </section>

      <div className="profile-grid">
        {/* ---------------- RIWAYAT PESANAN ---------------- */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">Riwayat Pemesanan</h2>
            <span className="profile-card-count">{orders.length} pesanan</span>
          </div>

          {orders.length === 0 ? (
            <div className="profile-empty">
              <span className="profile-empty-icon">{icons.receipt}</span>
              <p className="profile-empty-text">
                Belum ada pesanan. Yuk pesan makanan pertamamu di kantin!
              </p>
              <button
                className="profile-empty-btn"
                onClick={() => navigate("/")}
              >
                Pesan Sekarang
              </button>
            </div>
          ) : (
            <div className="profile-order-list">
              {orders.map((order) => (
                <article className="profile-order" key={order.id}>
                  <div className="profile-order-top">
                    <span className="profile-order-id">{order.id}</span>
                    <span className="profile-order-status">{order.status}</span>
                  </div>

                  <ul className="profile-order-items">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        <span className="profile-order-qty">{item.qty}×</span>
                        <span className="profile-order-name">{item.name}</span>
                        <span className="profile-order-price">
                          {formatRupiah(item.price * item.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="profile-order-bottom">
                    <span className="profile-order-date">
                      {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
                    </span>
                    <span className="profile-order-total">
                      {formatRupiah(order.total)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- GANTI PASSWORD ---------------- */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">Ganti Password</h2>
            <span className="profile-card-icon">{icons.lock}</span>
          </div>

          {notice && (
            <div className={"profile-msg profile-msg--" + notice.type}>
              {notice.text}
            </div>
          )}

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-field">
              <label htmlFor="current-password">Password Saat Ini</label>
              <input
                id="current-password"
                name="current"
                type="password"
                placeholder="••••••••"
                value={form.current}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="new-password">Password Baru</label>
              <input
                id="new-password"
                name="next"
                type="password"
                placeholder="Minimal 8 karakter"
                value={form.next}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="confirm-password">Ulangi Password Baru</label>
              <input
                id="confirm-password"
                name="confirm"
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <button
              className="profile-primary-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
