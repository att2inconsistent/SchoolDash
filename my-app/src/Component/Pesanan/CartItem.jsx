import React from "react";
import "./CartItem.css";

const trashIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" />
  </svg>
);

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {item.image && <img src={item.image} alt={item.name} />}
      </div>

      <div className="cart-item-info">
        <span className="cart-item-name">{item.name}</span>
        <span className="cart-item-vendor">{item.vendor}</span>

        <div className="cart-item-qty">
          <button
            className="cart-item-qty-btn"
            onClick={() => onDecrease(item.id)}
            aria-label="Kurangi jumlah"
          >
            −
          </button>
          <span className="cart-item-qty-value">{item.qty}</span>
          <button
            className="cart-item-qty-btn"
            onClick={() => onIncrease(item.id)}
            aria-label="Tambah jumlah"
          >
            +
          </button>
        </div>
      </div>

      <div className="cart-item-right">
        <span className="cart-item-price">
          {formatRupiah(item.price * item.qty)}
        </span>
        <button
          className="cart-item-remove"
          onClick={() => onRemove(item.id)}
          aria-label="Hapus item"
        >
          {trashIcon}
        </button>
      </div>
    </div>
  );
}