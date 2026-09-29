import { useLocation, useNavigate } from "react-router-dom";
import "./BottomNav.css";

const icons = {
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

const items = [
  { key: "beranda", label: "Beranda", path: "/", icon: icons.beranda },
  { key: "pesanan", label: "Pesanan", path: "/pesanan", icon: icons.pesanan },
  { key: "profil", label: "Profil", path: "/profil", icon: icons.profil },
];

function isActive(pathname, path) {
  if (path === "/") return pathname === "/" || pathname.startsWith("/menu");
  return pathname === path;
}

/**
 * Navigasi bawah untuk handphone. Sidebar (desktop) disembunyikan lewat CSS
 * di bawah 768px, komponen ini yang menggantikan perannya.
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
