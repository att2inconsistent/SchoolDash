import React, { useState, useRef, useEffect } from "react";
import "./Topbar.css";

const icons = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
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

export default function Topbar({
  user,
  hasNotification = true,
  onSearch,
  onLogout,
  onLoginClick,
  onRegisterClick,
}) {
  const [query, setQuery] = useState("");
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

  function handleSubmit(e) {
    e.preventDefault();
    onSearch && onSearch(query);
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="topbar">
      <form className="topbar-search" onSubmit={handleSubmit}>
        <span className="topbar-search-icon">{icons.search}</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari makanan atau kantin..."
        />
      </form>

      <div className="topbar-right">
        <button className="topbar-bell" aria-label="Notifikasi">
          {icons.bell}
          {hasNotification && <span className="topbar-bell-dot" />}
        </button>

        {user ? (
          <div className="topbar-profile" ref={menuRef}>
            <button
              className="topbar-profile-trigger"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <div className="topbar-profile-text">
                <span className="topbar-profile-name">{user?.name}</span>
                <span className="topbar-profile-role">{user?.kelas}</span>
              </div>
              <div className="topbar-avatar">{initials}</div>
              <span className="topbar-chevron">{icons.chevron}</span>
            </button>

            {menuOpen && (
              <div className="topbar-dropdown">
                <button className="topbar-dropdown-item">Profil Saya</button>
                <button className="topbar-dropdown-item">Pengaturan</button>
                <button
                  className="topbar-dropdown-item danger"
                  onClick={onLogout}
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="topbar-auth-buttons">
            <button className="topbar-login-btn" onClick={onLoginClick}>
              Masuk
            </button>
            <button className="topbar-register-btn" onClick={onRegisterClick}>
              Daftar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}