/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useWallet } from "./WalletContext";
import { api } from "../lib/api";

const OrderContext = createContext(null);

/**
 * ==========================================================================
 *  PESANAN MASUK — pesanan dari aplikasi pembeli (frontend-user), dibaca
 *  langsung dari backend.
 *
 *  Alur status: "Menunggu" -> seller Terima -> "Selesai".
 *  Saat status jadi "Selesai", server yang mengkredit saldo seller di DALAM
 *  transaksi database — jadi creditEarning() manual TIDAK dipanggil lagi
 *  (kalau dipanggil, uangnya double-count begitu WalletContext tersambung).
 *
 *    baca pesanan -> GET   /api/seller/orders
 *    terima       -> PATCH /api/seller/orders/:id  { status: "Selesai" }
 * ==========================================================================
 */
export function OrderProvider({ children }) {
  const { user } = useAuth();
  const { refreshWallet } = useWallet();

  // Data bertanda pemilik (`userKey`) lalu di-derive saat render: logout /
  // ganti akun otomatis menampilkan [] tanpa setState di dalam effect
  // (dilarang react-hooks/set-state-in-effect).
  const [store, setStore] = useState({ userKey: null, orders: [] });

  const userKey = user?.email ?? null;
  const rawOrders = useMemo(
    () => (userKey && store.userKey === userKey ? store.orders : []),
    [userKey, store]
  );

  // Field buyer dipetakan dari snapshot backend: studentName/studentKelas.
  const myOrders = useMemo(
    () =>
      rawOrders.map((o) => ({
        ...o,
        buyer: { name: o.studentName || "-", kelas: o.studentKelas || "" },
      })),
    [rawOrders]
  );

  const stats = useMemo(
    () => ({
      pendingCount: myOrders.filter((o) => o.status === "Menunggu").length,
      completedCount: myOrders.filter((o) => o.status === "Selesai").length,
      revenue: myOrders
        .filter((o) => o.status === "Selesai")
        .reduce((sum, o) => sum + o.total, 0),
    }),
    [myOrders]
  );

  useEffect(() => {
    if (!userKey) return;

    let alive = true;

    api("/seller/orders")
      .then((res) => {
        if (alive) setStore({ userKey, orders: res.orders });
      })
      .catch((err) => console.error(err));

    return () => {
      alive = false;
    };
  }, [userKey]);

  /**
   * Terima pesanan -> status "Selesai" dan saldo dikredit oleh server.
   * Pesan error server (mis. "Pesanan ini sudah selesai.") diteruskan apa
   * adanya ke UI.
   */
  async function acceptOrder(id) {
    const res = await api(`/seller/orders/${id}`, {
      method: "PATCH",
      body: { status: "Selesai" },
    });
    setStore((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? res.order : o)),
    }));
    // server baru mengkredit saldo — tarik ulang dompet supaya dashboard sinkron
    refreshWallet().catch(() => {});
    return {
      ...res.order,
      buyer: {
        name: res.order.studentName || "-",
        kelas: res.order.studentKelas || "",
      },
    };
  }

  /** Tarik ulang pesanan dari server (untuk refresh manual). */
  async function refreshOrders() {
    const res = await api("/seller/orders");
    setStore({ userKey, orders: res.orders });
  }

  const value = {
    orders: myOrders,
    ...stats,
    acceptOrder,
    refreshOrders,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrders harus dipanggil di dalam <OrderProvider>");
  }
  return ctx;
}
