import React from "react";
import "./Sidebar.css";

// Ganti/isi ikon sesuai kebutuhan. Di sini pakai SVG inline supaya
// tidak perlu install library ikon tambahan (silakan ganti dengan
// lucide-react atau react-icons kalau proyekmu sudah pakai itu).
const icons = {
  logo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 2v6a2 2 0 0 0 2 2v12M7 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2M11 2v20M17 2c-2 0-3 2-3 5v4c0 1.5 1 2 2 2h2v9" />
    </svg>
  ),
  beranda: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  pesanan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 4v4M16 4v4" />
    </svg>
  ),
  profil: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
};

const menuItems = [
  { key: "beranda", label: "Beranda", icon: icons.beranda },
  { key: "pesanan", label: "Pesanan Saya", icon: icons.pesanan },
  { key: "profil", label: "Profil", icon: icons.profil },
];

export default function Sidebar({ activeKey = "beranda", onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo-icon">{icons.logo}</span>
        <span className="sidebar-logo-text">SchoolDesk</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={
              "sidebar-item" + (activeKey === item.key ? " active" : "")
            }
            onClick={() => onNavigate && onNavigate(item.key)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}