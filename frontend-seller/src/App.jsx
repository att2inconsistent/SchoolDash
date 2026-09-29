import { useLayoutEffect, useRef } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useMenu } from "./context/MenuContext";
import { useOrders } from "./context/OrderContext";
import Sidebar from "./Component/Navbar/Sidebar";
import BottomNav from "./Component/Navbar/BottomNav";
import Topbar from "./Component/Topbar/Topbar";
import LoginPage from "./Component/Auth/LoginPage";
import RegisterPage from "./Component/Auth/RegisterPage";
import OtpPage from "./Component/Auth/OtpPage";
import PageStage from "./Component/Layout/PageStage";
import DashboardPage from "./pages/DashboardPage";
import MenuPage from "./pages/MenuPage";
import OrdersPage from "./pages/OrdersPage";
import WalletPage from "./pages/WalletPage";
import ProfilePage from "./pages/ProfilePage";
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

/** Bungkus seluruh halaman utama — wajib login. */
function ProtectedLayout({ message }) {
  return (
    <RequireAuth message={message}>
      <Outlet />
    </RequireAuth>
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
  const { myVendor } = useMenu();
  const { pendingCount } = useOrders();
  const rootRef = useRef(null);

  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const redirectTarget = (location.state && location.state.from) || "/";

  // Animasi pembuka — jalan sekali saat aplikasi dimuat (sama seperti
  // frontend-user: useLayoutEffect supaya tidak ada kedip di frame pertama).
  useLayoutEffect(() => playIntro(rootRef.current), []);

  const storeName = myVendor?.name || user?.storeName || "";

  return (
    <div className={"app" + (isAuthPage ? " app--auth" : "")} ref={rootRef}>
      <Sidebar />

      <div className="app-body">
        <Topbar
          user={user}
          storeName={storeName}
          pendingCount={pendingCount}
          onLogout={() => {
            logout();
            navigate("/login");
          }}
        />

        <main className="app-main">
          <Routes>
            {/* PageStage = panggung crossfade antar halaman */}
            <Route element={<PageStage />}>
              <Route
                element={
                  <ProtectedLayout message="Silakan login untuk membuka dashboard penjual." />
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/pesanan" element={<OrdersPage />} />
                <Route path="/saldo" element={<WalletPage />} />
                <Route path="/profil" element={<ProfilePage />} />
              </Route>

              <Route
                path="/login"
                element={
                  <GuestOnly>
                    <LoginPage
                      message={location.state && location.state.message}
                      onNavigateRegister={() => navigate("/register")}
                      onLoginSuccess={() =>
                        navigate(redirectTarget, { replace: true })
                      }
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
                    />
                  </GuestOnly>
                }
              />

              <Route path="/otp" element={<OtpRoute />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

export default App;
