import { useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";

// Ikon SVG inline — tanpa library ikon tambahan (sama seperti frontend-user).
const icons = {
  logo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 2v6a2 2 0 0 0 2 2v12M7 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2M11 2v20M17 2c-2 0-3 2-3 5v4c0 1.5 1 2 2 2h2v9" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="11" width="7" height="10" rx="1.5" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  pesanan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
  saldo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="17" cy="14.5" r="1.3" />
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
  { key: "dashboard", label: "Dashboard", path: "/", icon: icons.dashboard },
  { key: "menu", label: "Menu Makanan", path: "/menu", icon: icons.menu },
  { key: "pesanan", label: "Pesanan Masuk", path: "/pesanan", icon: icons.pesanan },
  { key: "saldo", label: "Saldo & Penarikan", path: "/saldo", icon: icons.saldo },
  { key: "profil", label: "Profil Toko", path: "/profil", icon: icons.profil },
];

function isActive(pathname, path) {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(path + "/");
}

/** Sidebar desktop — gaya & perilaku sama dengan frontend-user. */
export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="sidebar" data-intro="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo-icon">{icons.logo}</span>
        <span className="sidebar-logo-text">
          SchoolDesk <span className="sidebar-logo-tag">Seller</span>
        </span>
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
