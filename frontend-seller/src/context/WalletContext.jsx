/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { readJSON, writeJSON, ensureSeed, STORAGE_KEYS } from "../lib/storage";
import {
  SEED_BALANCES,
  SEED_EARNINGS,
  SEED_WITHDRAWALS,
} from "../data/seed";

const WalletContext = createContext(null);

/**
 * ==========================================================================
 *  PLACEHOLDER DOMPET PENJUAL — saldo hasil pesanan + penarikan antar bank.
 *
 *  Alur duit:
 *    1. Pesanan diterima      -> creditEarning()  -> saldo bertambah
 *    2. Tarik dana (transfer) -> withdraw()       -> saldo terpotong
 *
 *  TODO(backend) — ganti isi fungsi dengan API:
 *    creditEarning -> POST /api/seller/earnings   (dipanggil dari OrderContext)
 *    withdraw      -> POST /api/seller/withdrawals (backend yang benar-benar
 *                     mentransfer via payment gateway / bank API)
 *    saldo         -> GET  /api/seller/wallet
 * ==========================================================================
 */

export function WalletProvider({ children }) {
  const { user } = useAuth();

  const [balances, setBalances] = useState(() => {
    ensureSeed(STORAGE_KEYS.balances, SEED_BALANCES);
    return readJSON(STORAGE_KEYS.balances, {});
  });
  const [earnings, setEarnings] = useState(() => {
    ensureSeed(STORAGE_KEYS.earnings, SEED_EARNINGS);
    return readJSON(STORAGE_KEYS.earnings, []);
  });
  const [withdrawals, setWithdrawals] = useState(() => {
    ensureSeed(STORAGE_KEYS.withdrawals, SEED_WITHDRAWALS);
    return readJSON(STORAGE_KEYS.withdrawals, []);
  });

  useEffect(() => writeJSON(STORAGE_KEYS.balances, balances), [balances]);
  useEffect(() => writeJSON(STORAGE_KEYS.earnings, earnings), [earnings]);
  useEffect(
    () => writeJSON(STORAGE_KEYS.withdrawals, withdrawals),
    [withdrawals]
  );

  // Data milik seller yang sedang login
  const myEarnings = useMemo(
    () =>
      earnings
        .filter((e) => e.email === user?.email)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [earnings, user]
  );
  const myWithdrawals = useMemo(
    () =>
      withdrawals
        .filter((w) => w.email === user?.email)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [withdrawals, user]
  );

  const balance = user ? balances[user.email] ?? 0 : null;
  const totalEarned = myEarnings.reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawn = myWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  /**
   * Catat dana masuk dari pesanan yang baru diterima.
   * TODO(backend): POST /api/seller/earnings — server yang menghitung saldo.
   */
  function creditEarning({ amount, orderId = null, note = "" }) {
    if (!user || !(amount > 0)) return;

    const earning = {
      id: "EAR-" + Date.now().toString(36).toUpperCase(),
      email: user.email,
      orderId,
      amount: Number(amount),
      note: note || (orderId ? `Pesanan ${orderId}` : "Pendapatan"),
      createdAt: new Date().toISOString(),
    };

    setEarnings((prev) => [earning, ...prev]);
    setBalances((prev) => ({
      ...prev,
      [user.email]: (prev[user.email] ?? 0) + Number(amount),
    }));
    return earning;
  }

  /**
   * Tarik dana ke rekening bank (transfer antar bank).
   * Instan: saldo langsung terpotong dan penarikan langsung berstatus "Selesai".
   *
   * TODO(backend): POST /api/seller/withdrawals — nanti disambungkan ke
   * payment gateway / transfer bank (mis. Midtrans Disbursement, Xendit,
   * or bank API). UI tidak perlu diubah.
   */
  function withdraw({ bank, accountName, accountNumber, amount }) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!user) {
          reject(new Error("Silakan login terlebih dahulu."));
          return;
        }
        if (!bank) {
          reject(new Error("Pilih bank tujuan."));
          return;
        }
        if (!accountNumber || accountNumber.trim().length < 6) {
          reject(new Error("Nomor rekening minimal 6 digit."));
          return;
        }
        const value = Number(amount);
        if (!(value > 0)) {
          reject(new Error("Nominal penarikan harus lebih dari 0."));
          return;
        }
        if (value > (balances[user.email] ?? 0)) {
          reject(new Error("Saldo tidak mencukupi."));
          return;
        }

        const record = {
          id: "WDR-" + Date.now().toString(36).toUpperCase(),
          email: user.email,
          bank,
          accountName: (accountName || user.name).trim(),
          accountNumber: accountNumber.trim(),
          amount: value,
          status: "Selesai",
          createdAt: new Date().toISOString(),
        };

        setWithdrawals((prev) => [record, ...prev]);
        setBalances((prev) => ({
          ...prev,
          [user.email]: (prev[user.email] ?? 0) - value,
        }));
        resolve(record);
      }, 600);
    });
  }

  const value = {
    balance,
    totalEarned,
    totalWithdrawn,
    earnings: myEarnings,
    withdrawals: myWithdrawals,
    creditEarning,
    withdraw,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet harus dipanggil di dalam <WalletProvider>");
  }
  return ctx;
}
