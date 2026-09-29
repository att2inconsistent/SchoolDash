import "./VendorList.css";

const starIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L5.8 21l1.6-7L2 9.2l7.1-.6L12 2z" />
  </svg>
);

const clockIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const filterIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);

function VendorCard({ vendor, onViewMenu }) {
  return (
    <div className="vendor-card">
      <div className="vendor-card-image">
        {vendor.image && <img src={vendor.image} alt={vendor.name} />}
        <span className="vendor-card-rating">
          <span className="vendor-card-rating-icon">{starIcon}</span>
          {vendor.rating.toFixed(1)}
        </span>
      </div>

      <div className="vendor-card-body">
        <h3 className="vendor-card-name">{vendor.name}</h3>
        <p className="vendor-card-tags">{vendor.tags.join(" • ")}</p>

        <div className="vendor-card-footer">
          <span className="vendor-card-time">
            <span className="vendor-card-time-icon">{clockIcon}</span>
            {vendor.time}
          </span>
          <button
            className="vendor-card-link"
            onClick={() => onViewMenu && onViewMenu(vendor)}
          >
            Lihat Menu
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorList({
  vendors = [],
  title = "Vendor Kantin Terpopuler",
  count,
  filterLabel = "Filter",
  onFilterClick,
  onViewMenu,
}) {
  return (
    <section className="vendor-list">
      <div className="vendor-list-header">
        <div className="vendor-list-heading">
          <h2 className="vendor-list-title">{title}</h2>
          {typeof count === "number" && (
            <span className="vendor-list-count">{count} vendor</span>
          )}
        </div>
        <button className="vendor-list-filter" onClick={onFilterClick}>
          <span className="vendor-list-filter-icon">{filterIcon}</span>
          {filterLabel}
        </button>
      </div>

      <div className="vendor-list-grid">
        {vendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} onViewMenu={onViewMenu} />
        ))}
      </div>
    </section>
  );
}
