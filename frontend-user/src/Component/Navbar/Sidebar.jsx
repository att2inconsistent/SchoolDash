import { useLocation, useNavigate } from "react-router-dom";
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
  { key: "beranda", label: "Beranda", path: "/", icon: icons.beranda },
  { key: "pesanan", label: "Pesanan Saya", path: "/pesanan", icon: icons.pesanan },
  { key: "profil", label: "Profil", path: "/profil", icon: icons.profil },
];

// Halaman detail menu (/menu/1, /menu/2, ...) tetap menyorot "Beranda".
function isActive(pathname, path) {
  if (path === "/") return pathname === "/" || pathname.startsWith("/menu");
  return pathname === path;
}

/**
 * Sidebar desktop. Navigasi sekarang lewat URL (react-router),
 * jadi halaman bisa di-refresh / dibuka langsung lewat link.
 */
export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="sidebar" data-intro="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo-icon">{icons.logo}</span>
        <span className="sidebar-logo-text">SchoolDesk</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={
              "sidebar-item" + (isActive(pathname, item.path) ? " active" : "")
            }
            onClick={() => navigate(item.path)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
