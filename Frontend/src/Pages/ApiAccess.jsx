import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import "../Css/ApiAccess.css";

export default function ApiAccess() {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKeyData, setNewKeyData] = useState(null); // { name, rawKey, keyPreview }
  const [docTab, setDocTab] = useState("curl"); // curl, node, python
  const [activeEndpoint, setActiveEndpoint] = useState("create"); // create, list, get, delete, analytics

  // Enforce check for Pro or Enterprise plans
  const hasApiAccess = 
    user?.billingPlan === "pro" || 
    user?.billingPlan === "enterprise" || 
    user?.plan === "pro" || 
    user?.plan === "enterprise";

  const fetchKeys = async () => {
    if (!hasApiAccess) return;
    try {
      setLoading(true);
      const data = await api.apiKeys.getAll();
      if (data.success) {
        setKeys(data.apiKeys);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [user]);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    try {
      setCreateLoading(true);
      const data = await api.apiKeys.create(keyName.trim());
      if (data.success) {
        toast.success("API Key generated successfully!");
        setNewKeyData({
          name: data.apiKey.name,
          rawKey: data.rawKey,
          keyPreview: data.apiKey.keyPreview
        });
        setKeyName("");
        fetchKeys();
      }
    } catch (error) {
      toast.error(error.message || "Failed to create API key");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRevokeKey = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this API Key? Programs using this key will immediately lose access.")) {
      return;
    }

    try {
      const data = await api.apiKeys.revoke(id);
      if (data.success) {
        toast.success("API Key revoked");
        fetchKeys();
      }
    } catch (error) {
      toast.error(error.message || "Failed to revoke API key");
    }
  };

  const handleDeleteKey = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this API Key? This action is irreversible.")) {
      return;
    }

    try {
      const data = await api.apiKeys.delete(id);
      if (data.success) {
        toast.success("API Key deleted");
        fetchKeys();
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete API key");
    }
  };

  const handleCopyText = (text, message = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  // Documentation Snippets Generator
  const apiBaseUrl = window.location.origin.replace("3000", "5000") + "/api/v1";

  const getCodeSnippet = () => {
    const endpoints = {
      create: {
        curl: `curl -X POST "${apiBaseUrl}/links" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "originalUrl": "https://example.com/very-long-destination",\n    "customSlug": "promo-2026"\n  }'`,
        node: `const fetch = require('node-fetch');\n\nfetch('${apiBaseUrl}/links', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer YOUR_API_KEY',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    originalUrl: 'https://example.com/very-long-destination',\n    customSlug: 'promo-2026'\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
        python: `import requests\n\nurl = "${apiBaseUrl}/links"\nheaders = {\n    "Authorization": "Bearer YOUR_API_KEY",\n    "Content-Type": "application/json"\n}\ndata = {\n    "originalUrl": "https://example.com/very-long-destination",\n    "customSlug": "promo-2026"\n}\n\nresponse = requests.post(url, headers=headers, json=data)\nprint(response.json())`
      },
      list: {
        curl: `curl -X GET "${apiBaseUrl}/links?page=1&limit=20" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`,
        node: `const fetch = require('node-fetch');\n\nfetch('${apiBaseUrl}/links?page=1&limit=20', {\n  headers: {\n    'Authorization': 'Bearer YOUR_API_KEY'\n  }\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
        python: `import requests\n\nurl = "${apiBaseUrl}/links"\nheaders = {\n    "Authorization": "Bearer YOUR_API_KEY"\n}\nparams = {\n    "page": 1,\n    "limit": 20\n}\n\nresponse = requests.get(url, headers=headers, params=params)\nprint(response.json())`
      },
      get: {
        curl: `curl -X GET "${apiBaseUrl}/links/LINK_ID" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`,
        node: `const fetch = require('node-fetch');\n\nfetch('${apiBaseUrl}/links/LINK_ID', {\n  headers: {\n    'Authorization': 'Bearer YOUR_API_KEY'\n  }\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
        python: `import requests\n\nurl = "${apiBaseUrl}/links/LINK_ID"\nheaders = {\n    "Authorization": "Bearer YOUR_API_KEY"\n}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json())`
      },
      delete: {
        curl: `curl -X DELETE "${apiBaseUrl}/links/LINK_ID" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`,
        node: `const fetch = require('node-fetch');\n\nfetch('${apiBaseUrl}/links/LINK_ID', {\n  method: 'DELETE',\n  headers: {\n    'Authorization': 'Bearer YOUR_API_KEY'\n  }\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
        python: `import requests\n\nurl = "${apiBaseUrl}/links/LINK_ID"\nheaders = {\n    "Authorization": "Bearer YOUR_API_KEY"\n}\n\nresponse = requests.delete(url, headers=headers)\nprint(response.json())`
      },
      analytics: {
        curl: `curl -X GET "${apiBaseUrl}/analytics/LINK_ID" \\\n  -H "Authorization: Bearer YOUR_API_KEY"`,
        node: `const fetch = require('node-fetch');\n\nfetch('${apiBaseUrl}/analytics/LINK_ID', {\n  headers: {\n    'Authorization': 'Bearer YOUR_API_KEY'\n  }\n})\n.then(res => res.json())\n.then(data => console.log(data));`,
        python: `import requests\n\nurl = "${apiBaseUrl}/analytics/LINK_ID"\nheaders = {\n    "Authorization": "Bearer YOUR_API_KEY"\n}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json())`
      }
    };

    return endpoints[activeEndpoint][docTab];
  };

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="api-page">
          <header className="api-header">
            <span className="api-plan-badge">
              PLAN: {user?.billingPlan ? user.billingPlan.toUpperCase() : "FREE"}
            </span>
            <h1>Developer API Access</h1>
            <p>Integrate short link generation directly into your workflows, CMS, and proprietary pipelines.</p>
          </header>

          {!hasApiAccess ? (
            /* Premium upgrade banner */
            <div className="card-ds upgrade-card-api text-center animate-fade">
              <span className="icon-badge">🔒</span>
              <h2>Premium Developer Feature</h2>
              <p>
                API access and programmatic short link generation are exclusive to **Pro** and **Enterprise** accounts. 
                Upgrade your subscription context to instantly create API keys, access developer documentation, and lift click rate limits.
              </p>
              <button 
                onClick={() => window.location.href = "/profile"} 
                className="btn-ds btn-ds-primary btn-upgrade-redirect"
              >
                💎 Upgrade to Pro / Enterprise
              </button>
            </div>
          ) : (
            /* API Keys Management Area */
            <div className="api-layout-grid animate-fade">
              {/* Left Column: key create & key list */}
              <div className="api-main-panel">
                {/* Create key */}
                <div className="card-ds create-key-card">
                  <h3>Generate API Key</h3>
                  <form onSubmit={handleCreateKey} className="create-key-form">
                    <div className="form-group-api">
                      <label className="label-ds" htmlFor="keyNameInput">Key Name / Description</label>
                      <div className="input-group-api">
                        <input
                          id="keyNameInput"
                          type="text"
                          placeholder="e.g. Production Server Key"
                          value={keyName}
                          onChange={(e) => setKeyName(e.target.value)}
                          className="input-ds"
                          maxLength={50}
                          disabled={createLoading}
                          required
                        />
                        <button 
                          type="submit" 
                          className="btn-ds btn-ds-primary"
                          disabled={createLoading}
                        >
                          {createLoading ? "Generating..." : "Generate Key"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Keys list */}
                <div className="card-ds keys-list-card">
                  <h3>Active API Keys</h3>
                  {loading ? (
                    <div className="skeleton-pulse api-keys-skeleton"></div>
                  ) : keys.length === 0 ? (
                    <div className="empty-state-ds">
                      <span className="icon-wrap">🔑</span>
                      <h3>No API keys generated</h3>
                      <p>
                        Generate an API Key above to begin authenticating programmatically. Store generated keys securely as they are secret values.
                      </p>
                    </div>
                  ) : (
                    <div className="table-wrapper-ds">
                      <table className="table-ds">
                        <thead>
                          <tr>
                            <th>Key Description</th>
                            <th>Preview</th>
                            <th>Status</th>
                            <th>Usage Count</th>
                            <th>Last Used</th>
                            <th>Created</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keys.map((k) => (
                            <tr key={k._id}>
                              <td>
                                <strong>{k.name}</strong>
                              </td>
                              <td className="key-preview-font">{k.keyPreview}</td>
                              <td>
                                <span className={`badge-ds badge-ds-${k.status === "active" ? "success" : "error"}`}>
                                  {k.status}
                                </span>
                              </td>
                              <td>
                                <strong>{k.usageCount}</strong>
                              </td>
                              <td>
                                {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                              </td>
                              <td>{new Date(k.createdAt).toLocaleDateString()}</td>
                              <td style={{ textAlign: "right" }}>
                                <div className="action-buttons-group">
                                  {k.status === "active" ? (
                                    <button
                                      onClick={() => handleRevokeKey(k._id)}
                                      className="btn-revoke-api"
                                      title="Revoke Key"
                                    >
                                      Revoke
                                    </button>
                                  ) : (
                                    <span className="revoked-lbl">Revoked</span>
                                  )}
                                  <button
                                    onClick={() => handleDeleteKey(k._id)}
                                    className="btn-delete-api"
                                    title="Delete Key Record"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: API Documentation Quick Start */}
              <div className="api-sidebar-panel">
                <div className="card-ds doc-card">
                  <h3>Developer Documentation</h3>
                  <p className="doc-desc">
                    All requests must include one of the following authentication headers:
                  </p>
                  <div className="auth-header-card">
                    <code>Authorization: Bearer YOUR_API_KEY</code>
                    <div className="auth-or-divider">or</div>
                    <code>x-api-key: YOUR_API_KEY</code>
                  </div>

                  <div className="endpoint-selector-tabs">
                    <button
                      className={`tab-btn ${activeEndpoint === "create" ? "active" : ""}`}
                      onClick={() => setActiveEndpoint("create")}
                    >
                      POST Create Link
                    </button>
                    <button
                      className={`tab-btn ${activeEndpoint === "list" ? "active" : ""}`}
                      onClick={() => setActiveEndpoint("list")}
                    >
                      GET List Links
                    </button>
                    <button
                      className={`tab-btn ${activeEndpoint === "get" ? "active" : ""}`}
                      onClick={() => setActiveEndpoint("get")}
                    >
                      GET Link Details
                    </button>
                    <button
                      className={`tab-btn ${activeEndpoint === "delete" ? "active" : ""}`}
                      onClick={() => setActiveEndpoint("delete")}
                    >
                      DELETE Link
                    </button>
                    <button
                      className={`tab-btn ${activeEndpoint === "analytics" ? "active" : ""}`}
                      onClick={() => setActiveEndpoint("analytics")}
                    >
                      GET Analytics
                    </button>
                  </div>

                  {/* Language Tab Selectors */}
                  <div className="doc-language-tabs">
                    <button
                      className={`lang-btn ${docTab === "curl" ? "active" : ""}`}
                      onClick={() => setDocTab("curl")}
                    >
                      cURL
                    </button>
                    <button
                      className={`lang-btn ${docTab === "node" ? "active" : ""}`}
                      onClick={() => setDocTab("node")}
                    >
                      Node.js
                    </button>
                    <button
                      className={`lang-btn ${docTab === "python" ? "active" : ""}`}
                      onClick={() => setDocTab("python")}
                    >
                      Python
                    </button>
                  </div>

                  {/* Code Block Container */}
                  <div className="code-block-container">
                    <pre className="code-display">
                      <code>{getCodeSnippet()}</code>
                    </pre>
                    <button
                      onClick={() => handleCopyText(getCodeSnippet(), "Code example copied!")}
                      className="btn-copy-code"
                      title="Copy code snippet"
                    >
                      📋 Copy Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* One-time Disclosure Modal */}
          {newKeyData && (
            <div className="modal-overlay-ds">
              <div className="modal-content-ds key-disclosure-modal animate-scale-up">
                <span className="warning-icon">⚠️</span>
                <h2>New API Key Generated</h2>
                <p>
                  Copy this key and save it in a secure password manager. **For security reasons, this key will not be shown again.**
                </p>

                <div className="disclosure-box">
                  <span className="lbl">Key Preview: {newKeyData.keyPreview}</span>
                  <div className="raw-key-row">
                    <code className="raw-key-value">{newKeyData.rawKey}</code>
                    <button
                      onClick={() => handleCopyText(newKeyData.rawKey, "API Key copied to clipboard!")}
                      className="btn-ds btn-ds-success"
                    >
                      📋 Copy Key
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setNewKeyData(null)}
                  className="btn-ds btn-ds-secondary btn-close-disclosure"
                >
                  I have saved this key safely
                </button>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
