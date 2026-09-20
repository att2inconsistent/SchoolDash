import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "./AuthLayout";
import "./AuthLayout.css";

const googleIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.44.34-2.1V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.85z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z"
    />
  </svg>
);

export default function LoginPage({ onNavigateRegister, onLoginSuccess }) {
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
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
      await login(form);
      onLoginSuccess && onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      onLoginSuccess && onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Masuk ke Akun"
      subtitle="Pesan makanan kantin jadi lebih mudah."
    >
      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
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
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <button className="auth-submit-btn" type="submit" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <div className="auth-divider">atau</div>

      <button className="auth-google-btn" onClick={handleGoogle} disabled={loading}>
        {googleIcon} Masuk dengan Google
      </button>

      <p className="auth-footer-text">
        Belum punya akun?{" "}
        <button className="auth-footer-link" onClick={onNavigateRegister}>
          Daftar
        </button>
      </p>
    </AuthLayout>
  );
}