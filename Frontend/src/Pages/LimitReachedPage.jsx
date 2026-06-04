import React from "react";
import { useSearchParams } from "react-router-dom";
import "../Css/RedirectPages.css";

export default function LimitReachedPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "";

  return (
    <div className="redirect-page-container">
      <div className="redirect-card card-ds">
        <div className="redirect-icon">🚫</div>
        <h1 className="redirect-title">Click Limit Reached</h1>
        <p className="redirect-message">
          This Shrinkly link is no longer available. The maximum number of clicks has been reached.
        </p>
        {code && (
          <div className="redirect-code-badge">
            <span>/{code}</span>
          </div>
        )}
        <div className="redirect-actions">
          <a href="/" className="btn-ds btn-ds-primary">Go to Shrinkly Home</a>
        </div>
        <div className="redirect-branding">
          <span className="brand-text">Powered by <strong>Shrinkly</strong></span>
        </div>
      </div>
    </div>
  );
}
