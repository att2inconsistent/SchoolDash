import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WalletProvider } from "./context/WalletContext.jsx";
import { OrderProvider } from "./context/OrderContext.jsx";
import { CatalogProvider } from "./context/CatalogContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <WalletProvider>
        <CartProvider>
          <OrderProvider>
            <CatalogProvider>
              <App />
            </CatalogProvider>
          </OrderProvider>
        </CartProvider>
      </WalletProvider>
    </AuthProvider>
  </React.StrictMode>
);