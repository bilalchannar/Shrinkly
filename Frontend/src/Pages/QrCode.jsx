import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import QRCode from "react-qr-code";
import "../Css/QrCode.css";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { qrCodeAPI } from "../services/api";

const QRCodePage = () => {
  const [searchParams] = useSearchParams();
  const [destinationUrl, setDestinationUrl] = useState('');
  const [title, setTitle] = useState('');
  const [qrColor, setQrColor] = useState('#6f42c1');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(200);
  const [createShortLink, setCreateShortLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [savedQRCodes, setSavedQRCodes] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch saved QR codes on mount and check for URL param
  useEffect(() => {
    fetchQRCodes();
    
    // Pre-fill URL from query params if provided
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setDestinationUrl(urlParam);
    }
  }, [searchParams]);

  const fetchQRCodes = async () => {
    try {
      const data = await qrCodeAPI.getAll();
      if (data.success) {
        setSavedQRCodes(data.qrCodes);
      }
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    }
  };

  const showMessage = (type, text) => {
    if (type === 'success') toast.success(text);
    else toast.error(text);
  };

  const handleSaveQRCode = async () => {
    if (!destinationUrl.trim()) {
      showMessage('error', 'Please enter a URL first');
      return;
    }

    try {
      setSaving(true);
      const data = await qrCodeAPI.create({
        destinationUrl: destinationUrl.trim(),
        title: title.trim() || 'Untitled QR Code',
        qrColor,
        bgColor,
        size: qrSize,
        createShortLink
      });

      if (data.success) {
        showMessage('success', 'QR Code saved successfully!');
        setShowHistory(true); // Automatically show history so user sees the new entry
        fetchQRCodes();
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to save QR Code');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (format) => {
    if (!destinationUrl.trim()) {
      showMessage('error', 'Enter a URL first');
      return;
    }

    const svg = document.querySelector("#qr-svg");
    const svgData = new XMLSerializer().serializeToString(svg);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = qrSize;
    canvas.height = qrSize;

    img.onload = () => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, qrSize, qrSize);
      ctx.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `shrinkly-qr-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleDeleteQRCode = async (id) => {
    if (!window.confirm('Are you sure you want to delete this QR Code?')) return;
    
    try {
      const data = await qrCodeAPI.delete(id);
      if (data.success) {
        showMessage('success', 'QR Code deleted successfully!');
        fetchQRCodes();
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to delete QR Code');
    }
  };

  const handleLoadQRCode = (qr) => {
    setDestinationUrl(qr.destinationUrl);
    setTitle(qr.title);
    setQrColor(qr.qrColor);
    setBgColor(qr.bgColor);
    setQrSize(qr.size);
    setShowHistory(false);
    showMessage('success', 'QR Code loaded!');
  };

  const handleReset = () => {
    setDestinationUrl('');
    setTitle('');
    setQrColor('#6f42c1');
    setBgColor('#ffffff');
    setQrSize(200);
    setCreateShortLink(false);
  };

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="qr-page">
          {/* Header */}
          <header className="qr-header">
            <div className="qr-header-left">
              <h1>QR Code Generator</h1>
              <p>Create and customize trackable QR codes for your links</p>
            </div>
            <div className="qr-header-right">
              <button className="btn-history-toggle" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? "✕ Close History" : "📂 View History"}
              </button>
            </div>
          </header>




        {/* Main Content */}
        <div className="qr-container">
          {/* Left - Form Section */}
          <div className="qr-form-section">
            <div className="qr-card">
              <div className="card-header">
                <span className="card-icon">🔗</span>
                <h2>Link Details</h2>
              </div>
              
              <div className="form-group">
                <label className="form-label">Destination URL</label>
                <input 
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/my-long-url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                />
                <span className="input-hint">Enter the URL you want to encode</span>
              </div>

              <div className="form-group">
                <label className="form-label">Title (optional)</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="My QR Code"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="createShortLink"
                  checked={createShortLink}
                  onChange={(e) => setCreateShortLink(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="createShortLink" style={{ cursor: 'pointer' }}>
                  Also create a trackable short link
                </label>
              </div>
            </div>

            <div className="qr-card">
              <div className="card-header">
                <span className="card-icon">🎨</span>
                <h2>Customize Design</h2>
              </div>
              
              <div className="customize-grid">
                <div className="form-group">
                  <label className="form-label">QR Code Color</label>
                  <div className="color-picker-wrapper">
                    <input 
                      type="color"
                      className="color-input"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                    />
                    <span className="color-value">{qrColor}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Background Color</label>
                  <div className="color-picker-wrapper">
                    <input 
                      type="color"
                      className="color-input"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                    />
                    <span className="color-value">{bgColor}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Size: {qrSize}px</label>
                <input 
                  type="range"
                  className="range-input"
                  min="100"
                  max="400"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                />
                <div className="range-labels">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>
            </div>

            {/* History Toggle */}
            <button 
              className="btn-secondary" 
              onClick={() => setShowHistory(!showHistory)}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {showHistory ? '📝 Hide History' : '📂 Show History'} ({savedQRCodes.length})
            </button>

            {/* QR Code History */}
            {showHistory && (
              <div className="qr-card" style={{ marginTop: '15px' }}>
                <div className="card-header">
                  <span className="card-icon">📂</span>
                  <h2>Saved QR Codes</h2>
                </div>
                {savedQRCodes.length === 0 ? (
                  <div className="empty-state-ds" style={{ padding: "2rem 1rem" }}>
                    <span className="icon-wrap" style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📱</span>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>No QR Codes Saved</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                      Enter details and click 'Save to Account' to store QR codes here.
                    </p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {savedQRCodes.map(qr => (
                      <div key={qr._id} style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>{qr.title}</strong>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                            {qr.destinationUrl.substring(0, 40)}...
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleLoadQRCode(qr)}
                            style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Load
                          </button>
                          <button 
                            onClick={() => handleDeleteQRCode(qr._id)}
                            style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--error-color)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right - Preview Section */}
          <div className="qr-preview-section">
            <div className="qr-card preview-card">
              <div className="card-header">
                <span className="card-icon">👁️</span>
                <h2>Preview</h2>
              </div>

              <div className="qr-preview-container" style={{ backgroundColor: bgColor }}>
                {destinationUrl.trim() ? (
                  <QRCode
                    id="qr-svg"
                    value={destinationUrl}
                    size={qrSize > 250 ? 250 : qrSize}
                    fgColor={qrColor}
                    bgColor={bgColor}
                    level="H"
                  />
                ) : (
                  <div className="qr-placeholder">
                    <span className="placeholder-icon">📷</span>
                    <p>Enter a URL to generate QR code</p>
                  </div>
                )}
              </div>

              {title && <p className="qr-title-preview">{title}</p>}

              <div className="download-options">
                <button 
                  className="download-btn primary"
                  onClick={() => handleDownload('png')}
                  disabled={!destinationUrl.trim()}
                >
                  <span>📥</span> Download PNG
                </button>
              </div>

              <div className="qr-stats">
                <div className="stat">
                  <span className="stat-label">Size</span>
                  <span className="stat-value">{qrSize}x{qrSize}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Format</span>
                  <span className="stat-value">PNG</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={handleReset}>
                Reset All
              </button>
              <button 
                className="btn-primary"
                onClick={handleSaveQRCode}
                disabled={!destinationUrl.trim() || saving}
              >
                {saving ? 'Saving...' : 'Save to Account'}
              </button>
            </div>
          </div>
        </div>

        </div>
      </div>
      <Footer />
    </>
  );
};

export default QRCodePage;

