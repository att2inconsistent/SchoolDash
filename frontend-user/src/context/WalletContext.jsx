/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { readJSON, writeJSON, STORAGE_KEYS } from "../lib/storage";

const WalletContext = createContext(null);

/**
 * ==========================================================================
 *  PLACEHOLDER WALLET — belum tersambung ke backend / payment gateway asli.
 *  Tim backend nanti tinggal mengganti ISI fungsi createTopUp & confirmTopUp
 *  (mis. pakai Midtrans / Xendit / Tripay untuk QRIS dinamis). TopUpPage
 *  hanya memanggil dua fungsi ini, jadi UI tidak perlu diubah.
 *
 *  Saldo disimpan per-email di localStorage supaya tidak hilang saat refresh.
 * ==========================================================================
 */

export function WalletProvider({ children }) {
  const { user } = useAuth();
  // { email: saldo } dan { idTransaksi: { email, amount } }
  const [balances, setBalances] = useState(() =>
    readJSON(STORAGE_KEYS.balances, {})
  );
  const [transactions, setTransactions] = useState(() =>
    readJSON(STORAGE_KEYS.transactions, {})
  );

  // Sinkronkan ke localStorage (side effect ke sistem eksternal = pola yang benar)
  useEffect(() => {
    writeJSON(STORAGE_KEYS.balances, balances);
  }, [balances]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.transactions, transactions);
  }, [transactions]);

  function createTopUp(amount) {
    // TODO(backend): ganti dengan POST /api/topup -> kembalikan data QRIS asli
    // (string QRIS / URL gambar QR dari payment gateway) + waktu kedaluwarsa.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!user) {
          reject(new Error("Silakan login terlebih dahulu."));
          return;
        }
        const id = "TRX-" + Date.now();
        setTransactions((prev) => ({
          ...prev,
          [id]: { email: user.email, amount },
        }));
        resolve({
          id,
          amount,
          // Ini BUKAN QRIS asli, hanya teks contoh supaya QR bisa ditampilkan.
          qrisPayload: `SCHOOLDESK-DEMO-QRIS|${id}|${amount}`,
          expiresAt: Date.now() + 15 * 60 * 1000, // berlaku 15 menit
        });
      }, 600);
    });
  }

  function confirmTopUp(transactionId) {
    // TODO(backend): ganti dengan cek status pembayaran (polling GET
    // /api/topup/:id/status atau webhook dari payment gateway).
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const trx = transactions[transactionId];
        if (!trx) {
          reject(new Error("Transaksi tidak ditemukan."));
          return;
        }

        const newBalance = (balances[trx.email] ?? 0) + trx.amount;
        setBalances((prev) => ({ ...prev, [trx.email]: newBalance }));
        setTransactions((prev) => {
          const next = { ...prev };
          delete next[transactionId];
          return next;
        });
        resolve(newBalance);
      }, 1500);
    });
  }

  const value = {
    // null = belum login (BalanceCard akan menampilkan strip "-")
    balance: user ? (balances[user.email] ?? 0) : null,
    createTopUp,
    confirmTopUp,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet harus dipanggil di dalam <WalletProvider>");
  }
  return ctx;
}
