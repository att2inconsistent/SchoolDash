/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    api('/catalog/categories')
      .then(res => setCategories(res.categories || []))
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, []);

  function getCategoryLabel(key) {
    if (key === "semua") return "Semua";
    const cat = categories.find((c) => c.key === key);
    return cat ? cat.label : "Semua";
  }

  async function loadVendors(query = "", category = "semua") {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category && category !== "semua") params.set("category", category);
    const qs = params.toString();
    const res = await api(`/catalog/vendors${qs ? `?${qs}` : ""}`);
    return res.vendors || [];
  }

  async function loadMenus(query = "", category = "semua") {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category && category !== "semua") params.set("category", category);
    const qs = params.toString();
    const res = await api(`/catalog/menus${qs ? `?${qs}` : ""}`);
    return res.menus || [];
  }

  async function getVendor(vendorId) {
    // vendorId is passed as number or string, API expects param
    const res = await api(`/catalog/vendors/${vendorId}`);
    return res.vendor || null;
  }

  async function getVendorMenus(vendorId) {
    const res = await api(`/catalog/menus?vendorId=${vendorId}`);
    return res.menus || [];
  }

  return (
    <CatalogContext.Provider value={{
      categories,
      loadingCats,
      getCategoryLabel,
      loadVendors,
      loadMenus,
      getVendor,
      getVendorMenus
    }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
