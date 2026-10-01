import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrderContext";
import CartItem from "./CartItem";
import "./PesananSayaPage.css";

const emptyCartIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
  </svg>
);

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

const checkIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export default function PesananSayaPage() {
  const {
    items,
    increaseQty,
    decreaseQty,
    removeItem,
    subtotal,
    totalItems,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const [placedOrder, setPlacedOrder] = useState(null);

  // Tanpa biaya layanan, total = subtotal (backend orders/service.ts juga
  // menyimpan total = subtotal, jadi angka di sini sama dengan yang disimpan).
  const total = subtotal;

  function handleCheckout() {
    if (items.length === 0) return;

    // Riwayat pesanan disimpan per-user, jadi wajib login dulu.
    if (!user) {
      navigate("/login", {
        state: {
          from: "/pesanan",
          message: "Silakan login dulu supaya pesananmu tersimpan di riwayat.",
        },
      });
      return;
    }

    // TODO: sambungkan ke API pemesanan/pembayaran di sini
    const order = createOrder({ items, total });
    clearCart();
    setPlacedOrder(order);
  }

  return (
    <div className="pesanan-page">
      <h1 className="pesanan-page-title">Pesanan Saya</h1>
      <p className="pesanan-page-subtitle">
        {items.length > 0
          ? `${totalItems} item di keranjang kamu`
          : "Keranjang kamu masih kosong"}
      </p>

      {placedOrder && (
        <div className="pesanan-success">
          <span className="pesanan-success-icon">{checkIcon}</span>
          <div className="pesanan-success-text">
            <strong>Pesanan berhasil dibuat!</strong>
            <span>
              {placedOrder.id} • {formatRupiah(placedOrder.total)} •{" "}
              {placedOrder.totalItems} item
            </span>
          </div>
          <div className="pesanan-success-actions">
            <button
              className="pesanan-success-link"
              onClick={() => navigate("/profil")}
            >
              Lihat Riwayat
            </button>
            <button
              className="pesanan-success-dismiss"
              onClick={() => setPlacedOrder(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <div className="pesanan-page-layout">
        <section className="pesanan-list-card">
          {items.length === 0 ? (
            <div className="pesanan-empty">
              <span className="pesanan-empty-icon">{emptyCartIcon}</span>
              <p className="pesanan-empty-text">
                Belum ada makanan di keranjang. Yuk pilih menu favoritmu dari
                halaman Beranda!
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onIncrease={increaseQty}
                onDecrease={decreaseQty}
                onRemove={removeItem}
              />
            ))
          )}
        </section>

        {items.length > 0 && (
          <aside className="pesanan-summary-card">
            <h2 className="pesanan-summary-title">Ringkasan Pesanan</h2>

            <div className="pesanan-summary-divider" />

            <div className="pesanan-summary-row pesanan-summary-total">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>

            <button className="pesanan-checkout-btn" onClick={handleCheckout}>
              Pesan Sekarang
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}
