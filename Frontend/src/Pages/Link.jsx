import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import QRCode from "react-qr-code";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import "../Css/Link.css";
import { linksAPI } from "../services/api";

const SkeletonRow = ({ cols = 8 }) => (
  <tr className="skeleton-row">
    {[...Array(cols)].map((_, i) => (
      <td key={i}><div className="skeleton-cell" /></td>
    ))}
  </tr>
);

export default function LinkPage() {
  const navigate = useNavigate();
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [shortLink, setShortLink] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [linkTags, setLinkTags] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxClicks, setMaxClicks] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [previewLink, setPreviewLink] = useState(null);
  const [visibleCols, setVisibleCols] = useState({
    original: true,
    short: true,
    clicks: true,
    expires: true,
    status: true,
    tags: true
  });

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterClicks, setFilterClicks] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const LIMIT = 10;

  const isValidUrl = (url) => { try { new URL(url); return true; } catch { return false; } };

  const fetchLinks = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: LIMIT };
      if (searchQuery) params.search = searchQuery;
      
      // Map frontend filters to API parameters
      if (filterStatus && !["password_protected", "limit_reached"].includes(filterStatus)) {
        params.status = filterStatus;
      }
      
      if (filterTag) params.tag = filterTag;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (sortBy) params.sortBy = sortBy;
      if (filterClicks) {
        const [min, max] = filterClicks.split("-");
        if (min) params.minClicks = min;
        if (max && max !== "+") params.maxClicks = max;
      }
      
      const data = await linksAPI.getAll(params);
      if (data.success) {
        // Perform client-side filter extensions
        let fetchedLinks = data.links;
        if (filterStatus === "password_protected") {
          fetchedLinks = fetchedLinks.filter(l => l.isPasswordProtected);
        } else if (filterStatus === "limit_reached") {
          fetchedLinks = fetchedLinks.filter(l => l.maxClicks && l.clicks >= l.maxClicks);
        }
        
        setLinks(fetchedLinks);
        setPagination(data.pagination);
      }
    } catch (err) {
      toast.error("Failed to load links");
    }
    setLoading(false);
  }, [searchQuery, filterStatus, filterTag, filterStartDate, filterEndDate, sortBy, filterClicks]);

  useEffect(() => { setPage(1); fetchLinks(1); }, [filterStatus, filterTag, filterStartDate, filterEndDate, sortBy, filterClicks]); // eslint-disable-line
  useEffect(() => { fetchLinks(page); }, [page, fetchLinks]); // eslint-disable-line

  const handleSearch = () => { setPage(1); fetchLinks(1); };

  const handleCreateLink = async () => {
    if (!longUrl.trim()) return toast.error("Please enter a URL");
    if (!isValidUrl(longUrl)) return toast.error("Please enter a valid URL (e.g., https://example.com)");

    const toastId = toast.loading("Creating link...");
    try {
      const data = await linksAPI.create({
        originalUrl: longUrl.trim(),
        customSlug: customSlug || undefined,
        tags: linkTags || undefined,
        expiresAt: expiresAt || undefined,
        maxClicks: maxClicks ? parseInt(maxClicks) : undefined,
        password: linkPassword || undefined
      });
      if (data.success) {
        setLinks([data.link, ...links]);
        setShortLink(data.link.short);
        setLongUrl(""); setCustomSlug(""); setLinkTags("");
        setExpiresAt(""); setMaxClicks(""); setLinkPassword("");
        toast.success("Link created successfully!", { id: toastId });
      } else {
        toast.error(data.message || "Failed to create link", { id: toastId });
      }
    } catch (err) {
      toast.error(err.message || "Error creating link", { id: toastId });
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success("Copied to clipboard!");
  };

  const handleArchiveLink = async (id, idx) => {
    const toastId = toast.loading("Archiving link...");
    try {
      // Inactive corresponds to archived
      const data = await linksAPI.update(id, { status: "inactive" });
      if (data.success) {
        const updated = [...links];
        updated[idx] = data.link;
        setLinks(updated);
        toast.success("Link archived successfully!", { id: toastId });
      } else {
        toast.error(data.message || "Failed to archive", { id: toastId });
      }
    } catch {
      toast.error("Error archiving link", { id: toastId });
    }
  };

  const handleDeleteLink = async (idx) => {
    if (!window.confirm("Are you sure you want to permanently delete this link?")) return;
    const linkToDelete = links[idx];
    const toastId = toast.loading("Deleting...");
    try {
      const data = await linksAPI.delete(linkToDelete._id);
      if (data.success) {
        setLinks(links.filter((_, i) => i !== idx));
        toast.success("Link deleted permanently", { id: toastId });
      } else {
        toast.error(data.message || "Failed to delete", { id: toastId });
      }
    } catch {
      toast.error("Error deleting link", { id: toastId });
    }
  };

  const handleDuplicateLink = (link) => {
    setLongUrl(link.original);
    setExpiresAt(link.expiresAt ? link.expiresAt.substring(0, 16) : "");
    setMaxClicks(link.maxClicks || "");
    setLinkTags(Array.isArray(link.tags) ? link.tags.join(", ") : link.tags || "");
    setShowCreateBox(true);
    toast.success("Link fields duplicated! Custom slug and password can be added.");
  };

  const handleSaveEdit = async (idx) => {
    if (!editUrl.trim()) return toast.error("URL cannot be empty");
    if (!isValidUrl(editUrl)) return toast.error("Please enter a valid URL");

    const toastId = toast.loading("Saving...");
    try {
      const data = await linksAPI.update(links[idx]._id, { originalUrl: editUrl });
      if (data.success) {
        const updated = [...links]; updated[idx] = data.link; setLinks(updated);
        setEditingIdx(null);
        toast.success("Link updated", { id: toastId });
      } else {
        toast.error(data.message || "Failed to update", { id: toastId });
      }
    } catch {
      toast.error("Error updating link", { id: toastId });
    }
  };

  const handleSelectLink = (idx) => {
    const id = links[idx]._id;
    setSelectedLinks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (e) => {
    setSelectedLinks(e.target.checked ? links.map(l => l._id) : []);
  };

  const handleBulkDelete = async () => {
    if (!selectedLinks.length) return toast.error("No links selected");
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedLinks.length} links?`)) return;
    const toastId = toast.loading("Deleting selected...");
    try {
      const data = await linksAPI.bulkDelete(selectedLinks);
      if (data.success) {
        setLinks(links.filter(l => !selectedLinks.includes(l._id)));
        setSelectedLinks([]);
        toast.success(data.message, { id: toastId });
      } else toast.error(data.message, { id: toastId });
    } catch { toast.error("Error deleting", { id: toastId }); }
  };

  const handleBulkActivate = async () => {
    if (!selectedLinks.length) return toast.error("No links selected");
    const toastId = toast.loading("Activating...");
    try {
      const data = await linksAPI.bulkUpdateStatus(selectedLinks, "active");
      if (data.success) { fetchLinks(page); setSelectedLinks([]); toast.success(data.message, { id: toastId }); }
      else toast.error(data.message, { id: toastId });
    } catch { toast.error("Error activating", { id: toastId }); }
  };

  const handleBulkTagUpdate = async () => {
    if (!selectedLinks.length) return toast.error("No links selected");
    const tagsInput = prompt("Enter tags to apply to selected links (comma-separated):");
    if (tagsInput === null) return; // cancelled

    const toastId = toast.loading("Updating tags...");
    try {
      let updatedCount = 0;
      for (const id of selectedLinks) {
        const res = await linksAPI.update(id, { tags: tagsInput });
        if (res.success) updatedCount++;
      }
      toast.success(`Successfully updated tags for ${updatedCount} links.`, { id: toastId });
      setSelectedLinks([]);
      fetchLinks(page);
    } catch {
      toast.error("Error updating tags", { id: toastId });
    }
  };

  const handleExportCSV = async () => {
    const toastId = toast.loading("Exporting CSV...");
    try {
      const data = await linksAPI.export();
      if (data.success) {
        let exportRows = data.data;
        // If specific items are selected, filter the export to only contain those items
        if (selectedLinks.length > 0) {
          const selectedLinkShortCodes = links
            .filter(l => selectedLinks.includes(l._id))
            .map(l => l.short.replace(/^https?:\/\//, ""));
          
          exportRows = exportRows.filter(row => 
            selectedLinkShortCodes.some(sc => row.shortUrl.includes(sc))
          );
        }

        const headers = ["Original URL","Short URL","Clicks","Status","Tags","Expires At","Max Clicks","Password Protected","Created"];
        const csvContent = [
          headers.join(","),
          ...exportRows.map(row =>
            [
              `"${row.originalUrl.replace(/"/g, '""')}"`, 
              row.shortUrl, 
              row.clicks, 
              row.status,
              `"${row.tags}"`, 
              row.expiresAt, 
              row.maxClicks, 
              row.passwordProtected, 
              row.createdAt
            ].join(",")
          )
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = selectedLinks.length > 0 ? "selected_links_export.csv" : "all_links_export.csv"; a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Exported successfully!", { id: toastId });
      }
    } catch { toast.error("Export failed", { id: toastId }); }
  };

  const downloadQRFromModal = () => {
    const svg = document.querySelector("#modal-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    canvas.width = 250;
    canvas.height = 250;

    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 250, 250);
      ctx.drawImage(img, 0, 0, 250, 250);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-code-${previewLink.shortCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const statusBadge = (link) => {
    let status = link.status;
    let label = status;
    let color = "#aaa";

    if (status === "active") {
      color = "#28a745"; // Green
    } else if (status === "inactive") {
      color = "#6c757d"; // Grey
      label = "Archived";
    } else if (status === "expired") {
      color = "#fd7e14"; // Orange
    }

    if (link.maxClicks && link.clicks >= link.maxClicks) {
      color = "#dc3545"; // Red
      label = "Limit Reached";
    }

    return (
      <span className="status-badge-custom" style={{ backgroundColor: color }}>
        {label}
      </span>
    );
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Sidebar />
      <div className="main-content">
        <div className="link-page">
          {/* Header */}
          <header className="link-header">
            <div className="link-header-left">
              <h1>Link Management</h1>
              <p>Create, organize, and track your short links</p>
            </div>
            <div className="link-header-right">
              <button className="btn-create-toggle" onClick={() => setShowCreateBox(!showCreateBox)}>
                {showCreateBox ? "✕ Close" : "+ Create New Link"}
              </button>
            </div>
          </header>

          <div className="link-container">
            {/* Create Link Box */}
            {showCreateBox && (
              <div className="link-creation-box glass-box">
                <div className="creation-header">
                  <h2>Create New Link</h2>
                  <p>Configure your destination and custom options</p>
                </div>
                <div className="create-grid">
                  <div className="input-group">
                    <label>Destination URL *</label>
                    <input type="text" placeholder="https://example.com/very-long-url"
                      value={longUrl} onChange={e => setLongUrl(e.target.value)}
                      onKeyPress={e => e.key === "Enter" && handleCreateLink()} />
                  </div>
                  <div className="input-group">
                    <label>Custom Back-half (optional)</label>
                    <input type="text" placeholder="my-custom-link"
                      value={customSlug} onChange={e => setCustomSlug(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Tags (comma-separated)</label>
                    <input type="text" placeholder="marketing, blog, social"
                      value={linkTags} onChange={e => setLinkTags(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>🔒 Password Protection</label>
                    <input type="password" placeholder="Add a password"
                      value={linkPassword} onChange={e => setLinkPassword(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>⏰ Expiration Date</label>
                    <input type="datetime-local"
                      value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>📊 Click Limit</label>
                    <input type="number" placeholder="Total redirects allowed" min="1"
                      value={maxClicks} onChange={e => setMaxClicks(e.target.value)} />
                  </div>
                </div>
                <div className="creation-footer">
                  <button className="btn-save-link" onClick={handleCreateLink}>
                    {loading ? "Creating..." : "Generate Short Link"}
                  </button>
                </div>
                {shortLink && (
                  <div className="link-success-banner">
                    <div className="success-icon">✅</div>
                    <div className="success-content">
                      <p>Your link is ready!</p>
                      <strong>{shortLink}</strong>
                    </div>
                    <div className="success-actions">
                      <button className="btn-copy-small" onClick={() => handleCopyLink(shortLink)}>Copy</button>
                      <button className="btn-qr-small" onClick={() => navigate(`/qrcode?url=${encodeURIComponent(shortLink)}`)}>QR Code</button>
                    </div>
                  </div>
                )}
              </div>
            )}


          {/* Filters */}
          <div className="filters-search glass-box">
            <div className="search-bar">
              <input type="text" placeholder="Search by URL or tag..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={e => e.key === "Enter" && handleSearch()} />
              <button className="btn-secondary" onClick={handleSearch}>Search</button>
            </div>
            <div className="filters">
              <div className="filter-item-wrap">
                <label>Date Range:</label>
                <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} title="Start Date" />
                <span className="date-sep">to</span>
                <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} title="End Date" />
              </div>
              <div className="filter-item-wrap">
                <label>Clicks:</label>
                <select value={filterClicks} onChange={e => setFilterClicks(e.target.value)}>
                  <option value="">All Clicks</option>
                  <option value="0-10">0-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-100">51-100</option>
                  <option value="100-">100+</option>
                </select>
              </div>
              <div className="filter-item-wrap">
                <label>Status:</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Archived</option>
                  <option value="expired">Expired</option>
                  <option value="password_protected">Password Protected</option>
                  <option value="limit_reached">Click Limit Reached</option>
                </select>
              </div>
              <div className="filter-item-wrap">
                <label>Sort:</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="clicks">Most Clicks</option>
                </select>
              </div>
              <div className="filter-item-wrap">
                <label>Tag:</label>
                <input type="text" placeholder="Filter tag" value={filterTag}
                  onChange={e => setFilterTag(e.target.value)} style={{ width: "110px" }} />
              </div>
              <button className="btn-secondary apply-btn" onClick={() => fetchLinks(1)}>Apply Filters</button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat glass-box"><h3>{pagination?.total ?? links.length}</h3><p>Total Links</p></div>
            <div className="stat glass-box"><h3>{links.filter(l => l.status === "active" && (!l.maxClicks || l.clicks < l.maxClicks)).length}</h3><p>Active</p></div>
            <div className="stat glass-box"><h3>{links.filter(l => l.status === "inactive").length}</h3><p>Archived</p></div>
            <div className="stat glass-box"><h3>{links.filter(l => l.status === "expired").length}</h3><p>Expired</p></div>
            <div className="stat glass-box"><h3>{links.reduce((s, l) => s + l.clicks, 0)}</h3><p>Clicks (Page)</p></div>
          </div>

          {/* Column Visibility Control */}
          <div className="filters-search glass-box" style={{ padding: "1.25rem 1.75rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", fontSize: "0.85rem" }}>
              <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>Columns View:</span>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "var(--text-primary)" }}>
                <input type="checkbox" checked={visibleCols.original} onChange={e => setVisibleCols(prev => ({...prev, original: e.target.checked}))} /> Destination URL
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "var(--text-primary)" }}>
                <input type="checkbox" checked={visibleCols.short} onChange={e => setVisibleCols(prev => ({...prev, short: e.target.checked}))} /> Short URL
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "var(--text-primary)" }}>
                <input type="checkbox" checked={visibleCols.clicks} onChange={e => setVisibleCols(prev => ({...prev, clicks: e.target.checked}))} /> Clicks
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "var(--text-primary)" }}>
                <input type="checkbox" checked={visibleCols.expires} onChange={e => setVisibleCols(prev => ({...prev, expires: e.target.checked}))} /> Expires
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "var(--text-primary)" }}>
                <input type="checkbox" checked={visibleCols.status} onChange={e => setVisibleCols(prev => ({...prev, status: e.target.checked}))} /> Status
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "var(--text-primary)" }}>
                <input type="checkbox" checked={visibleCols.tags} onChange={e => setVisibleCols(prev => ({...prev, tags: e.target.checked}))} /> Tags
              </label>
            </div>
          </div>

          {/* Links Table or Better Empty State */}
          {links.length === 0 && !loading ? (
            <div className="empty-state-ds card-ds" style={{ marginBottom: "2rem" }}>
              <span className="icon-wrap">🔗</span>
              <h3>No Links Found</h3>
              <p>Create your first branded short link and start tracking clicks, geographic locations, and devices.</p>
              <button className="btn-ds btn-ds-primary" onClick={() => setShowCreateBox(true)}>
                + Create Branded Link
              </button>
            </div>
          ) : (
            <div className="links-table-wrapper glass-box">
              <table className="links-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" onChange={handleSelectAll} checked={selectedLinks.length === links.length && links.length > 0} /></th>
                    {visibleCols.original && <th>Original URL</th>}
                    {visibleCols.short && <th>Short URL</th>}
                    {visibleCols.clicks && <th>Clicks</th>}
                    {visibleCols.expires && <th>Expires</th>}
                    {visibleCols.status && <th>Status</th>}
                    {visibleCols.tags && <th>Tags</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <SkeletonRow key={i} cols={2 + (visibleCols.original ? 1 : 0) + (visibleCols.short ? 1 : 0) + (visibleCols.clicks ? 1 : 0) + (visibleCols.expires ? 1 : 0) + (visibleCols.status ? 1 : 0) + (visibleCols.tags ? 1 : 0)} />
                    ))
                  ) : (
                    links.map((link, idx) => (
                      <tr key={link._id || idx}>
                        <td>
                          <input type="checkbox" checked={selectedLinks.includes(link._id)} onChange={() => handleSelectLink(idx)} />
                        </td>
                        
                        {visibleCols.original && (
                          <td title={link.original}>
                            {editingIdx === idx ? (
                              <input type="text" value={editUrl} onChange={e => setEditUrl(e.target.value)} style={{ width: "100%", background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", borderRadius: "4px" }} />
                            ) : (
                              <span className="long-url-cell">
                                {link.original}
                              </span>
                            )}
                          </td>
                        )}

                        {visibleCols.short && (
                          <td>
                            <div className="short-url-cell-wrap">
                              <a href={link.short} target="_blank" rel="noreferrer" className="short-link-href">
                                {link.short.replace(/^https?:\/\//, "")}
                              </a>
                              {link.isPasswordProtected && <span title="Password protected" className="lock-icon">🔒</span>}
                            </div>
                          </td>
                        )}

                        {visibleCols.clicks && (
                          <td>
                            <strong>{link.clicks}</strong>
                            {link.maxClicks && <span className="max-clicks-label"> /{link.maxClicks}</span>}
                          </td>
                        )}

                        {visibleCols.expires && (
                          <td style={{ fontSize: "12px", color: link.expiresAt && new Date(link.expiresAt) < new Date() ? "#dc3545" : "#8b949e" }}>
                            {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "—"}
                          </td>
                        )}

                        {visibleCols.status && (
                          <td>{statusBadge(link)}</td>
                        )}

                        {visibleCols.tags && (
                          <td style={{ fontSize: "12px" }}>
                            {Array.isArray(link.tags) ? (
                              <div className="tags-badge-wrap">
                                {link.tags.map((tag, tagIdx) => (
                                  <span key={tagIdx} className="tag-badge">{tag}</span>
                                ))}
                              </div>
                            ) : link.tags || "—"}
                          </td>
                        )}

                        <td>
                          <div className="actions-group">
                            <button className="btn-action btn-copy" onClick={() => handleCopyLink(link.short)} title="Copy Shortened URL">📋</button>
                            <button className="btn-action btn-open" onClick={() => window.open(link.original, "_blank")} title="Open Target Link">🌐</button>
                            
                            {editingIdx === idx ? (
                              <>
                                <button className="btn-action btn-edit" onClick={() => handleSaveEdit(idx)} style={{ backgroundColor: "#28a745" }}>Save</button>
                                <button className="btn-action btn-delete" onClick={() => setEditingIdx(null)} style={{ backgroundColor: "#6c757d" }}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button className="btn-action btn-edit" onClick={() => { setEditingIdx(idx); setEditUrl(link.original); }} title="Edit URL">Edit</button>
                                <button className="btn-action btn-duplicate" onClick={() => handleDuplicateLink(link)} title="Duplicate link parameters">Clone</button>
                                {link.status !== "inactive" ? (
                                  <button className="btn-action btn-archive" onClick={() => handleArchiveLink(link._id, idx)} title="Deactivate and archive link">Archive</button>
                                ) : (
                                  <span style={{ fontSize: "12px", color: "#6c757d", padding: "4px 8px" }}>Archived</span>
                                )}
                                <button className="btn-action btn-delete" onClick={() => handleDeleteLink(idx)} title="Delete permanently">Delete</button>
                                <button className="btn-action btn-preview" onClick={() => setPreviewLink(link)} title="Open interactive details modal">Info</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="pagination">
                  <button disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)} className="btn-secondary">
                    ← Prev
                  </button>
                  <span style={{ padding: "0 16px", color: "#8b949e" }}>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} links)
                  </span>
                  <button disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)} className="btn-secondary">
                    Next →
                  </button>
                </div>
              )}

              {/* Bulk Actions */}
              <div className="bulk-actions">
                <button className="btn-secondary bulk-delete-btn"
                  onClick={handleBulkDelete} disabled={selectedLinks.length === 0}>
                  Delete Selected ({selectedLinks.length})
                </button>
                <button className="btn-secondary bulk-activate-btn"
                  onClick={handleBulkActivate} disabled={selectedLinks.length === 0}>
                  Activate Selected
                </button>
                <button className="btn-secondary bulk-tag-btn"
                  onClick={handleBulkTagUpdate} disabled={selectedLinks.length === 0}>
                  Update Tags
                </button>
                <button className="btn-secondary bulk-export-btn" onClick={handleExportCSV}>
                  {selectedLinks.length > 0 ? `Export Selected CSV (${selectedLinks.length})` : "Export All CSV"}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Link Preview Modal */}
      {previewLink && (
        <div className="link-preview-modal-overlay" onClick={() => setPreviewLink(null)}>
          <div className="link-preview-modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Link Spotlight Information</h2>
              <button className="btn-close-modal" onClick={() => setPreviewLink(null)}>✕</button>
            </div>
            <div className="modal-body-layout">
              {/* Left Column Details */}
              <div className="modal-details-col">
                <div className="modal-detail-item">
                  <label>Original Target URL</label>
                  <p className="modal-url-text" onClick={() => window.open(previewLink.original, "_blank")}>
                    {previewLink.original}
                  </p>
                </div>
                <div className="modal-detail-item">
                  <label>Shortened Link</label>
                  <div className="modal-link-copy-row">
                    <p className="modal-short-url">{previewLink.short}</p>
                    <button className="btn-modal-copy" onClick={() => handleCopyLink(previewLink.short)}>Copy</button>
                  </div>
                </div>
                <div className="modal-grid-two">
                  <div className="modal-detail-item">
                    <label>Short Code Slug</label>
                    <p className="modal-badge-p"><code>/{previewLink.shortCode}</code></p>
                  </div>
                  <div className="modal-detail-item">
                    <label>Total Redirect Clicks</label>
                    <p className="modal-clicks-p"><strong>{previewLink.clicks} clicks</strong> {previewLink.maxClicks && `(Limit: ${previewLink.maxClicks})`}</p>
                  </div>
                  <div className="modal-detail-item">
                    <label>Created Date</label>
                    <p>{previewLink.date || "N/A"}</p>
                  </div>
                  <div className="modal-detail-item">
                    <label>Expiry Date</label>
                    <p>{previewLink.expiresAt ? new Date(previewLink.expiresAt).toLocaleString() : "No Expiry Scheduled"}</p>
                  </div>
                  <div className="modal-detail-item">
                    <label>Security Status</label>
                    <p>{previewLink.isPasswordProtected ? "🔒 Password Protected" : "🔓 Open Link (Public)"}</p>
                  </div>
                  <div className="modal-detail-item">
                    <label>Status Badge</label>
                    <div>{statusBadge(previewLink)}</div>
                  </div>
                </div>
                <div className="modal-detail-item">
                  <label>Assigned Tags</label>
                  <div className="tags-badge-wrap">
                    {Array.isArray(previewLink.tags) && previewLink.tags.length > 0 ? (
                      previewLink.tags.map((tag, tagIdx) => (
                        <span key={tagIdx} className="tag-badge modal-tag">{tag}</span>
                      ))
                    ) : "No tags assigned"}
                  </div>
                </div>
              </div>

              {/* Right Column QR */}
              <div className="modal-qr-col">
                <div className="modal-qr-preview-wrapper">
                  <QRCode
                    id="modal-qr-svg"
                    value={previewLink.short}
                    size={180}
                    fgColor="#7c3aed"
                    bgColor="#ffffff"
                    level="H"
                  />
                </div>
                <button className="btn-modal-qr-download" onClick={downloadQRFromModal}>
                  Download PNG QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
