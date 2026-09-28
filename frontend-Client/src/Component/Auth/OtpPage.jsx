import React, { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "./AuthLayout";
import "./AuthLayout.css";
import "./OtpPage.css";

const OTP_LENGTH = 6;

export default function OtpPage({ email, onVerifySuccess, onBack }) {
  const { verifyOtp, resendOtp } = useAuth();
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const inputRefs = useRef([]);

  function handleChange(index, value) {
    const clean = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.slice(0, OTP_LENGTH).split("");
    setDigits([...next, ...Array(OTP_LENGTH - next.length).fill("")]);
    inputRefs.current[Math.min(next.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError("Masukkan 6 digit kode OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyOtp(code);
      onVerifySuccess && onVerifySuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setResendMsg("");
    try {
      await resendOtp();
      setResendMsg("Kode OTP baru sudah dikirim.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthLayout
      title="Verifikasi Email"
      subtitle={`Masukkan 6 digit kode yang dikirim ke ${email || "email kamu"}.`}
    >
      {error && <div className="auth-error">{error}</div>}
      {resendMsg && <div className="otp-resend-msg">{resendMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="otp-input-group" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              className="otp-input-box"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>

        <button className="auth-submit-btn" type="submit" disabled={loading}>
          {loading ? "Memverifikasi..." : "Verifikasi"}
        </button>
      </form>

      <p className="auth-footer-text">
        Tidak menerima kode?{" "}
        <button className="auth-footer-link" onClick={handleResend}>
          Kirim ulang
        </button>
      </p>

      <p className="auth-footer-text">
        <button className="auth-footer-link" onClick={onBack}>
          ← Kembali
        </button>
      </p>
    </AuthLayout>
  );
}