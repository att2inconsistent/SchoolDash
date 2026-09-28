import React, { useState } from "react";
import "./CategoryFilter.css";

const icons = {
  semua: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 2v6a2 2 0 0 0 2 2v12M7 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2M11 2v20M17 2c-2 0-3 2-3 5v4c0 1.5 1 2 2 2h2v9" />
    </svg>
  ),
  beratMakanan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h20" />
      <path d="M4 12a8 4 0 0 1 16 0" />
      <path d="M12 8v.01M8.5 9.5v.01M15.5 9.5v.01" />
    </svg>
  ),
  minuman: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z" />
      <path d="M6 8a6 3 0 0 1 12 0" />
    </svg>
  ),
  cemilan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2c1 2.5-1 3.5-1 6a3 3 0 0 0 6 0c1.5 2 2 4 2 6a7 7 0 0 1-14 0c0-3 2-5 3-7 1-1.5 1-3 2-5.5z" />
    </svg>
  ),
  sehat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.8 8.6c0-2.5-2-4.6-4.6-4.6-1.6 0-3 .8-3.8 2-.8-1.2-2.2-2-3.8-2-2.6 0-4.6 2-4.6 4.6 0 5.4 8.4 10.4 8.4 10.4s8.4-5 8.4-10.4z" />
    </svg>
  ),
};

const categories = [
  { key: "semua", label: "Semua", icon: icons.semua },
  { key: "berat", label: "Makanan Berat", icon: icons.beratMakanan },
  { key: "minuman", label: "Minuman", icon: icons.minuman },
  { key: "cemilan", label: "Cemilan", icon: icons.cemilan },
  { key: "sehat", label: "Sehat", icon: icons.sehat },
];

export default function CategoryFilter({ onChange }) {
  const [active, setActive] = useState("semua");

  function handleSelect(key) {
    setActive(key);
    onChange && onChange(key);
  }

  return (
    <section className="category-filter">
      <h2 className="category-filter-title">Kategori Makanan</h2>

      <div className="category-filter-list">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={
              "category-item" + (active === cat.key ? " active" : "")
            }
            onClick={() => handleSelect(cat.key)}
          >
            <span className="category-item-icon">{cat.icon}</span>
            <span className="category-item-label">{cat.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}