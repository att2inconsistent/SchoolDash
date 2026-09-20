import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import Sidebar from "./Component/Navbar/Sidebar";
import Topbar from "./Component/Topbar/Topbar";
import LoginPage from "./Component/Auth/LoginPage";
import RegisterPage from "./Component/Auth/RegisterPage";
import OtpPage from "./Component/Auth/OtpPage";
import WelcomeHeader from "./Component/Welcome/WelcomeHeader";
import CategoryFilter from "./Component/Category/CategoryFilter";
import VendorList from "./Component/Vendor/VendorList";
import VendorMenuPage from "./Component/Menu/VendorMenuPage";
import PesananSayaPage from "./Component/Pesanan/PesananSayaPage";
import FloatingCartBar from "./Component/Cart/FloatingCartBar";

function App() {
  const [selectedVendor, setSelectedVendor] = useState(null);
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState("beranda");
  const [pendingOtpEmail, setPendingOtpEmail] = useState("");

  // Contoh data vendor & menu, ganti di backend nanti
  const vendors = [
    { id: 1, name: "Konsinyasi", tags: ["Nasi kulit jeruk", "Nasi Goreng"], rating: 4.8, time: "10-15 Menit", image: null },
    { id: 2, name: "Mie Ayam", tags: ["Mie ayam", "Mie yamin"], rating: 4.6, time: "5-10 Menit", image: null },
    { id: 3, name: "Kedai Jus", tags: ["Jus Buah", "Healthy"], rating: 4.9, time: "15-20 Menit", image: null },
  ];

  // Contoh data menu per vendor, ganti di backend nanti (id sesuain sama vendor kalo bisa)
  const menuByVendor = {
    1: [
      { id: "1-1", name: "Nasi Kulit Jeruk", description: "Nasi + kulit ayam + daun jeruk", price: 10000, image: null },
      { id: "1-2", name: "Nasi Goreng", description: "Nasi yang di goreng", price: 10000, image: null },
      { id: "1-3", name: "Ayam Geprek", description: "Ayam crispy + sambal", price: 10000, image: null },
    ],
    2: [
      { id: "2-1", name: "Mie Ayam", description: "Mie + ayam cincang + pangsit goreng", price: 12000, image: null },
      { id: "2-2", name: "Mie Yamin", description: "Mie + ayam cincang + pangsit goreng + kecap", price: 12000, image: null },
    ],
    3: [
      { id: "3-1", name: "Jus Alpukat", description: "Jus alpukat segar", price: 10000, image: null },
      { id: "3-2", name: "Jus Jeruk", description: "Jus jeruk peras asli", price: 10000, image: null },
    ],
  };

  const { addItem } = useCart();

  function handleViewMenu(vendor) {
    setSelectedVendor(vendor);
    setActivePage("menu");
  }

  if (activePage === "login") {
    return (
      <LoginPage
        onNavigateRegister={() => setActivePage("register")}
        onLoginSuccess={() => setActivePage("beranda")}
      />
    );
  }
  if (activePage === "register") {
    return (
      <RegisterPage
        onNavigateLogin={() => setActivePage("login")}
        onRegisterSuccess={(email) => {
          setPendingOtpEmail(email);
          setActivePage("otp");
        }}
        onLoginSuccess={() => setActivePage("beranda")}
      />
    );
  }
  if (activePage === "otp") {
    return (
      <OtpPage
        email={pendingOtpEmail}
        onVerifySuccess={() => setActivePage("beranda")}
        onBack={() => setActivePage("register")}
      />
    );
  }

  return (
    <div>
      <Sidebar
        activeKey={activePage === "menu" ? "beranda" : activePage}
        onNavigate={setActivePage}
      />
      <div style={{ marginLeft: "76px" }}>
        <Topbar
          user={user}
          onSearch={(q) => console.log("cari:", q)}
          onLogout={logout}
          onLoginClick={() => setActivePage("login")}
          onRegisterClick={() => setActivePage("register")}
        />
        <main style={{ padding: "28px" }}>
          {activePage === "beranda" && (
            <>
              <WelcomeHeader
                schoolName="SMK Negeri 6 Jakarta"
                userName={user?.name || "Tamu"}
                balance={user ? 999999 : null}
                onTopUp={() => console.log("isi saldo")}
              />

              <CategoryFilter
                onChange={(key) => console.log("kategori:", key)}
              />

              <VendorList
                vendors={vendors}
                onFilterClick={() => console.log("buka filter")}
                onViewMenu={handleViewMenu}
              />
            </>
          )}

          {activePage === "menu" && selectedVendor && (
            <VendorMenuPage
              vendor={selectedVendor}
              menuItems={menuByVendor[selectedVendor.id] || []}
              onBack={() => setActivePage("beranda")}
            />
          )}

          {activePage === "pesanan" && <PesananSayaPage />}
        </main>

        {activePage !== "pesanan" && (
          <FloatingCartBar onViewCart={() => setActivePage("pesanan")} />
        )}
      </div>
    </div>
  );
}

export default App;