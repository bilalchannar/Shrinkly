import React from "react";
import { useSearchParams } from "react-router-dom";
import "../Css/WarningPage.css";

export default function WarningPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "suspicious";
  const code = searchParams.get("code") || "";
  const domain = searchParams.get("domain") || "";
  const urlParam = searchParams.get("url") || "";

  // Parse hostname for clear domain spotlight
  let targetDomain = "Unknown Destination";
  try {
    if (urlParam) {
      const parsed = new URL(urlParam);
      targetDomain = parsed.hostname;
    }
  } catch (e) {
    targetDomain = urlParam || targetDomain;
  }

  // Construct continue bypass URL
  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const backendHost = apiBase.replace("/api", "");
  const bypassUrl = domain 
    ? `http://${domain}/${code}?continue=1` 
    : `${backendHost}/r/${code}?continue=1`;

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  const isBlocked = status === "blocked";

  return (
    <div className="warning-page-container">
      <div className={`warning-card card-ds animate-scale-up ${isBlocked ? "border-blocked" : "border-suspicious"}`}>
        <div className="warning-icon-wrap">
          <span className="warning-icon-large">{isBlocked ? "🚫" : "⚠️"}</span>
        </div>

        <h1 className="warning-title">
          {isBlocked ? "Deactivated Link: Blocked by Administrator" : "Suspicious Link: Proceed with Caution"}
        </h1>

        <p className="warning-explanation">
          {isBlocked ? (
            "For your safety, this link has been deactivated because our system or safety team determined it points to phishing, malware, spam, or malicious content."
          ) : (
            "This link contains keywords or structures that our automatic filters flagged as suspicious (e.g. login prompts, verify requests, or financial scams). It could be an attempt to steal your credentials."
          )}
        </p>

        <div className="domain-spotlight-box">
          <span className="spotlight-lbl">Destination target domain:</span>
          <strong className="spotlight-val">{targetDomain}</strong>
          {!isBlocked && (
            <p className="spotlight-url-full">{urlParam}</p>
          )}
        </div>

        <div className="warning-actions-row">
          <button onClick={handleGoBack} className="btn-ds btn-ds-secondary warning-btn-back">
            ↩ Go Back to Safety
          </button>
          
          {!isBlocked && (
            <a 
              href={bypassUrl} 
              className="btn-ds btn-ds-danger warning-btn-continue"
              rel="nofollow noopener noreferrer"
            >
              Continue Anyway
            </a>
          )}
        </div>

        <div className="warning-card-footer">
          <a href="/report-abuse" className="report-abuse-lnk">Report this link to our safety team</a>
        </div>
      </div>
    </div>
  );
}
