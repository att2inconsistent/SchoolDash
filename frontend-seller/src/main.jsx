import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./styles/ui.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { MenuProvider } from "./context/MenuContext.jsx";
import { WalletProvider } from "./context/WalletContext.jsx";
import { OrderProvider } from "./context/OrderContext.jsx";

// Urutan provider penting:
//   Auth  -> semua context lain butuh user yang login
//   Menu  -> kantin & menu (dipakai Order untuk tahu milik kantin siapa)
//   Wallet-> saldo & penarikan
//   Order -> pesanan masuk, meneruskan duitnya ke Wallet saat diterima
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <MenuProvider>
        <WalletProvider>
          <OrderProvider>
            <App />
          </OrderProvider>
        </WalletProvider>
      </MenuProvider>
    </AuthProvider>
  </React.StrictMode>
);
