/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import { createContext, useContext, useMemo, useState } from "react";
import { readJSON, writeJSON, removeKey, STORAGE_KEYS } from "../lib/storage";

const AuthContext = createContext(null);

/**
 * ==========================================================================
 *  PLACEHOLDER AUTH — belum tersambung ke backend/database asli.
 *  Semua fungsi di bawah ini pakai data sementara (localStorage) dan
 *  setTimeout untuk mensimulasikan delay network. Tim backend nanti tinggal
 *  mengganti ISI fungsi login/register/verifyOtp/loginWithGoogle/
 *  changePassword dengan pemanggilan API asli (fetch/axios), TANPA perlu
 *  mengubah halaman LoginPage/RegisterPage/OtpPage/ProfilePage karena
 *  mereka hanya memanggil fungsi dari context ini.
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
  // "Database" user — dipersist supaya refresh browser tidak menghapus akun.
  const [users, setUsers] = useState(() => readJSON(STORAGE_KEYS.users, []));
  // Email user yang sedang login (null = belum login)
  const [sessionEmail, setSessionEmail] = useState(() =>
    readJSON(STORAGE_KEYS.session, null)
  );
  // Data pendaftar yang belum menyelesaikan verifikasi OTP
  const [pendingRegistration, setPendingRegistration] = useState(() =>
    readJSON(STORAGE_KEYS.pending, null)
  );

  // Kode OTP aktif per email (persist supaya refresh di halaman OTP tidak gagal)
  const [otpStore, setOtpStore] = useState(() => readJSON(STORAGE_KEYS.otp, {}));

  // User yang diekspos ke UI — password tidak pernah dikirim ke component.
  const user = useMemo(
    () => toSafeUser(users.find((u) => u.email === sessionEmail)),
    [users, sessionEmail]
  );

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
    // TODO(backend): ganti dengan POST /api/auth/login
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

  function loginWithGoogle() {
    // TODO(backend): ganti dengan OAuth flow Google (Firebase Auth / OAuth2)
    return new Promise((resolve) => {
      setTimeout(() => {
        const googleUser = {
          name: "Pengguna Google",
          email: "pengguna@gmail.com",
          kelas: "-",
          password: "",
        };
        if (!users.some((u) => u.email === googleUser.email)) {
          saveUsers([...users, googleUser]);
        }
        startSession(googleUser.email);
        resolve(toSafeUser(googleUser));
      }, 500);
    });
  }

  function register({ name, email, password, kelas }) {
    // TODO(backend): ganti dengan POST /api/auth/register lalu kirim OTP
    // lewat email asli (mis. Nodemailer/SendGrid), bukan console.log seperti ini.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const exists = users.some((u) => u.email === email);
        if (exists) {
          reject(new Error("Email sudah terdaftar."));
          return;
        }

        const otp = generateOtp();
        saveOtp({ ...otpStore, [email]: otp });
        savePending({ name, email, password, kelas });

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
        const validOtp = otpStore[pendingRegistration.email];
        if (code !== validOtp) {
          reject(new Error("Kode OTP salah."));
          return;
        }

        const newUser = { ...pendingRegistration };
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
    // TODO(backend): ganti dengan POST /api/auth/resend-otp
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!pendingRegistration) {
          reject(new Error("Tidak ada proses registrasi yang berjalan."));
          return;
        }
        const otp = generateOtp();
        saveOtp({ ...otpStore, [pendingRegistration.email]: otp });
        console.log(
          `[DEV ONLY] Kode OTP baru untuk ${pendingRegistration.email}: ${otp}`
        );
        resolve();
      }, 400);
    });
  }

  /**
   * Ganti password user yang sedang login.
   * TODO(backend): ganti dengan POST /api/auth/change-password
   * (cek password lama di server, lalu simpan hash baru).
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
          users.map((u, i) =>
            i === index ? { ...u, password: newPassword } : u
          )
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
    login,
    loginWithGoogle,
    register,
    verifyOtp,
    resendOtp,
    changePassword,
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
