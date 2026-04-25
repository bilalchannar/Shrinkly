import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import "../Css/Link.css";
import { linksAPI } from "../services/api";

// Skeleton row for loading state
const SkeletonRow = () => (
  <tr className="skeleton-row">
    {[...Array(8)].map((_, i) => (
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

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterDate, setFilterDate] = useState("");
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
      if (filterStatus) params.status = filterStatus;
      if (filterTag) params.tag = filterTag;
      if (filterDate) params.startDate = filterDate;
      if (sortBy) params.sortBy = sortBy;
      if (filterClicks) {
        const [min, max] = filterClicks.split("-");
        if (min) params.minClicks = min;
        if (max && max !== "+") params.maxClicks = max;
      }
      const data = await linksAPI.getAll(params);
      if (data.success) {
        setLinks(data.links);
        setPagination(data.pagination);
      }
    } catch (err) {
      toast.error("Failed to load links");
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterStatus, filterTag, filterDate, sortBy, filterClicks]);

  // When filters change, reset to page 1 and fetch
  useEffect(() => { setPage(1); fetchLinks(1); }, [filterStatus, filterTag, filterDate, sortBy, filterClicks]); // eslint-disable-line
  // When page changes (pagination nav), fetch that page
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

  const handleDeleteLink = async (idx) => {
    const linkToDelete = links[idx];
    const toastId = toast.loading("Deleting...");
    try {
      const data = await linksAPI.delete(linkToDelete._id);
      if (data.success) {
        setLinks(links.filter((_, i) => i !== idx));
        toast.success("Link deleted", { id: toastId });
      } else {
        toast.error(data.message || "Failed to delete", { id: toastId });
      }
    } catch {
      toast.error("Error deleting link", { id: toastId });
    }
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
      if (data.success) { fetchLinks(); setSelectedLinks([]); toast.success(data.message, { id: toastId }); }
      else toast.error(data.message, { id: toastId });
    } catch { toast.error("Error activating", { id: toastId }); }
  };

  const handleExportCSV = async () => {
    const toastId = toast.loading("Exporting...");
    try {
      const data = await linksAPI.export();
      if (data.success) {
        const headers = ["Original URL","Short URL","Clicks","Status","Tags","Expires At","Max Clicks","Password Protected","Created"];
        const csvContent = [
          headers.join(","),
          ...data.data.map(row =>
            [row.originalUrl, row.shortUrl, row.clicks, row.status,
             `"${row.tags}"`, row.expiresAt, row.maxClicks, row.passwordProtected, row.createdAt].join(",")
          )
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "links_export.csv"; a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Exported successfully!", { id: toastId });
      }
    } catch { toast.error("Export failed", { id: toastId }); }
  };

  const statusBadge = (status) => {
    const colors = { active: "#28a745", inactive: "#6c757d", expired: "#fd7e14" };
    return (
      <span style={{
        background: colors[status] || "#aaa", color: "#fff",
        padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600
      }}>
        {status}
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
              <div className="link-creation-box">
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
          <div className="filters-search">
            <div className="search-bar">
              <input type="text" placeholder="Search by URL or tag..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={e => e.key === "Enter" && handleSearch()} />
              <button className="btn-secondary" onClick={handleSearch}>Search</button>
            </div>
            <div className="filters">
              <label>Date:</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              <label>Clicks:</label>
              <select value={filterClicks} onChange={e => setFilterClicks(e.target.value)}>
                <option value="">All</option>
                <option value="0-10">0-10</option>
                <option value="11-50">11-50</option>
                <option value="51-100">51-100</option>
                <option value="100-">100+</option>
              </select>
              <label>Status:</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
              <label>Sort:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="clicks">Most Clicks</option>
              </select>
              <label>Tag:</label>
              <input type="text" placeholder="Filter by tag" value={filterTag}
                onChange={e => setFilterTag(e.target.value)} />
              <button className="btn-secondary" onClick={() => fetchLinks(1)}>Apply</button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat"><h3>{pagination?.total ?? links.length}</h3><p>Total Links</p></div>
            <div className="stat"><h3>{links.filter(l => l.status === "active").length}</h3><p>Active</p></div>
            <div className="stat"><h3>{links.filter(l => l.status === "inactive").length}</h3><p>Inactive</p></div>
            <div className="stat"><h3>{links.filter(l => l.status === "expired").length}</h3><p>Expired</p></div>
            <div className="stat"><h3>{links.reduce((s, l) => s + l.clicks, 0)}</h3><p>Clicks (Page)</p></div>
          </div>

          {/* Links Table */}
          <div className="links-table-wrapper">
            <table className="links-table">
              <thead>
                <tr>
                  <th><input type="checkbox" onChange={handleSelectAll} checked={selectedLinks.length === links.length && links.length > 0} /></th>
                  <th>Original URL</th>
                  <th>Short URL</th>
                  <th>Clicks</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : links.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                    No links found. Create your first link!
                  </td></tr>
                ) : links.map((link, idx) => (
                  <tr key={link._id || idx}>
                    <td>
                      <input type="checkbox" checked={selectedLinks.includes(link._id)} onChange={() => handleSelectLink(idx)} />
                    </td>
                    <td title={link.original}>
                      {editingIdx === idx ? (
                        <input type="text" value={editUrl} onChange={e => setEditUrl(e.target.value)} style={{ width: "100%" }} />
                      ) : (
                        <span style={{ display: "block", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {link.original}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <a href={link.short} target="_blank" rel="noreferrer" style={{ color: "#512da8", fontSize: "13px" }}>
                          {link.short.replace(/^https?:\/\//, "")}
                        </a>
                        {link.isPasswordProtected && <span title="Password protected">🔒</span>}
                      </div>
                    </td>
                    <td>
                      {link.clicks}
                      {link.maxClicks && <span style={{ color: "#999", fontSize: "11px" }}> /{link.maxClicks}</span>}
                    </td>
                    <td style={{ fontSize: "12px", color: link.expiresAt && new Date(link.expiresAt) < new Date() ? "#dc3545" : "#666" }}>
                      {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td>{statusBadge(link.status)}</td>
                    <td style={{ fontSize: "12px" }}>
                      {Array.isArray(link.tags) ? link.tags.join(", ") : link.tags || "—"}
                    </td>
                    <td>
                      <div className="actions-group">
                        <button className="btn-action btn-copy" onClick={() => handleCopyLink(link.short)} title="Copy">Copy</button>
                        {editingIdx === idx ? (
                          <>
                            <button className="btn-action btn-edit" onClick={() => handleSaveEdit(idx)} style={{ backgroundColor: "#28a745" }}>Save</button>
                            <button className="btn-action btn-delete" onClick={() => setEditingIdx(null)} style={{ backgroundColor: "#6c757d" }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="btn-action btn-edit" onClick={() => { setEditingIdx(idx); setEditUrl(link.original); }}>Edit</button>
                            <button className="btn-action btn-delete" onClick={() => handleDeleteLink(idx)}>Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)} className="btn-secondary">
                  ← Prev
                </button>
                <span style={{ padding: "0 16px", color: "#555" }}>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} links)
                </span>
                <button disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)} className="btn-secondary">
                  Next →
                </button>
              </div>
            )}

            {/* Bulk Actions */}
            <div className="bulk-actions">
              <button className="btn-secondary" style={{ backgroundColor: "#dc3545", color: "#fff" }}
                onClick={handleBulkDelete} disabled={selectedLinks.length === 0}>
                Delete Selected ({selectedLinks.length})
              </button>
              <button className="btn-secondary" style={{ backgroundColor: "#28a745" }}
                onClick={handleBulkActivate} disabled={selectedLinks.length === 0}>
                Activate Selected
              </button>
              <button className="btn-secondary" onClick={handleExportCSV}>Export CSV</button>
            </div>
          </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
