/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMenu } from "./MenuContext";
import { useWallet } from "./WalletContext";
import { readJSON, writeJSON, ensureSeed, STORAGE_KEYS } from "../lib/storage";
import { SEED_ORDERS } from "../data/seed";

const OrderContext = createContext(null);

const fakeLatency = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const DEMO_BUYERS = [
  { name: "Fajar Nugroho", kelas: "X-RPL" },
  { name: "Maya Putri", kelas: "XI-DKV" },
  { name: "Rizky Ramadhan", kelas: "XII-AKL" },
];

/**
 * ==========================================================================
 *  PLACEHOLDER PESANAN MASUK — pesanan dari aplikasi pembeli (frontend-user).
 *
 *  Alur: pesanan berstatus "Menunggu" -> seller klik Terima -> status jadi
 *  "Selesai" dan duitnya dicatat ke saldo lewat WalletContext.creditEarning().
 *
 *  TODO(backend) — ganti dengan API:
 *    baca pesanan -> GET  /api/seller/orders?vendorId=...
 *    terima       -> POST /api/seller/orders/:id/accept
 *    (pesanan baru dari pembeli otomatis muncul karena datang dari server)
 * ==========================================================================
 */

export function OrderProvider({ children }) {
  const { myVendor, myMenus } = useMenu();
  const { creditEarning } = useWallet();

  const [orders, setOrders] = useState(() => {
    ensureSeed(STORAGE_KEYS.orders, SEED_ORDERS);
    return readJSON(STORAGE_KEYS.orders, []);
  });

  useEffect(() => {
    writeJSON(STORAGE_KEYS.orders, orders);
  }, [orders]);

  // Pesanan milik kantin seller yang sedang login, terbaru di atas.
  const myOrders = useMemo(
    () =>
      orders
        .filter((o) => o.vendorId === myVendor?.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders, myVendor]
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

  /**
   * Terima pesanan -> duit masuk ke saldo seller.
   * TODO(backend): POST /api/seller/orders/:id/accept —
   * server yang menandai pesanan & mengkredit saldo.
   */
  async function acceptOrder(id) {
    await fakeLatency();

    const order = orders.find((o) => o.id === id);
    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (order.vendorId !== myVendor?.id) {
      throw new Error("Pesanan ini bukan milik kantin Anda.");
    }
    if (order.status !== "Menunggu") {
      throw new Error("Pesanan ini sudah diproses.");
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: "Selesai", credited: true } : o
      )
    );

    // Duitnya tersimpan di akun seller
    creditEarning({
      amount: order.total,
      orderId: order.id,
      note: `Pesanan ${order.id}`,
    });

    return { ...order, status: "Selesai", credited: true };
  }

  /**
   * Muat pesanan contoh untuk kantin ini.
   * HANYA placeholder demo — di mode sekarang pesanan pembeli dari
   * frontend-user belum bisa nyambung (belum ada backend).
   * TODO(backend): hapus fungsi ini, pesanan asli datang otomatis dari API.
   */
  async function loadDemoOrders() {
    await fakeLatency(350);
    if (!myVendor) throw new Error("Kantin belum ditemukan.");
    if (myMenus.length === 0) {
      throw new Error("Tambahkan menu dulu sebelum memuat pesanan contoh.");
    }

    const pool = [...myMenus];
    const items = [];
    const wanted = Math.min(2, pool.length);
    for (let i = 0; i < wanted; i++) {
      const menu = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const qty = 1 + Math.floor(Math.random() * 2);
      items.push({
        id: menu.id,
        name: menu.name,
        price: menu.price,
        qty,
      });
    }

    const buyer = DEMO_BUYERS[Math.floor(Math.random() * DEMO_BUYERS.length)];
    const order = {
      id: "ORD-" + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      status: "Menunggu",
      credited: false,
      vendorId: myVendor.id,
      vendor: myVendor.name,
      buyer: { ...buyer },
      items,
      totalItems: items.reduce((sum, it) => sum + it.qty, 0),
      total: items.reduce((sum, it) => sum + it.price * it.qty, 0),
    };

    setOrders((prev) => [order, ...prev]);
    return order;
  }

  const value = {
    orders: myOrders,
    ...stats,
    acceptOrder,
    loadDemoOrders,
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
