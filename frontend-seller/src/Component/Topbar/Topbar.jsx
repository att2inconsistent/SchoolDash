import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Topbar.css";

const icons = {
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
};

/**
 * Topbar seller — tanpa kolom pencarian (berbeda dengan frontend-user).
 * Lonceng menampilkan jumlah pesanan MENUNGGU, klik → halaman Pesanan Masuk.
 */
export default function Topbar({
  user,
  storeName,
  pendingCount = 0,
  onLogout,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="topbar" data-intro="topbar">
      <div className="topbar-store">
        <span className="topbar-store-label">Toko</span>
        <span className="topbar-store-name">{storeName || "-"}</span>
      </div>

      <div className="topbar-right">
        <button
          className="topbar-bell"
          aria-label={`Pesanan menunggu: ${pendingCount}`}
          onClick={() => navigate("/pesanan")}
        >
          {icons.bell}
          {pendingCount > 0 && (
            <span className="topbar-bell-dot">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>

        <div className="topbar-profile" ref={menuRef}>
          <button
            className="topbar-profile-trigger"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <div className="topbar-profile-text">
              <span className="topbar-profile-name">{user?.name}</span>
              <span className="topbar-profile-role">{storeName || "Penjual"}</span>
            </div>
            <div className="topbar-avatar">{initials}</div>
            <span className="topbar-chevron">{icons.chevron}</span>
          </button>

          {menuOpen && (
            <div className="topbar-dropdown">
              <button
                className="topbar-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profil");
                }}
              >
                Profil Toko
              </button>
              <button
                className="topbar-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/menu");
                }}
              >
                Kelola Menu
              </button>
              <button
                className="topbar-dropdown-item danger"
                onClick={onLogout}
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
