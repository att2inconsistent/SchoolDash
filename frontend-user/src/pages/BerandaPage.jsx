import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import WelcomeHeader from "../Component/Welcome/WelcomeHeader";
import CategoryFilter from "../Component/Category/CategoryFilter";
import VendorList from "../Component/Vendor/VendorList";
import SearchResults, { SearchEmpty } from "../Component/Search/SearchResults";
import { filterVendors, searchMenuItems, getCategoryLabel } from "../data/menuData";

/**
 * Beranda sekaligus halaman hasil pencarian.
 *
 * Filter pencarian (?q=) dan kategori (?kategori=) dibaca dari URL query,
 * jadi hasil tetap sama saat refresh dan bisa dibagikan ke teman.
 */
export default function BerandaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useWallet();
  const [params, setParams] = useSearchParams();

  const query = params.get("q") ?? "";
  const kategori = params.get("kategori") || "semua";
  const hasFilter = query.trim() !== "" || kategori !== "semua";

  const filteredVendors = useMemo(
    () => filterVendors({ query, kategori }),
    [query, kategori]
  );
  const menuResults = useMemo(
    () => (hasFilter ? searchMenuItems({ query, kategori }) : []),
    [query, kategori, hasFilter]
  );

  function handleCategoryChange(key) {
    const next = new URLSearchParams(params);
    if (key === "semua") next.delete("kategori");
    else next.set("kategori", key);
    setParams(next); // push — supaya tombol Back browser bisa mengembalikan kategori sebelumnya
  }

  function clearFilters() {
    setParams({});
  }

  // Tombol "Filter" di VendorList: bawa user ke pilihan kategori.
  function scrollToCategories() {
    const el = document.querySelector(".category-filter");
    if (el) el.scrollIntoView({ block: "center" });
  }

  return (
    <>
      <WelcomeHeader
        schoolName="SMK Negeri 6 Jakarta"
        userName={user?.name || "Tamu"}
        balance={balance}
        onTopUp={() => navigate("/topup")}
      />

      <CategoryFilter active={kategori} onChange={handleCategoryChange} />

      {hasFilter && menuResults.length > 0 && (
        <SearchResults items={menuResults} query={query} kategori={kategori} />
      )}

      {hasFilter &&
      filteredVendors.length === 0 &&
      menuResults.length === 0 ? (
        <SearchEmpty query={query} onClear={clearFilters} />
      ) : (
        <VendorList
          vendors={filteredVendors}
          title={
            hasFilter
              ? query.trim()
                ? `Vendor untuk "${query.trim()}"`
                : `Vendor kategori ${getCategoryLabel(kategori)}`
              : "Vendor Kantin Terpopuler"
          }
          count={hasFilter ? filteredVendors.length : undefined}
          filterLabel={hasFilter ? "Hapus filter" : "Filter"}
          onFilterClick={hasFilter ? clearFilters : scrollToCategories}
          onViewMenu={(vendor) => navigate(`/menu/${vendor.id}`)}
        />
      )}
    </>
  );
}
