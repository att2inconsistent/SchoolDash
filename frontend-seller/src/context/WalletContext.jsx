/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const WalletContext = createContext(null);

/**
 * Dompet penjual — saldo, riwayat pendapatan, dan penarikan dari backend.
 *   saldo        -> GET  /seller/wallet
 *   riwayat      -> GET  /seller/wallet/transactions  (kind: earning | withdrawal)
 *   tarik dana   -> POST /seller/wallet/withdrawals   (server debit + catat transaksi)
 *
 * Kredit dana dari pesanan dikerjakan server saat seller accept order
 * (transaksi kind 'earning') — tidak ada pemanggilan creditEarning manual.
 *
 * Data dikunci per userKey: ganti akun / logout langsung derive null/[]
 * tanpa setState sinkron di dalam effect (larangan react-hooks/set-state-in-effect).
 */
export function WalletProvider({ children }) {
  const { user } = useAuth();
  const userKey = user ? `${user.id}:${user.email}` : "guest";

  // { key, balance, earnings, withdrawals } — berlaku selama key cocok
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshWallet = useCallback(async () => {
    if (!user) return null;
    const [wallet, res] = await Promise.all([
      api("/seller/wallet"),
      api("/seller/wallet/transactions"),
    ]);
    const next = {
      key: userKey,
      balance: wallet.balance,
      earnings: [],
      withdrawals: [],
    };
    for (const t of res.transactions ?? []) {
      if (t.kind === "earning") {
        next.earnings.push(t);
      } else if (t.kind === "withdrawal") {
        // server menyimpan penarikan sebagai angka negatif; UI menampilkan
        // "− Rp…", jadi simpan nilai positif agar tidak jadi "− Rp-10.000"
        next.withdrawals.push({ ...t, amount: Math.abs(t.amount) });
      }
    }
    setStore(next);
    return next;
  }, [user, userKey]);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    // rantai promise langsung (bukan lewat refreshWallet) supaya setStore
    // tidak terbaca sebagai setState sinkron di dalam effect
    Promise.all([api("/seller/wallet"), api("/seller/wallet/transactions")])
      .then(([wallet, res]) => {
        if (!alive) return;
        const next = {
          key: userKey,
          balance: wallet.balance,
          earnings: [],
          withdrawals: [],
        };
        for (const t of res.transactions ?? []) {
          if (t.kind === "earning") {
            next.earnings.push(t);
          } else if (t.kind === "withdrawal") {
            // server menyimpan penarikan negatif; UI sudah menampilkan "−"
            next.withdrawals.push({ ...t, amount: Math.abs(t.amount) });
          }
        }
        setStore(next);
        setLoading(false);
      })
      .catch(() => {
        // biarkan store null (saldo tampil "-") kalau endpoint gagal
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user, userKey]);

  /**
   * Tarik dana ke rekening bank. Validasi (bank, nomor rekening, saldo)
   * sepenuhnya di server — pesan galatnya yang ditampilkan verbatim.
   */
  async function withdraw({ bank, accountName, accountNumber, amount }) {
    const res = await api("/seller/wallet/withdrawals", {
      method: "POST",
      body: { bank, accountName, accountNumber, amount },
    });
    await refreshWallet();
    // server membalas { withdrawal: {...} } dengan amount negatif
    const record = res.withdrawal;
    return { ...record, amount: Math.abs(record.amount) };
  }

  const wallet = store && store.key === userKey ? store : null;

  const value = useMemo(() => {
    const earnings = wallet?.earnings ?? [];
    const withdrawals = wallet?.withdrawals ?? [];
    return {
      loading,
      balance: user && wallet ? wallet.balance : null,
      totalEarned: earnings.reduce((sum, e) => sum + e.amount, 0),
      totalWithdrawn: withdrawals.reduce((sum, w) => sum + w.amount, 0),
      earnings,
      withdrawals,
      withdraw,
      refreshWallet,
    };
    // withdraw dibuat ulang tiap render; daftar dependensi memakai versi dari
    // render terakhir supaya closure-nya selalu segar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, wallet, refreshWallet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet harus dipanggil di dalam <WalletProvider>");
  }
  return ctx;
}
