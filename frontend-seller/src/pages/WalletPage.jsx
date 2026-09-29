import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { BANKS } from "../data/seed";
import { formatRupiah, formatDateTime } from "../lib/format";
import "./WalletPage.css";

const walletIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <circle cx="17" cy="14.5" r="1.3" />
  </svg>
);

export default function WalletPage() {
  const { user } = useAuth();
  const {
    balance,
    totalEarned,
    totalWithdrawn,
    earnings,
    withdrawals,
    withdraw,
  } = useWallet();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bank: "",
    accountName: user?.name || "",
    accountNumber: "",
    amount: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("masuk"); // "masuk" | "keluar"

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function openForm() {
    setError("");
    setForm({
      bank: "",
      accountName: user?.name || "",
      accountNumber: "",
      amount: "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const record = await withdraw({ ...form, amount: Number(form.amount) });
      setSuccess(
        `Penarikan ${formatRupiah(record.amount)} ke ${record.bank} ${
          record.accountNumber
        } berhasil. Saldo berkurang.`
      );
      setShowForm(false);
      setTab("keluar");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const amountValue = Number(form.amount) || 0;
  const afterWithdraw = (balance ?? 0) - amountValue;

  return (
    <div className="wallet-page">
      {/* --- Kartu saldo --- */}
      <section className="wallet-hero">
        <div className="wallet-hero-info">
          <span className="wallet-hero-label">
            <span className="wallet-hero-icon">{walletIcon}</span>
            Saldo tersedia
          </span>
          <span className="wallet-hero-value">{formatRupiah(balance)}</span>
          <span className="wallet-hero-hint">
            Penarikan langsung diproses (transfer antar bank).
          </span>
        </div>
        <button className="btn btn-primary" onClick={openForm}>
          Tarik Dana
        </button>
      </section>

      {/* --- Ringkasan --- */}
      <div className="wallet-stats">
        <div className="stat-card">
          <span className="stat-card-label">Total pendapatan</span>
          <span className="stat-card-value">{formatRupiah(totalEarned)}</span>
          <span className="stat-card-hint">dari {earnings.length} dana masuk</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Total penarikan</span>
          <span className="stat-card-value">
            {formatRupiah(totalWithdrawn)}
          </span>
          <span className="stat-card-hint">
            dari {withdrawals.length} kali penarikan
          </span>
        </div>
      </div>

      {success && <div className="alert-success">{success}</div>}

      {/* --- Riwayat --- */}
      <section className="wallet-history">
        <div className="section-header">
          <h2 className="section-title">Riwayat</h2>
          <div className="chip-row">
            <button
              className={"chip" + (tab === "masuk" ? " active" : "")}
              onClick={() => setTab("masuk")}
            >
              Dana masuk ({earnings.length})
            </button>
            <button
              className={"chip" + (tab === "keluar" ? " active" : "")}
              onClick={() => setTab("keluar")}
            >
              Penarikan ({withdrawals.length})
            </button>
          </div>
        </div>

        {tab === "masuk" ? (
          earnings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">{walletIcon}</span>
              <p className="empty-state-title">Belum ada dana masuk</p>
              <p className="empty-state-text">
                Setiap pesanan yang kamu terima akan langsung tercatat di sini.
              </p>
            </div>
          ) : (
            <div className="wallet-list card">
              {earnings.map((e) => (
                <div className="wallet-row" key={e.id}>
                  <div className="wallet-row-main">
                    <span className="wallet-row-title">{e.note}</span>
                    <span className="wallet-row-date">
                      {formatDateTime(e.createdAt)}
                    </span>
                  </div>
                  <span className="wallet-row-amount in">
                    + {formatRupiah(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          )
        ) : withdrawals.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">{walletIcon}</span>
            <p className="empty-state-title">Belum pernah tarik dana</p>
            <p className="empty-state-text">
              Tarik saldo kamu ke rekening bank mana pun lewat tombol
              &ldquo;Tarik Dana&rdquo;.
            </p>
          </div>
        ) : (
          <div className="wallet-list card">
            {withdrawals.map((w) => (
              <div className="wallet-row" key={w.id}>
                <div className="wallet-row-main">
                  <span className="wallet-row-title">
                    {w.bank} • {w.accountNumber}
                  </span>
                  <span className="wallet-row-date">
                    {w.accountName} • {formatDateTime(w.createdAt)}
                  </span>
                </div>
                <span className="wallet-row-amount out">
                  − {formatRupiah(w.amount)}
                </span>
                <span className="badge badge--done">{w.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- Modal tarik dana --- */}
      {showForm && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setShowForm(false);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2 className="modal-title">Tarik Dana</h2>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
                aria-label="Tutup"
                disabled={saving}
              >
                ✕
              </button>
            </div>

            {error && <div className="alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="wd-bank">Bank tujuan</label>
                <select
                  id="wd-bank"
                  name="bank"
                  value={form.bank}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Pilih bank
                  </option>
                  {BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="wd-name">Nama pemilik rekening</label>
                <input
                  id="wd-name"
                  name="accountName"
                  type="text"
                  placeholder="Sesuai buku tabungan"
                  value={form.accountName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="wd-account">Nomor rekening</label>
                <input
                  id="wd-account"
                  name="accountNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="Minimal 6 digit"
                  value={form.accountNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="wd-amount">Nominal penarikan</label>
                <input
                  id="wd-amount"
                  name="amount"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
                <span className="field-hint">
                  <button
                    type="button"
                    className="wallet-all-btn"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, amount: String(balance) }))
                    }
                  >
                    Tarik semua saldo
                  </button>
                </span>
              </div>

              <div className="wallet-summary">
                <span>Saldo sekarang</span>
                <strong>{formatRupiah(balance)}</strong>
                <span>Saldo setelah penarikan</span>
                <strong
                  className={
                    afterWithdraw < 0 ? "wallet-summary-negative" : ""
                  }
                >
                  {formatRupiah(Math.max(afterWithdraw, 0))}
                </strong>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Memproses..." : "Tarik Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
