import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

/**
 * ==========================================================================
 *  PLACEHOLDER AUTH — belum tersambung ke backend/database asli.
 *  Semua fungsi di bawah ini pakai data sementara (in-memory) dan setTimeout
 *  untuk mensimulasikan delay network. Tim backend nanti tinggal mengganti
 *  ISI fungsi login/register/verifyOtp/loginWithGoogle di bawah dengan
 *  pemanggilan API asli (fetch/axios), TANPA perlu mengubah halaman
 *  LoginPage/RegisterPage/OtpPage karena mereka hanya memanggil fungsi ini.
 * ==========================================================================
 */

// "Database" user sementara, hilang setiap kali halaman di-refresh.
let fakeUserDb = [];
// Menyimpan kode OTP yang sedang aktif per email.
let fakeOtpStore = {};

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Data pendaftar yang belum menyelesaikan verifikasi OTP
  const [pendingRegistration, setPendingRegistration] = useState(null);

  function login({ email, password }) {
    // TODO(backend): ganti dengan POST /api/auth/login
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const found = fakeUserDb.find(
          (u) => u.email === email && u.password === password
        );
        if (!found) {
          reject(new Error("Email atau password salah."));
          return;
        }
        setUser(found);
        resolve(found);
      }, 500);
    });
  }

  function loginWithGoogle() {
    // TODO(backend): ganti dengan OAuth flow Google (Firebase Auth / OAuth2)
    return new Promise((resolve) => {
      setTimeout(() => {
        const googleUser = {
          name: "Pengguna Google",
          email: "pengguna@gmail.com",
          kelas: "-",
        };
        setUser(googleUser);
        resolve(googleUser);
      }, 500);
    });
  }

  function register({ name, email, password, kelas }) {
    // TODO(backend): ganti dengan POST /api/auth/register lalu kirim OTP
    // lewat email asli (mis. Nodemailer/SendGrid), bukan console.log seperti ini.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const exists = fakeUserDb.some((u) => u.email === email);
        if (exists) {
          reject(new Error("Email sudah terdaftar."));
          return;
        }

        const otp = generateOtp();
        fakeOtpStore[email] = otp;
        setPendingRegistration({ name, email, password, kelas });

        // Placeholder pengganti "email OTP": tampil di console browser.
        console.log(`[DEV ONLY] Kode OTP untuk ${email}: ${otp}`);

        resolve({ email });
      }, 500);
    });
  }

  function verifyOtp(code) {
    // TODO(backend): ganti dengan POST /api/auth/verify-otp
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!pendingRegistration) {
          reject(new Error("Tidak ada proses registrasi yang berjalan."));
          return;
        }
        const validOtp = fakeOtpStore[pendingRegistration.email];
        if (code !== validOtp) {
          reject(new Error("Kode OTP salah."));
          return;
        }

        const newUser = { ...pendingRegistration };
        fakeUserDb.push(newUser);
        delete fakeOtpStore[pendingRegistration.email];

        setUser(newUser);
        setPendingRegistration(null);
        resolve(newUser);
      }, 500);
    });
  }

  function resendOtp() {
    // TODO(backend): ganti dengan POST /api/auth/resend-otp
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!pendingRegistration) {
          reject(new Error("Tidak ada proses registrasi yang berjalan."));
          return;
        }
        const otp = generateOtp();
        fakeOtpStore[pendingRegistration.email] = otp;
        console.log(
          `[DEV ONLY] Kode OTP baru untuk ${pendingRegistration.email}: ${otp}`
        );
        resolve();
      }, 400);
    });
  }

  function logout() {
    setUser(null);
  }

  const value = {
    user,
    pendingRegistration,
    login,
    loginWithGoogle,
    register,
    verifyOtp,
    resendOtp,
    logout,
  };

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