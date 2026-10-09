/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const WalletContext = createContext(null);

/**
 * Dompet mahasiswa — saldo & top up dari backend.
 *   saldo        -> GET  /wallet
 *   buat QRIS    -> POST /wallet/topup          -> { id, amount, qrisPayload, expiresAt }
 *   bayar        -> POST /wallet/topup/:id/confirm -> { balance } (idempoten)
 *
 * Data dikunci per userKey: ganti akun / logout langsung derive null
 * tanpa setState sinkron di dalam effect (larangan react-hooks/set-state-in-effect).
 */
export function WalletProvider({ children }) {
  const { user } = useAuth();
  const userKey = user ? `${user.id}:${user.email}` : "guest";

  // { key, balance } — hanya berlaku selama key cocok dengan user sekarang
  const [store, setStore] = useState({ key: userKey, balance: null });

  const refreshBalance = useCallback(async () => {
    if (!user) return null;
    const res = await api("/wallet");
    setStore({ key: userKey, balance: res.balance });
    return res.balance;
  }, [user, userKey]);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    api("/wallet")
      .then((res) => {
        if (alive) setStore({ key: userKey, balance: res.balance });
      })
      .catch(() => {
        // saldo tetap null (tampil "-") kalau endpoint gagal
      });
    return () => {
      alive = false;
    };
  }, [user, userKey]);

  async function createTopUp(amount) {
    if (!user) throw new Error("Silakan login terlebih dahulu.");
    const res = await api("/wallet/topup", {
      method: "POST",
      body: { amount },
    });
    // server membalas { transaction: { id, amount, qrisPayload, expiresAt } }
    return res.transaction;
  }

  async function confirmTopUp(transactionId) {
    const res = await api(
      `/wallet/topup/${encodeURIComponent(transactionId)}/confirm`,
      { method: "POST" }
    );
    setStore({ key: userKey, balance: res.balance });
    return res.balance;
  }

  const value = {
    // null = belum login / belum termuat (BalanceCard menampilkan strip "-")
    balance: user && store.key === userKey ? store.balance : null,
    createTopUp,
    confirmTopUp,
    refreshBalance,
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
