import React from "react";
import MenuItem from "./MenuItem";
import "./VendorMenuPage.css";

const backIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const starIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L5.8 21l1.6-7L2 9.2l7.1-.6L12 2z" />
  </svg>
);

export default function VendorMenuPage({ vendor, menuItems, onBack }) {
  return (
    <div className="vendor-menu-page">
      <button className="vendor-menu-back" onClick={onBack}>
        <span className="vendor-menu-back-icon">{backIcon}</span>
        Kembali
      </button>

      <div className="vendor-menu-header">
        <div className="vendor-menu-header-image">
          {vendor.image && <img src={vendor.image} alt={vendor.name} />}
        </div>

        <div className="vendor-menu-header-info">
          <h1 className="vendor-menu-name">{vendor.name}</h1>
          <p className="vendor-menu-tags">{vendor.tags.join(" • ")}</p>
          <span className="vendor-menu-rating">
            <span className="vendor-menu-rating-icon">{starIcon}</span>
            {vendor.rating.toFixed(1)} • {vendor.time}
          </span>
        </div>
      </div>

      <section className="vendor-menu-list-card">
        <h2 className="vendor-menu-list-title">Menu Makanan</h2>
        {menuItems.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </section>
    </div>
  );
}