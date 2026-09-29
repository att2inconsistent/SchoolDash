import { useLocation, useNavigate } from "react-router-dom";
import "./BottomNav.css";

const icons = {
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

const items = [
  { key: "dashboard", label: "Beranda", path: "/", icon: icons.dashboard },
  { key: "menu", label: "Menu", path: "/menu", icon: icons.menu },
  { key: "pesanan", label: "Pesanan", path: "/pesanan", icon: icons.pesanan },
  { key: "saldo", label: "Saldo", path: "/saldo", icon: icons.saldo },
  { key: "profil", label: "Profil", path: "/profil", icon: icons.profil },
];

function isActive(pathname, path) {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(path + "/");
}

/**
 * Navigasi bawah untuk handphone (<768px), menggantikan sidebar.
 * Sama seperti frontend-user tapi itemnya menyesuaikan kebutuhan seller.
 */
export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav" data-intro="bottomnav">
      {items.map((item) => (
        <button
          key={item.key}
          className={
            "bottom-nav-item" + (isActive(pathname, item.path) ? " active" : "")
          }
          onClick={() => navigate(item.path)}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
