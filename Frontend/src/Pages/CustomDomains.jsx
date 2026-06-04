import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import "../Css/CustomDomains.css";

export default function CustomDomains() {
  const { activeWorkspace, workspaces } = useAuth();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [selectedDomainForInstructions, setSelectedDomainForInstructions] = useState(null);

  // Load custom domains for current context
  const fetchDomains = async () => {
    try {
      setLoading(true);
      const data = await api.domains.getAll(activeWorkspace);
      if (data.success) {
        setDomains(data.domains);
        // Default to showing instructions for the first pending domain if available
        const pending = data.domains.find(d => d.status === "pending");
        if (pending) {
          setSelectedDomainForInstructions(pending);
        } else if (data.domains.length > 0) {
          setSelectedDomainForInstructions(data.domains[0]);
        } else {
          setSelectedDomainForInstructions(null);
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to load custom domains");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, [activeWorkspace]);

  // Handle create/add domain
  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) {
      toast.error("Please enter a domain name");
      return;
    }

    try {
      setSubmitLoading(true);
      const data = await api.domains.add(newDomain.trim(), activeWorkspace);
      if (data.success) {
        toast.success(data.message || "Domain added successfully!");
        setNewDomain("");
        fetchDomains();
      }
    } catch (error) {
      toast.error(error.message || "Failed to add domain");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Verify Domain
  const handleVerifyDomain = async (id) => {
    try {
      toast.loading("Verifying DNS records...", { id: "verify-dns" });
      const data = await api.domains.verify(id);
      if (data.success) {
        toast.success(data.message || "Domain verified successfully!", { id: "verify-dns" });
        fetchDomains();
      }
    } catch (error) {
      toast.error(error.message || "Verification failed. Check your DNS records and try again.", { id: "verify-dns" });
    }
  };

  // Handle Set Default Domain
  const handleSetDefault = async (id) => {
    try {
      const data = await api.domains.setDefault(id);
      if (data.success) {
        toast.success(data.message || "Default domain updated successfully!");
        fetchDomains();
      }
    } catch (error) {
      toast.error(error.message || "Failed to update default domain");
    }
  };

  // Handle Delete Domain
  const handleDeleteDomain = async (domainObj) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${domainObj.domain}"? Short links created with this domain will revert to using "shrinkly.link".`
      )
    ) {
      return;
    }

    try {
      const data = await api.domains.delete(domainObj._id);
      if (data.success) {
        toast.success(data.message || "Domain deleted successfully");
        fetchDomains();
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete domain");
    }
  };

  // Helper to determine workspace display name
  const getWorkspaceName = () => {
    if (!activeWorkspace || activeWorkspace === "personal") {
      return "Personal Space";
    }
    const ws = workspaces.find(w => w._id === activeWorkspace);
    return ws ? ws.name : "Team Workspace";
  };

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="domains-page">
          <header className="domains-header">
            <span className="domains-context-badge">
              Active Context: {getWorkspaceName()}
            </span>
            <h1>Custom Domains</h1>
            <p>
              Connect your own branded domain to create short links that reflect your brand identity (e.g., <code>links.mybrand.com/slug</code>).
            </p>
          </header>

          <div className="domains-layout-grid">
            {/* Left side: Form & List */}
            <div className="domains-main-panel">
              {/* Add Custom Domain Form */}
              <div className="card-ds add-domain-card">
                <h3>Add a Custom Domain</h3>
                <form onSubmit={handleAddDomain} className="add-domain-form">
                  <div className="form-group-domains">
                    <label className="label-ds" htmlFor="domainInput">Domain / Subdomain</label>
                    <div className="input-group-domains">
                      <input
                        id="domainInput"
                        type="text"
                        placeholder="e.g. links.mybrand.com"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        className="input-ds"
                        required
                        disabled={submitLoading}
                      />
                      <button 
                        type="submit" 
                        className="btn-ds btn-ds-primary" 
                        disabled={submitLoading}
                      >
                        {submitLoading ? "Adding..." : "Add Domain"}
                      </button>
                    </div>
                    <span className="form-help-text">
                      Note: You must own the domain and be able to configure CNAME records.
                    </span>
                  </div>
                </form>
              </div>

              {/* Domains list */}
              <div className="card-ds domains-list-card">
                <h3>Registered Domains</h3>
                {loading ? (
                  <div className="skeleton-pulse domains-skeleton"></div>
                ) : domains.length === 0 ? (
                  <div className="empty-state-ds">
                    <span className="icon-wrap">🌐</span>
                    <h3>No custom domains yet</h3>
                    <p>
                      Branded domains build credibility. Connect your custom domain above to begin shortening links under your own URL namespace.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrapper-ds">
                    <table className="table-ds">
                      <thead>
                        <tr>
                          <th>Domain Name</th>
                          <th>Status</th>
                          <th>Default</th>
                          <th>Created</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {domains.map((d) => (
                          <tr 
                            key={d._id} 
                            className={`domain-row ${selectedDomainForInstructions?._id === d._id ? "selected-row" : ""}`}
                            onClick={() => setSelectedDomainForInstructions(d)}
                          >
                            <td className="domain-cell-name">
                              <strong>{d.domain}</strong>
                            </td>
                            <td>
                              <span className={`badge-ds badge-ds-${d.status === "verified" ? "success" : d.status === "pending" ? "warning" : "error"}`}>
                                {d.status}
                              </span>
                            </td>
                            <td>
                              {d.isDefault ? (
                                <span className="default-pill">Default</span>
                              ) : d.status === "verified" ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetDefault(d._id);
                                  }}
                                  className="btn-set-default"
                                >
                                  Make Default
                                </button>
                              ) : (
                                <span className="default-disabled">—</span>
                              )}
                            </td>
                            <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                            <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                              <div className="action-buttons-group">
                                {d.status === "pending" && (
                                  <button
                                    onClick={() => handleVerifyDomain(d._id)}
                                    className="btn-ds btn-ds-success btn-verify-sm"
                                  >
                                    Verify
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteDomain(d)}
                                  className="btn-delete-domain"
                                  title="Delete domain"
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

            {/* Right side: Instructions Panel */}
            <div className="domains-sidebar-panel">
              <div className="card-ds instructions-card">
                <h3>DNS Configuration Guide</h3>
                
                {selectedDomainForInstructions ? (
                  <div className="instructions-details">
                    <p className="selected-domain-label">
                      Configuring DNS for: <code>{selectedDomainForInstructions.domain}</code>
                    </p>
                    
                    <div className="dns-record-box">
                      <div className="dns-row">
                        <span className="dns-lbl">Record Type</span>
                        <strong className="dns-val">CNAME</strong>
                      </div>
                      <div className="dns-row">
                        <span className="dns-lbl">Host / Name</span>
                        <strong className="dns-val">
                          {selectedDomainForInstructions.domain.split(".")[0] === "www" || 
                           selectedDomainForInstructions.domain.split(".").length <= 2 
                            ? "@" 
                            : selectedDomainForInstructions.domain.split(".")[0]}
                        </strong>
                      </div>
                      <div className="dns-row">
                        <span className="dns-lbl">Points To / Value</span>
                        <strong className="dns-val">shrinkly.app</strong>
                      </div>
                    </div>

                    <div className="verification-token-box">
                      <span className="token-lbl">Verification Token (TXT optional)</span>
                      <code className="token-val">{selectedDomainForInstructions.verificationToken}</code>
                    </div>

                    <div className="instruction-step-list">
                      <div className="step-item">
                        <span className="step-num">1</span>
                        <p>Log in to your domain registrar control panel (e.g. GoDaddy, Namecheap, Cloudflare).</p>
                      </div>
                      <div className="step-item">
                        <span className="step-num">2</span>
                        <p>Locate the DNS management zone editor for your domain.</p>
                      </div>
                      <div className="step-item">
                        <span className="step-num">3</span>
                        <p>Add a new CNAME record pointing your domain (or subdomain) to <code>shrinkly.app</code>.</p>
                      </div>
                      <div className="step-item">
                        <span className="step-num">4</span>
                        <p>Once saved, return here and click the <strong>Verify</strong> button next to the domain.</p>
                      </div>
                    </div>

                    {selectedDomainForInstructions.status === "pending" && (
                      <button
                        onClick={() => handleVerifyDomain(selectedDomainForInstructions._id)}
                        className="btn-ds btn-ds-success btn-verify-large"
                      >
                        Verify Connection Now
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="no-selected-domain-state">
                    <p>Select a domain from the list to view its custom DNS configuration instructions.</p>
                  </div>
                )}
              </div>

              {/* Demo Notice */}
              <div className="card-ds-glass demo-notice-card">
                <h4>🔒 Sandbox Simulation Mode</h4>
                <p>
                  For development & portfolio demonstrations, domain verification checks are simulated. Pointing real DNS records is not required — simply press <strong>Verify</strong> to instantly transition the domain to a verified state.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
