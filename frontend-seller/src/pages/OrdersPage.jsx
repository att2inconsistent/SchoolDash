import { useState } from "react";
import { useOrders } from "../context/OrderContext";
import { formatRupiah, formatDateTime } from "../lib/format";
import "./OrdersPage.css";

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "Menunggu", label: "Menunggu" },
  { key: "Selesai", label: "Selesai" },
];

const receiptIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

export default function OrdersPage() {
  const { orders, acceptOrder, loadDemoOrders } = useOrders();

  const [filter, setFilter] = useState("semua");
  const [busyId, setBusyId] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const counts = {
    semua: orders.length,
    Menunggu: orders.filter((o) => o.status === "Menunggu").length,
    Selesai: orders.filter((o) => o.status === "Selesai").length,
  };
  const filtered =
    filter === "semua" ? orders : orders.filter((o) => o.status === filter);

  async function handleAccept(order) {
    setError("");
    setSuccess("");
    setBusyId(order.id);
    try {
      const accepted = await acceptOrder(order.id);
      setSuccess(
        `Pesanan ${accepted.id} diterima — ${formatRupiah(
          accepted.total
        )} masuk ke saldo kamu.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleLoadDemo() {
    setError("");
    setSuccess("");
    setLoadingDemo(true);
    try {
      const order = await loadDemoOrders();
      setSuccess(`Pesanan contoh ${order.id} berhasil dimuat.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <div className="orders-page">
      <div className="section-header">
        <div className="orders-page-heading">
          <h1 className="section-title">Pesanan Masuk</h1>
          {counts.Menunggu > 0 && (
            <span className="section-count">{counts.Menunggu} menunggu</span>
          )}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleLoadDemo}
          disabled={loadingDemo}
          title="Placeholder: pesanan dari pembeli belum tersambung (belum ada backend)"
        >
          {loadingDemo ? "Memuat..." : "+ Muat pesanan contoh"}
        </button>
      </div>

      <div className="chip-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={"chip" + (filter === f.key ? " active" : "")}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">{receiptIcon}</span>
          <p className="empty-state-title">
            {filter === "semua"
              ? "Belum ada pesanan masuk"
              : `Tidak ada pesanan berstatus ${filter}`}
          </p>
          <p className="empty-state-text">
            Pesanan dari pembeli akan langsung muncul di sini. Untuk demo,
            gunakan tombol &ldquo;Muat pesanan contoh&rdquo; di atas.
          </p>
        </div>
      ) : (
        <div className="order-list">
          {filtered.map((order) => (
            <article className="order-card card" key={order.id}>
              <header className="order-card-top">
                <div className="order-card-code">
                  <span className="order-card-id">{order.id}</span>
                  <span className="order-card-time">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
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
              </header>

              <p className="order-card-buyer">
                Pembeli: <strong>{order.buyer?.name || "-"}</strong>
                {order.buyer?.kelas ? ` • ${order.buyer.kelas}` : ""}
              </p>

              <ul className="order-card-items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-qty">{item.qty}x</span>
                    <span className="order-item-sum">
                      {formatRupiah(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <footer className="order-card-footer">
                <div className="order-card-total">
                  <span>Total</span>
                  <strong>{formatRupiah(order.total)}</strong>
                </div>

                {order.status === "Menunggu" ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAccept(order)}
                    disabled={busyId === order.id}
                  >
                    {busyId === order.id
                      ? "Memproses..."
                      : "✓ Terima Pesanan"}
                  </button>
                ) : (
                  <span className="order-card-note">
                    Dana sudah masuk ke saldo
                  </span>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
