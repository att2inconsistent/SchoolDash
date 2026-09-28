import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const WalletContext = createContext(null);

/**
 * ==========================================================================
 *  PLACEHOLDER WALLET — belum tersambung ke backend / payment gateway asli.
 *  Tim backend nanti tinggal mengganti ISI fungsi createTopUp & confirmTopUp
 *  (mis. pakai Midtrans / Xendit / Tripay untuk QRIS dinamis). TopUpPage
 *  hanya memanggil dua fungsi ini, jadi UI tidak perlu diubah.
 * ==========================================================================
 */

// Penyimpanan sementara (hilang saat refresh)
let fakeBalances = {}; // { email: saldo }
let fakeTransactions = {}; // { idTransaksi: { email, amount } }

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);

  // Ambil saldo milik user yang sedang login
  useEffect(() => {
    if (user) {
      setBalance(fakeBalances[user.email] ?? 0);
    } else {
      setBalance(0);
    }
  }, [user]);

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
        fakeTransactions[id] = { email: user.email, amount };
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
        const trx = fakeTransactions[transactionId];
        if (!trx) {
          reject(new Error("Transaksi tidak ditemukan."));
          return;
        }
        const newBalance = (fakeBalances[trx.email] ?? 0) + trx.amount;
        fakeBalances[trx.email] = newBalance;
        delete fakeTransactions[transactionId];
        setBalance(newBalance);
        resolve(newBalance);
      }, 1500);
    });
  }

  const value = {
    // null = belum login (BalanceCard akan menampilkan strip "-")
    balance: user ? balance : null,
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
