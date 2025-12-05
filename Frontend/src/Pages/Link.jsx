import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";        
import Footer from "../Components/Footer";
import "../Css/Link.css";
import { linksAPI } from "../services/api";

export default function Link() {
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [showLinkInfo, setShowLinkInfo] = useState(false);
  const [shortLink, setShortLink] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [domain, setDomain] = useState("shrinkly.link");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [editingIdx, setEditingIdx] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState([]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterClicks, setFilterClicks] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const toggleCreateBox = () => {
    setShowCreateBox(!showCreateBox);
    setLongUrl("");
    setCustomSlug("");
    setShortLink("");
    setMessage("");
  };

  const toggleLinkInfo = () => setShowLinkInfo(!showLinkInfo);

  const [links, setLinks] = useState([]);

  // Function to validate URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Fetch all links on component mount
  useEffect(() => {
    fetchLinks();
  }, []);

  // Fetch links with filters
  const fetchLinks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (filterStatus) params.status = filterStatus;
      if (filterTag) params.tag = filterTag;
      if (filterDate) params.startDate = filterDate;
      if (sortBy) params.sortBy = sortBy;
      
      // Handle clicks filter
      if (filterClicks) {
        const [min, max] = filterClicks.split("-");
        if (min) params.minClicks = min;
        if (max && max !== "+") params.maxClicks = max;
      }

      const data = await linksAPI.getAll(params);

      if (data.success) {
        setLinks(data.links);
      }
    } catch (error) {
      console.error("Error fetching links:", error);
      setMessage("Error loading links");
      setMessageType("error");
    }
    setLoading(false);
  };

  // Handle search
  const handleSearch = () => {
    fetchLinks();
  };

  // Create Link Handler
  const handleCreateLink = async () => {
    if (!longUrl.trim()) {
      setMessage("Please enter a long URL");
      setMessageType("error");
      return;
    }

    if (!isValidUrl(longUrl)) {
      setMessage("Please enter a valid URL (e.g., https://example.com)");
      setMessageType("error");
      return;
    }

    try {
      const data = await linksAPI.create({
        originalUrl: longUrl,
        customSlug: customSlug || undefined,
        domain: domain
      });

      if (data.success) {
        setLinks([data.link, ...links]);
        setShortLink(data.link.short);
        setMessage(`✓ Link created! Total links created: ${links.length + 1}`);
        setMessageType("success");
        setLongUrl("");
        setCustomSlug("");

        // Auto-dismiss message after 5 seconds
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(data.message || "Failed to create link");
        setMessageType("error");
      }
    } catch (error) {
      setMessage(error.message || "Error creating link. Make sure backend is running.");
      setMessageType("error");
    }
  };

  // Copy to Clipboard Handler
  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setMessage("✓ Link copied to clipboard!");
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
  };

  // Delete Link Handler
  const handleDeleteLink = async (idx) => {
    const linkToDelete = links[idx];
    try {
      const data = await linksAPI.delete(linkToDelete._id);

      if (data.success) {
        setLinks(links.filter((_, i) => i !== idx));
        setMessage(`✓ Link deleted. Total links: ${links.length - 1}`);
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Failed to delete link");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error deleting link");
      setMessageType("error");
    }
  };

  // Edit Link Handler
  const handleEditLink = (idx) => {
    setEditingIdx(idx);
    setEditUrl(links[idx].original);
  };

  // Save Edit Handler
  const handleSaveEdit = async (idx) => {
    if (!editUrl.trim()) {
      setMessage("URL cannot be empty");
      setMessageType("error");
      return;
    }

    if (!isValidUrl(editUrl)) {
      setMessage("Please enter a valid URL");
      setMessageType("error");
      return;
    }

    const linkToUpdate = links[idx];
    try {
      const data = await linksAPI.update(linkToUpdate._id, { originalUrl: editUrl });

      if (data.success) {
        const updatedLinks = [...links];
        updatedLinks[idx] = data.link;
        setLinks(updatedLinks);
        setEditingIdx(null);
        setMessage("✓ Link updated successfully");
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Failed to update link");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error updating link");
      setMessageType("error");
    }
  };

  // Handle checkbox selection
  const handleSelectLink = (idx) => {
    const linkId = links[idx]._id;
    if (selectedLinks.includes(linkId)) {
      setSelectedLinks(selectedLinks.filter(id => id !== linkId));
    } else {
      setSelectedLinks([...selectedLinks, linkId]);
    }
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLinks(links.map(link => link._id));
    } else {
      setSelectedLinks([]);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedLinks.length === 0) {
      setMessage("Please select links to delete");
      setMessageType("error");
      return;
    }

    try {
      const data = await linksAPI.bulkDelete(selectedLinks);

      if (data.success) {
        setLinks(links.filter(link => !selectedLinks.includes(link._id)));
        setSelectedLinks([]);
        setMessage(data.message);
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Failed to delete links");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error deleting links");
      setMessageType("error");
    }
  };

  // Bulk activate handler
  const handleBulkActivate = async () => {
    if (selectedLinks.length === 0) {
      setMessage("Please select links to activate");
      setMessageType("error");
      return;
    }

    try {
      const data = await linksAPI.bulkUpdateStatus(selectedLinks, "active");

      if (data.success) {
        fetchLinks(); // Refresh links
        setSelectedLinks([]);
        setMessage(data.message);
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Failed to activate links");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error activating links");
      setMessageType("error");
    }
  };

  // Export CSV handler
  const handleExportCSV = async () => {
    try {
      const data = await linksAPI.export();

      if (data.success) {
        // Convert to CSV
        const headers = ["Original URL", "Short URL", "Clicks", "Status", "Tags", "Created"];
        const csvContent = [
          headers.join(","),
          ...data.data.map(row => 
            [row.originalUrl, row.shortUrl, row.clicks, row.status, row.tags, row.createdAt].join(",")
          )
        ].join("\n");

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "links_export.csv";
        a.click();
        window.URL.revokeObjectURL(url);

        setMessage("✓ Links exported successfully");
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Error exporting links");
      setMessageType("error");
    }
  };

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="container">
          {/* Page Header */}
          <div className="page-header">
            <div className="ph-left">
              <h1>Link Management</h1>
              <p className="ph-sub">You create, edit, and organize your short links here.</p>
            </div>
            <div className="ph-right">
              <button className="btn-primary ph-create-btn" style={{ backgroundColor: "#28a745" }} onClick={toggleCreateBox}>
                Create New Link
              </button>
            </div>
          </div>

          {/* Link Creation Box */}
          {showCreateBox && (
            <div className="link-creation-box">
              <h2>Create New Link</h2>
              {message && (
                <div className={`alert alert-${messageType}`}>
                  {message}
                </div>
              )}
              <div className="input-group">
                <label htmlFor="longUrl">Long URL</label>
                <input 
                  type="text" 
                  id="longUrl" 
                  placeholder="Enter your long URL here"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateLink()}
                />
              </div>
              <div className="input-group">
                <label htmlFor="customSlug">Custom Slug (optional)</label>
                <input 
                  type="text" 
                  id="customSlug" 
                  placeholder="Enter a custom slug"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="domainSelect">Domain</label>
                <select 
                  id="domainSelect"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  <option value="shrinkly.link">shrinkly.link</option>
                  <option value="shrink.ly">shrink.ly</option>
                </select>
              </div>
              <button 
                className="btn-primary" 
                style={{ backgroundColor: "#28a745" }}
                onClick={handleCreateLink}
              >
                Create Link
              </button>

              {shortLink && (
                <div className="link-success-msg" style={{ display: "flex" }}>
                  Link created: <span>{shortLink}</span>
                  <button 
                    className="btn-copy"
                    onClick={() => handleCopyLink(shortLink)}
                  >
                    Copy
                  </button>
                  <button className="btn-secondary">QR</button>
                </div>
              )}
            </div>
          )}

          {/* Filters & Search */}
          <div className="filters-search">
            <div className="search-bar">
              <input 
                type="text" 
                placeholder="Search by short link, long link, or tag"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button className="btn-secondary" onClick={handleSearch}>Search</button>
            </div>
            <div className="filters">
              <label>Date:</label>
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              <label>Clicks:</label>
              <select
                value={filterClicks}
                onChange={(e) => setFilterClicks(e.target.value)}
              >
                <option value="">All</option>
                <option value="0-10">0-10</option>
                <option value="11-50">11-50</option>
                <option value="51-100">51-100</option>
                <option value="100-">100+</option>
              </select>
              <label>Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <label>Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="clicks">Most Clicks</option>
              </select>
              <label>Tag:</label>
              <input 
                type="text" 
                placeholder="Filter by tag"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
              />
              <button className="btn-secondary" onClick={fetchLinks}>Apply Filters</button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat"><h3>{links.length}</h3><p>Total Links</p></div>
            <div className="stat"><h3>{links.filter(l => l.status === "active").length}</h3><p>Active Links</p></div>
            <div className="stat"><h3>{links.filter(l => l.status === "inactive").length}</h3><p>Inactive Links</p></div>
            <div className="stat"><h3>{links.reduce((sum, l) => sum + l.clicks, 0)}</h3><p>Total Clicks</p></div>
          </div>

          {/* Links Table */}
          <div className="links-table-wrapper">
            {loading ? (
              <p style={{ textAlign: "center", padding: "20px" }}>Loading links...</p>
            ) : (
            <table className="links-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedLinks.length === links.length && links.length > 0}
                    />
                  </th>
                  <th>Original URL</th>
                  <th>Short URL</th>
                  <th>Clicks</th>
                  <th>Creation Date</th>
                  <th>Status</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                      No links found. Create your first link!
                    </td>
                  </tr>
                ) : (
                links.map((link, idx) => (
                  <tr key={link._id || idx}>
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedLinks.includes(link._id)}
                        onChange={() => handleSelectLink(idx)}
                      />
                    </td>
                    <td>
                      {editingIdx === idx ? (
                        <input 
                          type="text" 
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        link.original
                      )}
                    </td>
                    <td>{link.short}</td>
                    <td>{link.clicks}</td>
                    <td>{link.date}</td>
                    <td><span className={`status ${link.status}`}>{link.status}</span></td>
                    <td>{link.tags}</td>
                    <td>
                      <div className="actions-group">
                        <button 
                          className="btn-action btn-copy"
                          onClick={() => handleCopyLink(link.short)}
                          title="Copy link"
                        >
                          Copy
                        </button>
                        {editingIdx === idx ? (
                          <>
                            <button 
                              className="btn-action btn-edit"
                              onClick={() => handleSaveEdit(idx)}
                              title="Save changes"
                              style={{ backgroundColor: "#28a745" }}
                            >
                              Save
                            </button>
                            <button 
                              className="btn-action btn-delete"
                              onClick={() => setEditingIdx(null)}
                              title="Cancel edit"
                              style={{ backgroundColor: "#6c757d" }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn-action btn-edit"
                              onClick={() => handleEditLink(idx)}
                              title="Edit link"
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-action btn-delete"
                              onClick={() => handleDeleteLink(idx)}
                              title="Delete link"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
            )}
            <div className="bulk-actions">
              <button 
                className="btn-secondary" 
                style={{ backgroundColor: "#dc3545", color: "#fff" }}
                onClick={handleBulkDelete}
                disabled={selectedLinks.length === 0}
              >
                Delete Selected ({selectedLinks.length})
              </button>
              <button 
                className="btn-secondary" 
                style={{ backgroundColor: "#28a745" }}
                onClick={handleBulkActivate}
                disabled={selectedLinks.length === 0}
              >
                Activate Selected
              </button>
              <button className="btn-secondary" onClick={handleExportCSV}>Export CSV</button>
            </div>
          </div>

          {/* Optional Link Info Box */}
          {showLinkInfo && (
            <div className="link-info-box">
              <h2>Link Information</h2>
              <table className="info-table">
                <tbody>
                  <tr><td className="label">Original URL</td><td className="value"></td></tr>
                  <tr><td className="label">New URL</td><td className="value"></td></tr>
                  <tr><td className="label">Tracking Code</td><td className="value"></td></tr>
                  <tr><td className="label">Access Link</td><td className="value"></td></tr>
                  <tr><td className="label">Note</td><td className="value">Please login to add a note.</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
