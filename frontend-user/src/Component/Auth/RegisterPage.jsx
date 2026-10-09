import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "./AuthLayout";
import "./AuthLayout.css";

const KELAS_OPTIONS = [
  "X-RPL", "X-MP", "X-AKL", "X-DKV", "X-BR", "X-AN",
  "XI-RPL", "XI-MP", "XI-AKL", "XI-DKV", "XI-BR", "XI-AN",
  "XII-RPL", "XII-MP", "XII-AKL", "XII-DKV", "XII-BR", "XII-AN", 
];

export default function RegisterPage({ onNavigateLogin, onLoginSuccess }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    kelas: "",
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
      // OTP dilewati: server sudah membalas token, jadi langsung masuk.
      onLoginSuccess && onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Buat Akun Baru"
      subtitle="Daftar dulu untuk mulai pesan makanan kantin."
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
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="nama@sekolah.sch.id"
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

        <div className="auth-field">
          <label htmlFor="kelas">Kelas</label>
          <select
            id="kelas"
            name="kelas"
            value={form.kelas}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Pilih kelas
            </option>
            {KELAS_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
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
