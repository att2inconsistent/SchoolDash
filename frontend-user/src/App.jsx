import { useLayoutEffect, useRef } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./Component/Navbar/Sidebar";
import BottomNav from "./Component/Navbar/BottomNav";
import Topbar from "./Component/Topbar/Topbar";
import LoginPage from "./Component/Auth/LoginPage";
import RegisterPage from "./Component/Auth/RegisterPage";
import OtpPage from "./Component/Auth/OtpPage";
import VendorMenuPage from "./Component/Menu/VendorMenuPage";
import PesananSayaPage from "./Component/Pesanan/PesananSayaPage";
import TopUpPage from "./Component/TopUp/TopUpPage";
import ProfilePage from "./Component/Profile/ProfilePage";
import FloatingCartBar from "./Component/Cart/FloatingCartBar";
import BerandaPage from "./pages/BerandaPage";
import PageStage from "./Component/Layout/PageStage";
import { getMenuByVendor, getVendorById } from "./data/menuData";
import { playIntro } from "./animation/intro";
import "./App.css";

const AUTH_PATHS = ["/login", "/register", "/otp"];

/** Halaman auth tidak boleh dibuka kalau sudah login. */
function GuestOnly({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user) return <Navigate to={location.state?.from || "/"} replace />;
  return children;
}

/** Halaman yang butuh login — kalau belum, lempar ke /login dulu. */
function RequireAuth({ children, message }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, message }}
      />
    );
  }
  return children;
}

/** Halaman detail menu vendor: /menu/:vendorId */
function VendorMenuRoute() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const vendor = getVendorById(vendorId);

  if (!vendor) return <Navigate to="/" replace />;

  return (
    <VendorMenuPage
      vendor={vendor}
      menuItems={getMenuByVendor(vendorId)}
      onBack={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/"))}
    />
  );
}

/** Halaman OTP — kalau tidak ada proses registrasi, kembali ke form daftar. */
function OtpRoute() {
  const navigate = useNavigate();
  const { pendingRegistration } = useAuth();

  if (!pendingRegistration) return <Navigate to="/register" replace />;

  return (
    <OtpPage
      email={pendingRegistration.email}
      onVerifySuccess={() => navigate("/", { replace: true })}
      onBack={() => navigate("/register")}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const rootRef = useRef(null);

  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const redirectTarget = (location.state && location.state.from) || "/";

  const searchQuery = new URLSearchParams(location.search).get("q") ?? "";

  /**
   * Kolom pencarian di Topbar menulis filter ke URL query (`/?q=...`) supaya
   * hasil pencarian tetap ada saat refresh dan bisa dibagikan.
   * - Saat sudah di `/`: pakai replace biar riwayat browser tidak dipenuhi
   *   1 tiap huruf yang diketik.
   * - Dari halaman lain: push dulu sekali, supaya tombol Back tetap kembali
   *   ke halaman sebelumnya (mis. /menu/1).
   */
  function handleSearchChange(value) {
    const params = new URLSearchParams(location.search);
    if ((params.get("q") ?? "") === value) return;

    if (value) params.set("q", value);
    else params.delete("q");

    const onBeranda = location.pathname === "/";
    const search = params.toString();

    navigate(
      { pathname: "/", search: search ? `?${search}` : "" },
      { replace: onBeranda }
    );
  }

  // Animasi pembuka — jalan sekali saat aplikasi dimuat.
  // useLayoutEffect: nilai awal diterapkan sebelum frame pertama digambar,
  // jadi tidak ada kedip, dan hanya memutar animasi 4 group element.
  useLayoutEffect(() => playIntro(rootRef.current), []);

  const showCartBar =
    !isAuthPage &&
    location.pathname !== "/pesanan" &&
    location.pathname !== "/topup";

  return (
    <div className={"app" + (isAuthPage ? " app--auth" : "")} ref={rootRef}>
      <Sidebar />

      <div className="app-body">
        <Topbar
          user={user}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onLogout={() => {
            logout();
            navigate("/");
          }}
          onLoginClick={() => navigate("/login")}
          onRegisterClick={() => navigate("/register")}
          onProfileClick={() => navigate("/profil")}
        />

        <main className="app-main">
          <Routes>
            {/* PageStage = panggung crossfade antar halaman */}
            <Route element={<PageStage />}>
              <Route index element={<BerandaPage />} />

              <Route path="/menu/:vendorId" element={<VendorMenuRoute />} />

              <Route path="/pesanan" element={<PesananSayaPage />} />

              <Route
                path="/topup"
                element={
                  <RequireAuth message="Silakan login untuk mengisi saldo.">
                    <TopUpPage onBack={() => navigate("/")} />
                  </RequireAuth>
                }
              />

              <Route
                path="/profil"
                element={
                  <RequireAuth message="Silakan login untuk melihat profil dan riwayat pesanan kamu.">
                    <ProfilePage />
                  </RequireAuth>
                }
              />

              <Route
                path="/login"
                element={
                  <GuestOnly>
                    <LoginPage
                      message={location.state && location.state.message}
                      onNavigateRegister={() => navigate("/register")}
                      onLoginSuccess={() => navigate(redirectTarget, { replace: true })}
                    />
                  </GuestOnly>
                }
              />

              <Route
                path="/register"
                element={
                  <GuestOnly>
                    <RegisterPage
                      onNavigateLogin={() => navigate("/login")}
                      onRegisterSuccess={() => navigate("/otp")}
                      onLoginSuccess={() => navigate("/", { replace: true })}
                    />
                  </GuestOnly>
                }
              />

              <Route path="/otp" element={<OtpRoute />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </main>

        {showCartBar && <FloatingCartBar onViewCart={() => navigate("/pesanan")} />}
      </div>

      <BottomNav />
    </div>
  );
}

export default App;
