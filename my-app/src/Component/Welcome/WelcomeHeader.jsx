import React from "react";
import BalanceCard from "../Balance/Balancecard";
import "./WelcomeHeader.css";

const pinIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export default function WelcomeHeader({ schoolName, userName, balance, onTopUp }) {
  return (
    <section className="welcome-header">
      <div className="welcome-header-text">
        <span className="welcome-header-location">
          <span className="welcome-header-location-icon">{pinIcon}</span>
          {schoolName}
        </span>
        <h1 className="welcome-header-title">Selamat Datang, {userName}!</h1>
        <p className="welcome-header-subtitle">
          Sudah lapar hari ini? Yuk, cek menu kantin favoritmu.
        </p>
      </div>

      <BalanceCard balance={balance} onTopUp={onTopUp} />
    </section>
  );
}