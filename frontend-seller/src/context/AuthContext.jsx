/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import { createContext, useContext, useMemo, useState } from "react";
import { readJSON, writeJSON, removeKey, STORAGE_KEYS } from "../lib/storage";
import { SEED_SELLERS } from "../data/seed";

const AuthContext = createContext(null);

/**
 * ==========================================================================
 *  PLACEHOLDER AUTH PENJUAL — belum tersambung ke backend/database asli.
 *  Semua fungsi di bawah pakai data sementara (localStorage) dan setTimeout
 *  untuk mensimulasikan delay network.
 *
 *  TODO(backend) — tim backend tinggal mengganti ISI fungsi ini:
 *    register()     -> POST /api/seller/auth/register (buat akun + kantin)
 *    verifyOtp()    -> POST /api/seller/auth/verify-otp
 *    login()        -> POST /api/seller/auth/login
 *    resendOtp()    -> POST /api/seller/auth/resend-otp
 *    changePassword -> POST /api/seller/auth/change-password
 *  Halaman LoginPage/RegisterPage/OtpPage tidak perlu diubah karena hanya
 *  memanggil fungsi dari context ini.
 *
 *  PENTING: password disimpan plaintext HANYA untuk demo lokal.
 *  Di backend asli password wajib di-hash (bcrypt/argon2) di server.
 * ==========================================================================
 */

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Sembunyikan password sebelum object user dipakai di UI. */
function toSafeUser(u) {
  if (!u) return null;
  const copy = { ...u };
  delete copy.password;
  return copy;
}

export function AuthProvider({ children }) {
  // "Database" seller — diisi data contoh saat pertama kali dibuka.
  const [users, setUsers] = useState(() => {
    // ensureSeed: hanya menulis kalau key belum pernah ada
    if (window.localStorage.getItem(STORAGE_KEYS.users) === null) {
      writeJSON(STORAGE_KEYS.users, SEED_SELLERS);
    }
    return readJSON(STORAGE_KEYS.users, []);
  });
  const [sessionEmail, setSessionEmail] = useState(() =>
    readJSON(STORAGE_KEYS.session, null)
  );
  const [pendingRegistration, setPendingRegistration] = useState(() =>
    readJSON(STORAGE_KEYS.pending, null)
  );
  const [otpStore, setOtpStore] = useState(() => readJSON(STORAGE_KEYS.otp, {}));

  // User yang diekspos ke UI — password tidak pernah dikirim ke component.
  const user = useMemo(
    () => toSafeUser(users.find((u) => u.email === sessionEmail)),
    [users, sessionEmail]
  );

  // Kode OTP aktif — HANYA untuk demo supaya bisa ditampilkan di layar
  // (email asli dikirim lewat backend, jadi tidak perlu lagi di sini).
  const currentOtp = pendingRegistration
    ? otpStore[pendingRegistration.email] || null
    : null;

  function saveUsers(next) {
    setUsers(next);
    writeJSON(STORAGE_KEYS.users, next);
  }

  function startSession(email) {
    setSessionEmail(email);
    writeJSON(STORAGE_KEYS.session, email);
  }

  function savePending(next) {
    setPendingRegistration(next);
    if (next) writeJSON(STORAGE_KEYS.pending, next);
    else removeKey(STORAGE_KEYS.pending);
  }

  function saveOtp(next) {
    setOtpStore(next);
    writeJSON(STORAGE_KEYS.otp, next);
  }

  function login({ email, password }) {
    // TODO(backend): ganti dengan POST /api/seller/auth/login
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const found = users.find(
          (u) => u.email === email && u.password === password
        );
        if (!found) {
          reject(new Error("Email atau password salah."));
          return;
        }
        startSession(found.email);
        resolve(toSafeUser(found));
      }, 500);
    });
  }

  function register({ name, storeName, email, password }) {
    // TODO(backend): ganti dengan POST /api/seller/auth/register —
    // kantin baru (vendor) dibuat oleh backend bersama akun seller ini.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const exists = users.some((u) => u.email === email);
        if (exists) {
          reject(new Error("Email sudah terdaftar."));
          return;
        }
        if (!storeName || storeName.trim().length < 3) {
          reject(new Error("Nama kantin minimal 3 karakter."));
          return;
        }

        const otp = generateOtp();
        saveOtp({ ...otpStore, [email]: otp });
        savePending({ name, storeName: storeName.trim(), email, password });

        resolve({ email });
      }, 500);
    });
  }

  function verifyOtp(code) {
    // TODO(backend): ganti dengan POST /api/seller/auth/verify-otp
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!pendingRegistration) {
          reject(new Error("Tidak ada proses registrasi yang berjalan."));
          return;
        }
        const validOtp = otpStore[pendingRegistration.email];
        if (code !== validOtp) {
          reject(new Error("Kode OTP salah."));
          return;
        }

        const newUser = { ...pendingRegistration, createdAt: new Date().toISOString() };
        saveUsers([...users, newUser]);
        saveOtp(
          Object.fromEntries(
            Object.entries(otpStore).filter(
              ([key]) => key !== pendingRegistration.email
            )
          )
        );
        startSession(newUser.email);
        savePending(null);

        resolve(toSafeUser(newUser));
      }, 500);
    });
  }

  function resendOtp() {
    // TODO(backend): ganti dengan POST /api/seller/auth/resend-otp
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!pendingRegistration) {
          reject(new Error("Tidak ada proses registrasi yang berjalan."));
          return;
        }
        const otp = generateOtp();
        saveOtp({ ...otpStore, [pendingRegistration.email]: otp });
        resolve();
      }, 400);
    });
  }

  /**
   * Ganti password seller yang sedang login.
   * TODO(backend): ganti dengan POST /api/seller/auth/change-password
   */
  function changePassword(currentPassword, newPassword) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!user) {
          reject(new Error("Silakan login terlebih dahulu."));
          return;
        }
        const index = users.findIndex((u) => u.email === user.email);
        if (index === -1 || users[index].password !== currentPassword) {
          reject(new Error("Password saat ini tidak sesuai."));
          return;
        }
        if (newPassword.length < 8) {
          reject(new Error("Password baru minimal 8 karakter."));
          return;
        }
        if (currentPassword === newPassword) {
          reject(
            new Error("Password baru tidak boleh sama dengan password lama.")
          );
          return;
        }

        saveUsers(
          users.map((u, i) => (i === index ? { ...u, password: newPassword } : u))
        );
        resolve();
      }, 500);
    });
  }

  function logout() {
    setSessionEmail(null);
    removeKey(STORAGE_KEYS.session);
  }

  const value = {
    user,
    pendingRegistration,
    currentOtp,
    login,
    register,
    verifyOtp,
    resendOtp,
    changePassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Dipakai di komponen lain, contoh:
// const { user, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipanggil di dalam <AuthProvider>");
  }
  return ctx;
}
