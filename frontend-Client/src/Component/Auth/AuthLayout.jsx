import React from "react";
import "./AuthLayout.css";

const logoIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 2v6a2 2 0 0 0 2 2v12M7 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2M11 2v20M17 2c-2 0-3 2-3 5v4c0 1.5 1 2 2 2h2v9" />
  </svg>
);

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout-card">
        <div className="auth-layout-logo">
          <span className="auth-layout-logo-icon">{logoIcon}</span>
          SchoolDesk
        </div>
        <h1 className="auth-layout-title">{title}</h1>
        {subtitle && <p className="auth-layout-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}