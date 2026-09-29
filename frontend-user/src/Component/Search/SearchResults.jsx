import { useNavigate } from "react-router-dom";
import { getCategoryLabel } from "../../data/menuData";
import "./SearchResults.css";

function formatRupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

const searchIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

/**
 * Section "Menu Cocok" — daftar makanan/minuman yang cocok dengan pencarian
 * atau kategori yang dipilih, lengkap dengan nama kantin & tombol ke halaman
 * menu vendor.
 */
export default function SearchResults({ items = [], query = "", kategori = "semua" }) {
  const navigate = useNavigate();

  const hasQuery = query.trim() !== "";
  const title = hasQuery
    ? `Menu cocok dengan "${query.trim()}"`
    : `Menu kategori ${getCategoryLabel(kategori)}`;

  return (
    <section className="search-results">
      <div className="search-results-header">
        <h2 className="search-results-title">{title}</h2>
        <span className="search-results-count">{items.length} menu</span>
      </div>

      <div className="search-results-grid">
        {items.map((item) => (
          <article className="search-card" key={item.id}>
            <div className="search-card-body">
              <span className="search-card-vendor">{item.vendorName}</span>
              <h3 className="search-card-name">{item.name}</h3>
              {item.description && (
                <p className="search-card-desc">{item.description}</p>
              )}
            </div>

            <div className="search-card-footer">
              <span className="search-card-price">{formatRupiah(item.price)}</span>
              <button
                className="search-card-btn"
                onClick={() => navigate(`/menu/${item.vendorId}`)}
              >
                Lihat Menu
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Empty state — tampil kalau search/kategori tidak menemukan apa pun. */
export function SearchEmpty({ query = "", onClear }) {
  return (
    <div className="search-empty">
      <span className="search-empty-icon">{searchIcon}</span>
      <p className="search-empty-text">
        Tidak ada hasil untuk{" "}
        <strong>
          &ldquo;
          {query.trim() || "filter yang dipilih"}
          &rdquo;
        </strong>
        <br />
        Coba kata kunci lain atau hapus filternya.
      </p>
      {onClear && (
        <button className="search-empty-btn" onClick={onClear}>
          Hapus filter
        </button>
      )}
    </div>
  );
}
