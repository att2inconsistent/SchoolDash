import React from "react";
import "./BalanceCard.css";

const walletIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3" />
    <path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-4a2 2 0 1 0 0 4h5" />
  </svg>
);

function formatRupiah(value) {
  // Kalau belum login (balance null/undefined), tampilkan strip saja
  if (value === null || value === undefined) return "-";
  return "Rp" + Number(value).toLocaleString("id-ID");
}

export default function BalanceCard({ balance, onTopUp }) {
  const isLoggedIn = balance !== null && balance !== undefined;

  return (
    <div className="balance-card">
      <div className="balance-card-icon">{walletIcon}</div>

      <div className="balance-card-info">
        <span className="balance-card-label">Saldo Anda</span>
        <span className="balance-card-amount">{formatRupiah(balance)}</span>
      </div>

      {isLoggedIn && (
        <button className="balance-card-button" onClick={onTopUp}>
          Isi Saldo
        </button>
      )}
    </div>
  );
}