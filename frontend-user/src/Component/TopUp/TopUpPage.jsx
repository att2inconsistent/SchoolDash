import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useWallet } from "../../context/WalletContext";
import "./TopUpPage.css";

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];
const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 1000000;

const backIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const checkIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

function formatTimer(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function TopUpPage({ onBack }) {
  const { balance, createTopUp, confirmTopUp } = useWallet();

  const [step, setStep] = useState("amount"); // "amount" | "qris" | "success"
  const [amount, setAmount] = useState(0);
  const [transaction, setTransaction] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Hitung mundur waktu berlaku QR
  useEffect(() => {
    if (step !== "qris" || !transaction) return;

    function tick() {
      const left = Math.max(
        0,
        Math.floor((transaction.expiresAt - Date.now()) / 1000)
      );
      setSecondsLeft(left);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [step, transaction]);

  const expired = step === "qris" && secondsLeft === 0;

  function handleAmountInput(e) {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setAmount(digits ? Number(digits) : 0);
  }

  async function handleContinue() {
    setError("");
    if (amount < MIN_AMOUNT) {
      setError(`Minimal top up ${formatRupiah(MIN_AMOUNT)}.`);
      return;
    }
    if (amount > MAX_AMOUNT) {
      setError(`Maksimal top up ${formatRupiah(MAX_AMOUNT)}.`);
      return;
    }
    setLoading(true);
    try {
      const trx = await createTopUp(amount);
      setTransaction(trx);
      setStep("qris");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaid() {
    setError("");
    setLoading(true);
    try {
      await confirmTopUp(transaction.id);
      setStep("success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() {
    setTransaction(null);
    setError("");
    setStep("amount");
  }

  return (
    <div className="topup-page">
      {step !== "success" && (
        <button
          className="topup-back"
          onClick={step === "qris" ? handleRestart : onBack}
        >
          <span className="topup-back-icon">{backIcon}</span>
          {step === "qris" ? "Ubah Nominal" : "Kembali"}
        </button>
      )}

      {/* ---------------- STEP 1: PILIH NOMINAL ---------------- */}
      {step === "amount" && (
        <div className="topup-card">
          <h1 className="topup-title">Isi Saldo</h1>
          <p className="topup-subtitle">
            Saldo saat ini: <strong>{formatRupiah(balance)}</strong>
          </p>

          {error && <div className="topup-error">{error}</div>}

          <label className="topup-label" htmlFor="topup-amount">
            Jumlah Top Up
          </label>
          <div className="topup-input-wrap">
            <span className="topup-input-prefix">Rp</span>
            <input
              id="topup-amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount ? amount.toLocaleString("id-ID") : ""}
              onChange={handleAmountInput}
            />
          </div>

          <div className="topup-quick-list">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                className={
                  "topup-quick-btn" + (amount === val ? " active" : "")
                }
                onClick={() => setAmount(val)}
              >
                {val / 1000}k
              </button>
            ))}
          </div>

          <p className="topup-hint">
            Minimal {formatRupiah(MIN_AMOUNT)} • Maksimal{" "}
            {formatRupiah(MAX_AMOUNT)}
          </p>

          <button
            className="topup-primary-btn"
            onClick={handleContinue}
            disabled={loading || amount === 0}
          >
            {loading ? "Memproses..." : "Lanjutkan ke Pembayaran"}
          </button>
        </div>
      )}

      {/* ---------------- STEP 2: QR QRIS ---------------- */}
      {step === "qris" && transaction && (
        <div className="topup-card topup-card-center">
          <h1 className="topup-title">Scan QRIS untuk Membayar</h1>
          <p className="topup-subtitle">
            Buka aplikasi e-wallet / mobile banking kamu, lalu scan kode di
            bawah.
          </p>

          {error && <div className="topup-error">{error}</div>}

          <div className={"topup-qr-box" + (expired ? " expired" : "")}>
            <QRCodeSVG value={transaction.qrisPayload} size={210} />
            {expired && <div className="topup-qr-expired">Kedaluwarsa</div>}
          </div>

          <div className="topup-qr-amount">{formatRupiah(transaction.amount)}</div>

          {expired ? (
            <>
              <p className="topup-timer expired">
                Kode QR sudah kedaluwarsa.
              </p>
              <button className="topup-primary-btn" onClick={handleRestart}>
                Buat Kode Baru
              </button>
            </>
          ) : (
            <>
              <p className="topup-timer">
                Berlaku selama <strong>{formatTimer(secondsLeft)}</strong>
              </p>
              <button
                className="topup-primary-btn"
                onClick={handlePaid}
                disabled={loading}
              >
                {loading ? "Mengecek pembayaran..." : "Saya Sudah Bayar"}
              </button>
              <p className="topup-dev-note">
                Mode demo: tombol ini mensimulasikan pembayaran berhasil.
              </p>
            </>
          )}
        </div>
      )}

      {/* ---------------- STEP 3: SUKSES ---------------- */}
      {step === "success" && (
        <div className="topup-card topup-card-center">
          <div className="topup-success-icon">{checkIcon}</div>
          <h1 className="topup-title">Top Up Berhasil!</h1>
          <p className="topup-subtitle">
            Saldo sebesar <strong>{formatRupiah(transaction?.amount)}</strong>{" "}
            sudah ditambahkan.
          </p>
          <p className="topup-success-balance">
            Saldo sekarang: <strong>{formatRupiah(balance)}</strong>
          </p>
          <button className="topup-primary-btn" onClick={onBack}>
            Kembali ke Beranda
          </button>
        </div>
      )}
    </div>
  );
}
