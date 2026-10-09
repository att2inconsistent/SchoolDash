/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const OrderContext = createContext(null);

/**
 * ==========================================================================
 *  RIWAYAT PESANAN — dibaca & ditulis lewat backend (bukan localStorage).
 *
 *    baca riwayat -> GET  /api/orders
 *    buat pesanan -> POST /api/orders  { items: [{ menuItemId, qty }] }
 *
 *  Harga & total TIDAK dikirim — server menghitung ulang dari harga di
 *  database (mencegah manipulasi harga dari client). Server juga memotong
 *  saldo dalam transaksi yang sama; kalau saldo kurang, pesanan dibatalkan.
 * ==========================================================================
 */
export function OrderProvider({ children }) {
  const { user } = useAuth();
  // Data bertanda pemilik (`userKey`) lalu di-derive saat render: logout /
  // ganti akun otomatis menampilkan [] tanpa setState di dalam effect
  // (dilarang react-hooks/set-state-in-effect).
  const [store, setStore] = useState({ userKey: null, orders: [] });

  const userKey = user?.email ?? null;
  const orders = useMemo(
    () => (userKey && store.userKey === userKey ? store.orders : []),
    [userKey, store]
  );

  const stats = useMemo(
    () => ({
      // berapa kali user sudah memesan
      totalOrders: orders.length,
      totalItemsBought: orders.reduce((sum, o) => sum + o.totalItems, 0),
      totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
    }),
    [orders]
  );

  useEffect(() => {
    if (!userKey) return;

    let alive = true;
    api("/orders")
      .then((res) => {
        if (alive) setStore({ userKey, orders: res.orders });
      })
      .catch((err) => console.error(err));

    return () => {
      alive = false;
    };
  }, [userKey]);

  /**
   * Checkout: keranjang dikirim sebagai id menu + jumlah saja. Server
   * menghitung total dari harga DB dan memotong saldo — pesan errornya
   * (mis. "Saldo tidak mencukupi.") diteruskan apa adanya.
   */
  async function createOrder({ items }) {
    if (!user) {
      throw new Error("Silakan login terlebih dahulu.");
    }

    const res = await api("/orders", {
      method: "POST",
      body: {
        items: items.map((it) => ({ menuItemId: it.id, qty: it.qty })),
      },
    });

    const order = res.order;
    setStore((prev) => ({
      userKey,
      orders: prev.userKey === userKey ? [order, ...prev.orders] : [order],
    }));
    return order;
  }

  const value = {
    orders,
    createOrder,
    ...stats,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrders harus dipanggil di dalam <OrderProvider>");
  }
  return ctx;
}
