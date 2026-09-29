/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { readJSON, writeJSON, STORAGE_KEYS } from "../lib/storage";

const OrderContext = createContext(null);

/**
 * ==========================================================================
 *  PLACEHOLDER ORDER — riwayat pemesanan disimpan per-email di localStorage.
 *  Saat backend sudah ada, ganti isi createOrder dengan POST /api/orders
 *  dan ganti pembacaan orders dengan GET /api/orders (profil tidak perlu
 *  diubah karena hanya memanggil data dari context ini).
 * ==========================================================================
 */

export function OrderProvider({ children }) {
  const { user } = useAuth();
  const [ordersByEmail, setOrdersByEmail] = useState(() =>
    readJSON(STORAGE_KEYS.orders, {})
  );

  useEffect(() => {
    writeJSON(STORAGE_KEYS.orders, ordersByEmail);
  }, [ordersByEmail]);

  // Riwayat milik user yang sedang login
  const myOrders = useMemo(() => {
    if (!user) return [];
    return ordersByEmail[user.email] ?? [];
  }, [ordersByEmail, user]);

  const stats = useMemo(
    () => ({
      // berapa kali user sudah memesan
      totalOrders: myOrders.length,
      totalItemsBought: myOrders.reduce((sum, o) => sum + o.totalItems, 0),
      totalSpent: myOrders.reduce((sum, o) => sum + o.total, 0),
    }),
    [myOrders]
  );

  function createOrder({ items, total }) {
    if (!user) {
      throw new Error("Silakan login terlebih dahulu.");
    }

    const order = {
      id: "ORD-" + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      status: "Selesai",
      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        vendor: it.vendor || "-",
        vendorId: it.vendorId ?? null,
        price: it.price,
        qty: it.qty,
      })),
      totalItems: items.reduce((sum, it) => sum + it.qty, 0),
      total,
    };

    setOrdersByEmail((prev) => ({
      ...prev,
      [user.email]: [order, ...(prev[user.email] ?? [])],
    }));

    return order;
  }

  const value = {
    orders: myOrders,
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
