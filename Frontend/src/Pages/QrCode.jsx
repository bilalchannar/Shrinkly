import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import QRCodeStyling from "qr-code-styling";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { qrCodeAPI, linksAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../Css/QrCode.css";

const QRCodePage = () => {
  const [searchParams] = useSearchParams();
  const { activeWorkspace, workspaces } = useAuth();
  const [destinationUrl, setDestinationUrl] = useState('');
  const [name, setName] = useState('');
  const [qrColor, setQrColor] = useState('#6f42c1');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(250);
  const [roundedModules, setRoundedModules] = useState(false);
  const [transparentBg, setTransparentBg] = useState(false);
  const [eyeStyle, setEyeStyle] = useState('square');
  const [eyeColor, setEyeColor] = useState('#6f42c1');
  const [logoUrl, setLogoUrl] = useState('');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('Q');
  
  const [shortLinks, setShortLinks] = useState([]);
  const [shortLinkId, setShortLinkId] = useState('');
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedQRCodes, setSavedQRCodes] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [activeQrId, setActiveQrId] = useState(null);
  const [creationWorkspaceId, setCreationWorkspaceId] = useState("personal");

  const qrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const [qrCodeStyling, setQrCodeStyling] = useState(null);

  // Sync creation workspace with active workspace
  useEffect(() => {
    setCreationWorkspaceId(activeWorkspace || "personal");
  }, [activeWorkspace]);

  // Fetch data on mount & workspace switch
  useEffect(() => {
    fetchQRCodes();
    fetchLinks();

    // Pre-fill URL from query params if provided
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setDestinationUrl(urlParam);
    }
  }, [searchParams, activeWorkspace]);

  // Initialize qr-code-styling
  useEffect(() => {
    const qrCode = new QRCodeStyling({
      width: qrSize,
      height: qrSize,
      data: destinationUrl || "https://shrinkly.link",
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: errorCorrectionLevel
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 5
      },
      dotsOptions: {
        type: roundedModules ? "rounded" : "square",
        color: qrColor
      },
      backgroundOptions: {
        color: transparentBg ? "transparent" : bgColor
      },
      cornersSquareOptions: {
        type: eyeStyle,
        color: eyeColor || qrColor
      },
      cornersDotOptions: {
        type: eyeStyle,
        color: eyeColor || qrColor
      }
    });

    setQrCodeStyling(qrCode);

    if (qrCodeRef.current) {
      qrCodeRef.current.innerHTML = "";
      qrCode.append(qrCodeRef.current);
    }
  }, []);

  // Update QR Code styling when settings change
  useEffect(() => {
    if (!qrCodeStyling) return;

    // Use tracking redirect link if QR Code is saved, otherwise raw destination URL
    const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    const dataUrl = activeQrId
      ? `${apiBaseUrl}/qrcode/${activeQrId}/scan`
      : (destinationUrl || "https://shrinkly.link");

    qrCodeStyling.update({
      data: dataUrl,
      width: qrSize,
      height: qrSize,
      qrOptions: {
        errorCorrectionLevel: errorCorrectionLevel
      },
      dotsOptions: {
        type: roundedModules ? "rounded" : "square",
        color: qrColor
      },
      backgroundOptions: {
        color: transparentBg ? "transparent" : bgColor
      },
      cornersSquareOptions: {
        type: eyeStyle,
        color: eyeColor || qrColor
      },
      cornersDotOptions: {
        type: eyeStyle,
        color: eyeColor || qrColor
      },
      image: logoUrl || ""
    });
  }, [qrCodeStyling, destinationUrl, qrSize, qrColor, bgColor, roundedModules, transparentBg, eyeStyle, eyeColor, logoUrl, errorCorrectionLevel, activeQrId]);

  const fetchQRCodes = async () => {
    try {
      const data = await qrCodeAPI.getAll({ workspaceId: activeWorkspace });
      if (data.success) {
        setSavedQRCodes(data.qrCodes || []);
      }
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    }
  };

  const fetchLinks = async () => {
    try {
      setLoadingLinks(true);
      const data = await linksAPI.getAll({ limit: 100, workspaceId: activeWorkspace });
      if (data.success) {
        setShortLinks(data.links || []);
      }
    } catch (err) {
      console.error("Error fetching links:", err);
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Logo file size must be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveQRCode = async () => {
    if (!destinationUrl.trim()) {
      toast.error("Please enter a destination URL first");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter a name/title for this QR code");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        title: name.trim(),
        destinationUrl: destinationUrl.trim(),
        shortLinkId: shortLinkId || null,
        linkId: shortLinkId || null,
        qrColor,
        bgColor: transparentBg ? "transparent" : bgColor,
        size: qrSize,
        workspaceId: creationWorkspaceId !== "personal" ? creationWorkspaceId : undefined,
        qrOptions: {
          width: qrSize,
          height: qrSize,
          dotsOptions: {
            color: qrColor,
            type: roundedModules ? "rounded" : "square"
          },
          backgroundOptions: {
            color: transparentBg ? "transparent" : bgColor
          },
          cornersSquareOptions: {
            color: eyeColor || qrColor,
            type: eyeStyle || "square"
          },
          cornersDotOptions: {
            color: eyeColor || qrColor,
            type: eyeStyle || "square"
          },
          qrOptions: {
            errorCorrectionLevel: errorCorrectionLevel
          },
          image: logoUrl || ""
        }
      };

      let res;
      if (activeQrId) {
        res = await qrCodeAPI.update(activeQrId, payload);
      } else {
        res = await qrCodeAPI.create(payload);
      }

      if (res.success) {
        toast.success(activeQrId ? "QR Code updated successfully!" : "QR Code saved to account!");
        fetchQRCodes();
        setShowHistory(true);
        if (!activeQrId) {
          handleReset();
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to save QR Code");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeStyling) return;
    qrCodeStyling.download({
      name: `shrinkly-qr-${name.trim().replace(/\s+/g, '-') || Date.now()}`,
      extension: "png"
    });
    if (activeQrId) {
      qrCodeAPI.trackDownload(activeQrId).catch(err => console.error("Error tracking download:", err));
    }
  };

  const handleDeleteQRCode = async (id) => {
    setConfirmAction({
      title: "Delete QR Code",
      message: "Are you sure you want to delete this QR Code? This will delete all tracking scan analytics associated with it.",
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          const data = await qrCodeAPI.delete(id);
          if (data.success) {
            toast.success("QR Code deleted successfully!");
            if (activeQrId === id) {
              handleReset();
            }
            fetchQRCodes();
          }
        } catch (error) {
          toast.error(error.message || "Failed to delete QR Code");
        }
      }
    });
  };

  const handleLoadQRCode = (qr) => {
    setActiveQrId(qr._id);
    setDestinationUrl(qr.destinationUrl);
    setName(qr.name || qr.title || "");
    setQrColor(qr.qrColor || "#6f42c1");
    setBgColor(qr.bgColor === "transparent" ? "#ffffff" : (qr.bgColor || "#ffffff"));
    setQrSize(qr.size || 250);
    setRoundedModules(qr.qrOptions?.dotsOptions?.type === "rounded");
    setTransparentBg(qr.bgColor === "transparent" || qr.qrOptions?.backgroundOptions?.color === "transparent");
    setEyeStyle(qr.qrOptions?.cornersSquareOptions?.type || "square");
    setEyeColor(qr.qrOptions?.cornersSquareOptions?.color || qr.qrColor || "#6f42c1");
    setLogoUrl(qr.qrOptions?.image || "");
    setErrorCorrectionLevel(qr.qrOptions?.qrOptions?.errorCorrectionLevel || "Q");
    setShortLinkId(qr.shortLinkId || qr.linkId || "");
    setShowHistory(false);
    toast.success("QR Code loaded into designer!");
  };

  const handleReset = () => {
    setActiveQrId(null);
    setDestinationUrl("");
    setName("");
    setQrColor("#6f42c1");
    setBgColor("#ffffff");
    setQrSize(250);
    setRoundedModules(false);
    setTransparentBg(false);
    setEyeStyle("square");
    setEyeColor("#6f42c1");
    setLogoUrl("");
    setErrorCorrectionLevel("Q");
    setShortLinkId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="qr-page">
          {/* Header */}
          <header className="qr-header">
            <div className="qr-header-left">
              <h1>
                QR Code Designer{" "}
                {workspaces.find((w) => w._id === activeWorkspace)
                  ? `(${workspaces.find((w) => w._id === activeWorkspace).name})`
                  : "(Personal)"}
              </h1>
              <p>Create, customize, and manage premium trackable QR codes</p>
            </div>
            <div className="qr-header-right">
              <button className="btn-history-toggle" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? "✕ Close History" : `📂 View History (${savedQRCodes.length})`}
              </button>
            </div>
          </header>

          {/* Main Content */}
          <div className="qr-container">
            {/* Left - Design Form */}
            <div className="qr-form-section">
              <div className="qr-card">
                <div className="card-header">
                  <span className="card-icon">🔗</span>
                  <h2>QR Destination Link</h2>
                </div>

                <div className="form-group">
                  <label className="form-label">Workspace Context</label>
                  <select
                    className="form-input"
                    value={creationWorkspaceId}
                    onChange={(e) => setCreationWorkspaceId(e.target.value)}
                  >
                    <option value="personal">👤 Personal Space</option>
                    {workspaces.map(ws => (
                      <option key={ws._id} value={ws._id}>
                        {ws.status === "invited" ? "✉️ (Invited) " : "🏢 "}{ws.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Link Source</label>
                  <select
                    className="form-input"
                    value={shortLinkId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setShortLinkId(selectedId);
                      if (selectedId) {
                        const found = shortLinks.find(l => l._id === selectedId);
                        if (found) {
                          setDestinationUrl(`${window.location.origin.replace('3000', '5000')}/r/${found.shortCode}`);
                          if (!name) {
                            setName(`QR - ${found.title || found.shortCode}`);
                          }
                        }
                      } else {
                        setDestinationUrl("");
                      }
                    }}
                  >
                    <option value="">Custom Destination URL (Type manually below)</option>
                    {shortLinks.map(link => (
                      <option key={link._id} value={link._id}>
                        /{link.shortCode} - {link.title || link.originalUrl.substring(0, 30)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination URL</label>
                  <input 
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/my-long-url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    disabled={!!shortLinkId}
                  />
                  <span className="input-hint">
                    {shortLinkId ? "Destination is bound to the selected short link" : "Enter the final URL to redirect scanners to"}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">QR Code Name / Title</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="E.g., Business Card, Menu QR"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Design Customization */}
              <div className="qr-card">
                <div className="card-header">
                  <span className="card-icon">🎨</span>
                  <h2>Customize Design</h2>
                </div>

                <div className="customize-grid">
                  <div className="form-group">
                    <label className="form-label">Modules Color</label>
                    <div className="color-picker-wrapper">
                      <input 
                        type="color"
                        className="color-input"
                        value={qrColor}
                        onChange={(e) => {
                          setQrColor(e.target.value);
                          // Default eye color to match modules color if same
                          if (eyeColor === qrColor) {
                            setEyeColor(e.target.value);
                          }
                        }}
                      />
                      <span className="color-value">{qrColor}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Background Color</label>
                    <div className="color-picker-wrapper" style={{ opacity: transparentBg ? 0.5 : 1 }}>
                      <input 
                        type="color"
                        className="color-input"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        disabled={transparentBg}
                      />
                      <span className="color-value">{transparentBg ? "Transparent" : bgColor}</span>
                    </div>
                  </div>
                </div>

                <div className="customize-grid" style={{ marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={roundedModules} 
                        onChange={(e) => setRoundedModules(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      Rounded QR Modules
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={transparentBg} 
                        onChange={(e) => setTransparentBg(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      Transparent Background
                    </label>
                  </div>
                </div>

                {/* Corner Eyes Overrides */}
                <div className="customize-grid" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Eye Color</label>
                    <div className="color-picker-wrapper">
                      <input 
                        type="color"
                        className="color-input"
                        value={eyeColor}
                        onChange={(e) => setEyeColor(e.target.value)}
                      />
                      <span className="color-value">{eyeColor}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Eye Outer Shape</label>
                    <select
                      className="form-input"
                      value={eyeStyle}
                      onChange={(e) => setEyeStyle(e.target.value)}
                    >
                      <option value="square">Square</option>
                      <option value="dot">Dot / Circle</option>
                      <option value="extra-rounded">Rounded Square</option>
                    </select>
                  </div>
                </div>

                {/* Logo & Error Correction */}
                <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <label className="form-label">Upload Center Logo (Optional)</label>
                  <div className="logo-upload-wrapper" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      📁 Choose Image
                    </button>
                    {logoUrl && (
                      <button 
                        type="button" 
                        className="btn-delete" 
                        onClick={handleRemoveLogo}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: 'none', borderRadius: '12px' }}
                      >
                        ❌ Remove Logo
                      </button>
                    )}
                  </div>
                  {logoUrl && (
                    <div className="logo-preview-box" style={{ marginTop: '10px' }}>
                      <img src={logoUrl} alt="QR Logo" style={{ maxHeight: '40px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Size: {qrSize}px</label>
                  <input 
                    type="range"
                    className="range-input"
                    min="100"
                    max="400"
                    step="10"
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                  />
                  <div className="range-labels">
                    <span>100px</span>
                    <span>400px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Error Correction Level</label>
                  <select
                    className="form-input"
                    value={errorCorrectionLevel}
                    onChange={(e) => setErrorCorrectionLevel(e.target.value)}
                  >
                    <option value="L">Level L (Low - 7%)</option>
                    <option value="M">Level M (Medium - 15%)</option>
                    <option value="Q">Level Q (Quartile - 25% - Recommended for Logos)</option>
                    <option value="H">Level H (High - 30% - Maximum safety)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right - Live Preview & Controls */}
            <div className="qr-preview-section">
              <div className="qr-card preview-card">
                <div className="card-header">
                  <span className="card-icon">👁️</span>
                  <h2>Live Designer Preview</h2>
                </div>

                <div className="qr-preview-container" style={{ background: transparentBg ? "repeating-conic-gradient(#eee 0% 25%, transparent 0% 50%) 50% / 16px 16px" : bgColor }}>
                  <div ref={qrCodeRef} id="qr-svg-container" />
                </div>

                {name && <h3 className="qr-title-preview" style={{ color: 'var(--text-primary)', margin: '0.5rem 0 1.25rem' }}>{name}</h3>}
                {activeQrId && (
                  <div className="edit-indicator-badge" style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', background: 'var(--primary-color)', color: 'white', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    ✏️ Editing Mode (ID: {activeQrId})
                  </div>
                )}

                <div className="download-options">
                  <button 
                    className="download-btn primary"
                    onClick={handleDownload}
                    disabled={!destinationUrl.trim()}
                  >
                    📥 Download PNG
                  </button>
                </div>

                <div className="qr-stats">
                  <div className="stat">
                    <span className="stat-label">Resolution</span>
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
                  Reset style
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleSaveQRCode}
                  disabled={!destinationUrl.trim() || saving}
                  style={{ backgroundColor: activeQrId ? 'var(--primary-color)' : 'var(--success-color)' }}
                >
                  {saving ? 'Saving...' : (activeQrId ? 'Update QR Code' : 'Save QR Code')}
                </button>
              </div>
            </div>
          </div>

          {/* QR History Section */}
          {showHistory && (
            <div className="qr-history-container" style={{ padding: '0 2rem 2rem' }}>
              <div className="qr-card">
                <div className="card-header">
                  <span className="card-icon">📂</span>
                  <h2>QR Designer Management</h2>
                </div>

                {savedQRCodes.length === 0 ? (
                  <div className="empty-state-ds">
                    <span className="empty-icon" style={{ fontSize: '3rem' }}>📱</span>
                    <h3>No QR codes yet</h3>
                    <p>Create your first branded QR code using the designer above.</p>
                  </div>
                ) : (
                  <div className="qr-history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                    {savedQRCodes.map((qr) => (
                      <div key={qr._id} className="qr-history-card" style={{
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        background: 'var(--bg-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        transition: 'transform 0.2s',
                        boxShadow: 'var(--card-shadow)'
                      }}>
                        <div className="qr-card-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{qr.name || qr.title || "Untitled QR Code"}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, wordBreak: 'break-all' }}>
                            <strong>Destination:</strong> {qr.destinationUrl}
                          </p>
                          {qr.shortUrl && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--primary-color)', margin: 0 }}>
                              <strong>Short URL:</strong> {qr.shortUrl}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.75rem' }}>
                            <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                              📊 {qr.scanCount || qr.scans || 0} scans
                            </span>
                            <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                              📅 {new Date(qr.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                          <button
                            onClick={() => handleLoadQRCode(qr)}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => {
                              const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
                              const tempQr = new QRCodeStyling({
                                ...qr.qrOptions,
                                data: `${apiBaseUrl}/qrcode/${qr._id}/scan`
                              });
                              tempQr.download({
                                name: `shrinkly-qr-${qr.name || qr.title || Date.now()}`,
                                extension: "png"
                              });
                              qrCodeAPI.trackDownload(qr._id).catch(err => console.error(err));
                            }}
                            style={{ flex: 1.2, padding: '0.5rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                          >
                            📥 Download
                          </button>
                          <button
                            onClick={() => handleDeleteQRCode(qr._id)}
                            style={{ flex: 0.8, padding: '0.5rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--error-color)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
      {confirmAction && (
        <div className="modal-overlay-ds" onClick={() => setConfirmAction(null)}>
          <div className="modal-content-ds" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '12px', color: 'var(--error-color)' }}>{confirmAction.title}</h2>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>{confirmAction.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn-ds btn-ds-secondary"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="btn-ds btn-ds-danger"
                onClick={confirmAction.onConfirm}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QRCodePage;
