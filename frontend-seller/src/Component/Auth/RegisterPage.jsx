import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "./AuthLayout";
import "./AuthLayout.css";

export default function RegisterPage({ onNavigateLogin, onRegisterSuccess }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    storeName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      // Setelah berhasil daftar, arahkan ke halaman verifikasi OTP
      onRegisterSuccess && onRegisterSuccess(form.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Daftar Toko Baru"
      subtitle="Buat akun penjual sekaligus kantin kamu sendiri."
    >
      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="name">Nama Lengkap</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Nama kamu"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="storeName">Nama Kantin</label>
          <input
            id="storeName"
            name="storeName"
            type="text"
            placeholder="Contoh: Warung Bu Rini"
            value={form.storeName}
            onChange={handleChange}
            minLength={3}
            required
          />
          <span className="auth-field-hint">
            Nama kantin ini yang tampil di aplikasi pembeli.
          </span>
        </div>

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="penjual@sekolah.sch.id"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Minimal 8 karakter"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />
        </div>

        <button className="auth-submit-btn" type="submit" disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <p className="auth-footer-text">
        Sudah punya akun?{" "}
        <button className="auth-footer-link" onClick={onNavigateLogin}>
          Masuk
        </button>
      </p>
    </AuthLayout>
  );
}
