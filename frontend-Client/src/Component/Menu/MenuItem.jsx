import React from "react";
import { useCart } from "../../context/CartContext";
import "./MenuItem.css";

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

export default function MenuItem({ item }) {
  const { items, addItem, increaseQty, decreaseQty } = useCart();

  const cartItem = items.find((it) => it.id === item.id);
  const qty = cartItem ? cartItem.qty : 0;

  function handleAdd() {
    addItem(item);
  }

  return (
    <div className="menu-item">
      <div className="menu-item-image">
        {item.image && <img src={item.image} alt={item.name} />}
      </div>

      <div className="menu-item-info">
        <span className="menu-item-name">{item.name}</span>
        {item.description && (
          <p className="menu-item-desc">{item.description}</p>
        )}
        <span className="menu-item-price">{formatRupiah(item.price)}</span>
      </div>

      <div className="menu-item-action">
        {qty === 0 ? (
          <button className="menu-item-add-btn" onClick={handleAdd}>
            + Tambah
          </button>
        ) : (
          <div className="menu-item-qty">
            <button
              className="menu-item-qty-btn"
              onClick={() => decreaseQty(item.id)}
              aria-label="Kurangi jumlah"
            >
              −
            </button>
            <span className="menu-item-qty-value">{qty}</span>
            <button
              className="menu-item-qty-btn"
              onClick={() => increaseQty(item.id)}
              aria-label="Tambah jumlah"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}