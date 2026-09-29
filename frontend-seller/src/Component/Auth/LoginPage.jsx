import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "./AuthLayout";
import "./AuthLayout.css";

export default function LoginPage({
  onNavigateRegister,
  onLoginSuccess,
  message = "",
}) {
  const { login } = useAuth();
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

  return (
    <AuthLayout
      title="Masuk sebagai Penjual"
      subtitle="Kelola menu, pesanan, dan saldo kantin kamu."
    >
      {message && <div className="auth-info">{message}</div>}
      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
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

      <div className="auth-demo-box">
        <strong>Akun demo</strong>
        <span>konsinyasi@seller.test / password123</span>
        <span>jus@seller.test / password123</span>
      </div>

      <p className="auth-footer-text">
        Belum punya akun?{" "}
        <button className="auth-footer-link" onClick={onNavigateRegister}>
          Daftar
        </button>
      </p>
    </AuthLayout>
  );
}
