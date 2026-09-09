import React from "react";
import { useCart } from "../../context/CartContext";
import "./FloatingCartBar.css";

const cartIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
  </svg>
);

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

export default function FloatingCartBar({ onViewCart }) {
  const { totalItems, subtotal } = useCart();

  if (totalItems === 0) return null;

  return (
    <button className="floating-cart-bar" onClick={onViewCart}>
      <span className="floating-cart-bar-left">
        <span className="floating-cart-bar-icon">
          {cartIcon}
          <span className="floating-cart-bar-badge">{totalItems}</span>
        </span>
        <span className="floating-cart-bar-text">
          {totalItems} item ditambahkan
        </span>
      </span>

      <span className="floating-cart-bar-right">
        <span className="floating-cart-bar-price">
          {formatRupiah(subtotal)}
        </span>
        <span className="floating-cart-bar-label">Lihat Keranjang →</span>
      </span>
    </button>
  );
}