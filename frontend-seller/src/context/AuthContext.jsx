/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import { createContext, useContext, useEffect, useState } from "react";
import { readJSON, writeJSON, removeKey, STORAGE_KEYS } from "../lib/storage";
import { api } from "../lib/api";

const AuthContext = createContext(null);

/**
 * Auth penjual — tersambung ke backend.
 *
 * Perubahan dari versi placeholder:
 *   - login/register/changePassword memanggil API beneran, bukan localStorage.
 *   - SEED_SELLERS tidak lagi dipakai: akun + kantin (vendors) + dompet
 *     dibuat server dalam satu transaksi saat register, jadi tidak ada data
 *     contoh yang perlu ditulis ke localStorage.
 *   - OTP dilewati (keputusan §2 #4): POST /seller/auth/register langsung
 *     membalas { token, user }.
 *   - verifyOtp/resendOtp/pendingRegistration/currentOtp dihapus — tidak ada
 *     endpoint-nya di server.
 *
 * Password hanya dikirim ke POST /seller/auth/login atau
 * /seller/auth/change-password, lalu di-hash server (bcrypt).
 */

/** Bentuk session yang disimpan: { token, user }. */
function loadSession() {
  const raw = readJSON(STORAGE_KEYS.session, null);
  // Versi lama menyimpan email sebagai string — abaikan, tidak ada tokennya.
  if (!raw || typeof raw !== "object" || !raw.token) return null;
  return raw;
}

export function AuthProvider({ children }) {
  // Diinisialisasi sinkron dari localStorage supaya RequireAuth tidak sempat
  // memantulkan user ke /login saat refresh.
  const [session, setSession] = useState(loadSession);
  const user = session?.user ?? null;

  function startSession({ token, user: nextUser }) {
    const next = { token, user: nextUser };
    setSession(next);
    writeJSON(STORAGE_KEYS.session, next);
    return next.user;
  }

  function logout() {
    setSession(null);
    removeKey(STORAGE_KEYS.session);
  }

  /**
   * Cek token yang tersimpan masih valid. Dipanggil sekali saat app dimuat:
   * kalau token kedaluwarsa atau dicabut, hapus sekalian supaya user tidak
   * melihat UI "sudah masuk" lalu gagal di request berikutnya.
   */
  useEffect(() => {
    if (!session?.token) return;

    let alive = true;
    api("/seller/auth/me")
      .then(({ user: fresh }) => {
        if (!alive || !fresh) return;
        setSession((prev) => {
          if (!prev?.token) return prev;
          const next = { token: prev.token, user: fresh };
          writeJSON(STORAGE_KEYS.session, next);
          return next;
        });
      })
      .catch(() => {
        // Token ditolak atau server mati — sesi dihapus supaya tidak
        // bertahan sebagai "login" palsu yang selalu gagal.
        if (alive) logout();
      });

    return () => {
      alive = false;
    };
    // Sekali saat mount. Kuncinya session?.token, bukan objek session, supaya
    // session yang diperbarui tidak memicu request ulang.
  }, [session?.token]);

  async function login({ email, password }) {
    const data = await api("/seller/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    return startSession(data);
  }

  /**
   * Daftar penjual baru. `storeName` wajib: server memakai nama ini untuk
   * membuat baris vendors (kantin) bersama akun dan dompet dalam satu
   * transaksi, dan menolaknya kalau kurang dari 3 karakter.
   */
  async function register({ name, storeName, email, password }) {
    const data = await api("/seller/auth/register", {
      method: "POST",
      body: { name, storeName: storeName.trim(), email, password },
      auth: false,
    });
    return startSession(data);
  }

  /**
   * Ganti password. Argumen posisional (current, next) dipertahankan supaya
   * ProfilePage tidak perlu diubah; body yang diminta server adalah
   * { currentPassword, newPassword }.
   */
  async function changePassword(currentPassword, newPassword) {
    if (!user) {
      throw new Error("Silakan login terlebih dahulu.");
    }
    await api("/seller/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  }

  const value = { user, login, register, changePassword, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Dipakai di komponen lain, contoh:
// const { user, login, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipanggil di dalam <AuthProvider>");
  }
  return ctx;
}
