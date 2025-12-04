import { useState } from "react";
import QRCode from "react-qr-code";
import "../Css/QrCode.css";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";

export default function QrCode() {
  const [url, setUrl] = useState("");

  return (
    <>
      <Sidebar />

      <div className="main-content">
        <div className="page active qr-page">

          <div className="qr-generator-container">
            <h1 className="qr-title">Shrinkly QR Generator</h1>

            <div className="qr-input-section">
              <input
                type="text"
                placeholder="Enter URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="qr-input"
              />
            </div>

            <div className="qr-output-section">
              {url ? (
                <QRCode value={url} size={180} />
              ) : (
                <p className="qr-placeholder">QR Preview</p>
              )}
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}