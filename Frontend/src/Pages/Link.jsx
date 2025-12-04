import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";        
import Footer from "../Components/Footer";
import "../Css/Link.css";

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

  const toggleCreateBox = () => {
    setShowCreateBox(!showCreateBox);
    setLongUrl("");
    setCustomSlug("");
    setShortLink("");
    setMessage("");
  };

  const toggleLinkInfo = () => setShowLinkInfo(!showLinkInfo);

  // Example data for quick stats and links table
  const [links, setLinks] = useState([
    {
      original: "https://example.com/long-url",
      short: "shrinkly.link/abc123",
      clicks: 42,
      date: "2025-11-23",
      status: "active",
      tags: "marketing",
    },
  ]);

  // Function to validate URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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
      const response = await fetch("http://localhost:5000/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original: longUrl,
          customSlug: customSlug || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newLink = {
          original: longUrl,
          short: `${domain}/${data.short}`,
          clicks: 0,
          date: new Date().toISOString().split("T")[0],
          status: "active",
          tags: "",
        };

        setLinks([...links, newLink]);
        setShortLink(`${domain}/${data.short}`);
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
      setMessage("Error creating link. Make sure backend is running.");
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
  const handleDeleteLink = (idx) => {
    const deletedLink = links[idx];
    setLinks(links.filter((_, i) => i !== idx));
    setMessage(`✓ Link deleted. Total links: ${links.length - 1}`);
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
  };

  // Edit Link Handler
  const handleEditLink = (idx) => {
    setEditingIdx(idx);
    setEditUrl(links[idx].original);
  };

  // Save Edit Handler
  const handleSaveEdit = (idx) => {
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

    const updatedLinks = [...links];
    updatedLinks[idx].original = editUrl;
    setLinks(updatedLinks);
    setEditingIdx(null);
    setMessage("✓ Link updated successfully");
    setMessageType("success");
    setTimeout(() => setMessage(""), 3000);
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
              <input type="text" placeholder="Search by short link, long link, or tag" />
              <button className="btn-secondary">Search</button>
            </div>
            <div className="filters">
              <label>Date:</label>
              <input type="date" />
              <label>Clicks:</label>
              <select>
                <option value="">All</option>
                <option value="0-10">0-10</option>
                <option value="11-50">11-50</option>
                <option value="51-100">51-100</option>
                <option value="100+">100+</option>
              </select>
              <label>Status:</label>
              <select>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <label>Sort:</label>
              <select>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
              <label>Tag:</label>
              <input type="text" placeholder="Filter by tag" />
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
            <table className="links-table">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
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
                {links.map((link, idx) => (
                  <tr key={idx}>
                    <td><input type="checkbox" /></td>
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
                ))}
              </tbody>
            </table>
            <div className="bulk-actions">
              <button className="btn-secondary" style={{ backgroundColor: "#dc3545", color: "#fff" }}>Delete Selected</button>
              <button className="btn-secondary" style={{ backgroundColor: "#28a745" }}>Activate Selected</button>
              <button className="btn-secondary">Export CSV</button>
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
