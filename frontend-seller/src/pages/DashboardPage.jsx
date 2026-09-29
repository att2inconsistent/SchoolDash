import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMenu } from "../context/MenuContext";
import { useWallet } from "../context/WalletContext";
import { useOrders } from "../context/OrderContext";
import { formatRupiah, formatDateTime } from "../lib/format";
import "./DashboardPage.css";

const icons = {
  store: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 9l1.5-5h13L20 9" />
      <path d="M4 9h16v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-4-1.5V9z" />
      <path d="M5 14v6h14v-6" />
    </svg>
  ),
  receipt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myVendor, menuCount, activeMenuCount } = useMenu();
  const { balance, totalEarned } = useWallet();
  const { orders, pendingCount, completedCount, revenue } = useOrders();

  const recentOrders = orders.slice(0, 4);

  return (
    <div className="dashboard">
      {/* --- Sapaan + aksi cepat --- */}
      <section className="dash-hero">
        <div className="dash-hero-text">
          <span className="dash-hero-store">
            <span className="dash-hero-store-icon">{icons.store}</span>
            {myVendor?.name || "Kantin kamu"}
          </span>
          <h1 className="dash-hero-title">
            Selamat Datang, {user?.name || "Penjual"}!
          </h1>
          <p className="dash-hero-subtitle">
            {pendingCount > 0
              ? `Ada ${pendingCount} pesanan yang menunggu diproses.`
              : "Semua pesanan sudah beres. Kerja bagus!"}
          </p>
        </div>

        <div className="dash-hero-actions">
          <button className="btn btn-ghost" onClick={() => navigate("/menu")}>
            Kelola Menu
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/pesanan")}
          >
            Pesanan Masuk
          </button>
        </div>
      </section>

      {/* --- Statistik --- */}
      <div className="stat-grid dash-stats">
        <div className="stat-card">
          <span className="stat-card-label">Saldo tersedia</span>
          <span className="stat-card-value">{formatRupiah(balance)}</span>
          <button
            className="dash-stat-link"
            onClick={() => navigate("/saldo")}
          >
            Tarik dana →
          </button>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Pesanan menunggu</span>
          <span className="stat-card-value">{pendingCount}</span>
          <span className="stat-card-hint">perlu kamu terima</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Pesanan selesai</span>
          <span className="stat-card-value">{completedCount}</span>
          <span className="stat-card-hint">
            {menuCount} menu ({activeMenuCount} aktif)
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Total pendapatan</span>
          <span className="stat-card-value">{formatRupiah(totalEarned)}</span>
          <span className="stat-card-hint">
            {revenue > 0
              ? `${formatRupiah(revenue)} dari pesanan selesai`
              : "total dana masuk"}
          </span>
        </div>
      </div>

      {/* --- Pesanan terbaru --- */}
      <section className="dash-section">
        <div className="section-header">
          <h2 className="section-title">Pesanan Terbaru</h2>
          {orders.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate("/pesanan")}
            >
              Lihat semua
            </button>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">{icons.receipt}</span>
            <p className="empty-state-title">Belum ada pesanan masuk</p>
            <p className="empty-state-text">
              Pesanan dari pembeli akan muncul di sini. Di mode demo, kamu bisa
              memuat pesanan contoh dari halaman Pesanan.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/pesanan")}
            >
              Buka Pesanan
            </button>
          </div>
        ) : (
          <div className="dash-orders card">
            {recentOrders.map((order) => (
              <div className="dash-order-row" key={order.id}>
                <div className="dash-order-main">
                  <span className="dash-order-id">{order.id}</span>
                  <span className="dash-order-meta">
                    {order.buyer?.name} • {formatDateTime(order.createdAt)}
                  </span>
                </div>
                <span className="dash-order-total">
                  {formatRupiah(order.total)}
                </span>
                <span
                  className={
                    "badge " +
                    (order.status === "Menunggu"
                      ? "badge--pending"
                      : "badge--done")
                  }
                >
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
