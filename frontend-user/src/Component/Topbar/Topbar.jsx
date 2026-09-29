import { useState, useRef, useEffect } from "react";
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
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
};

export default function Topbar({
  user,
  hasNotification = true,
  searchQuery = "",
  onSearchChange,
  onLogout,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
}) {
  // Teks di input disimpan lokal supaya ketikan selalu terasa instan;
  // URL (?q=...) adalah penyimpanan hasil pencarian yang awet (anti-refresh).
  const [query, setQuery] = useState(searchQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sinkron URL -> input HANYA kalau perubahan datang dari luar (misal tombol
  // "Hapus filter" di Beranda, tombol X ini, atau tombol Back browser).
  // Kalau input sedang fokus, perubahan URL hanya "echo" dari ketikan kita
  // sendiri — jangan ditimpa, atau ketikan cepat bisa hilang.
  useEffect(() => {
    setQuery((current) => {
      if (current === searchQuery) return current;
      if (document.activeElement === inputRef.current) return current;
      return searchQuery;
    });
  }, [searchQuery]);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    onSearchChange && onSearchChange(value);
  }

  function handleClear() {
    setQuery("");
    onSearchChange && onSearchChange("");
    inputRef.current && inputRef.current.focus();
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSearchChange && onSearchChange(query);
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
    <header className="topbar" data-intro="topbar">
      <form className="topbar-search" onSubmit={handleSubmit} role="search">
        <span className="topbar-search-icon">{icons.search}</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Cari makanan / vendor..."
          aria-label="Cari makanan atau nama vendor"
        />
        {query && (
          <button
            type="button"
            className="topbar-search-clear"
            onClick={handleClear}
            aria-label="Bersihkan pencarian"
          >
            {icons.close}
          </button>
        )}
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
                <button
                  className="topbar-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onProfileClick && onProfileClick();
                  }}
                >
                  Profil Saya
                </button>
                <button
                  className="topbar-dropdown-item"
                  onClick={() => setMenuOpen(false)}
                >
                  Pengaturan
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
