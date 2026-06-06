import React, { useState } from "react";
import api from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import "../Css/ReportAbuse.css";

export default function ReportAbuse() {
  const [shortUrl, setShortUrl] = useState("");
  const [reason, setReason] = useState("phishing");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shortUrl.trim() || !details.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.abuse.report({
        shortUrl: shortUrl.trim(),
        reason,
        details: details.trim(),
        reporterEmail: email.trim() || undefined
      });

      if (res.success) {
        toast.success(res.message || "Report submitted successfully! Thank you for helping keep Shrinkly safe.");
        setShortUrl("");
        setDetails("");
        setEmail("");
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit abuse report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-abuse-container">
      <Toaster position="top-right" />
      <div className="report-abuse-card card-ds-glass animate-scale-up">
        <div className="logo-header">
          <img src="/ShrinklyBlackLogo.png" alt="Shrinkly Logo" className="abuse-logo" />
          <h2>Report Link Abuse</h2>
          <p>
            Shrinkly takes safety seriously. If you encountered a link that violates our terms of service (phishing, malware, spam, or malicious content), please report it below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label className="label-ds" htmlFor="shortUrlInput">Reported Short Link / Code *</label>
            <input
              id="shortUrlInput"
              type="text"
              className="input-ds"
              placeholder="e.g. shrinkly.link/promo or just promo"
              value={shortUrl}
              onChange={(e) => setShortUrl(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="label-ds" htmlFor="reasonSelect">Reason for Report *</label>
            <select
              id="reasonSelect"
              className="input-ds"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              style={{ cursor: "pointer" }}
            >
              <option value="phishing">🎣 Phishing / Social Engineering</option>
              <option value="malware">🦠 Malware / Virus / Insecure Target</option>
              <option value="spam">📨 Spam / Unsolicited Ads</option>
              <option value="inappropriate">🔞 Inappropriate / Harmful Content</option>
              <option value="other">❓ Other Violations</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label-ds" htmlFor="detailsTextarea">Additional Evidence / Details *</label>
            <textarea
              id="detailsTextarea"
              className="input-ds textarea-ds"
              placeholder="Describe why this link is malicious or harmful..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              required
              disabled={loading}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="form-group">
            <label className="label-ds" htmlFor="emailInput">Your Email Address (optional)</label>
            <input
              id="emailInput"
              type="email"
              className="input-ds"
              placeholder="Enter email if you wish to receive updates"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-ds btn-ds-primary submit-btn-abuse"
            disabled={loading}
            style={{ width: "100%", marginTop: "1rem" }}
          >
            {loading ? "Submitting Report..." : "Submit Abuse Report"}
          </button>
        </form>
        
        <div className="footer-links">
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
