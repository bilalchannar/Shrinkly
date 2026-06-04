import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { adminAPI } from "../services/api";
import toast from "react-hot-toast";
import "../Css/Admin.css";

export default function AdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // States for sub-tab datasets
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("");

  const [links, setLinks] = useState([]);
  const [linksPagination, setLinksPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [linksSearch, setLinksSearch] = useState("");
  const [linksStatusFilter, setLinksStatusFilter] = useState("");

  const [tickets, setTickets] = useState([]);
  const [ticketsFilter, setTicketsFilter] = useState("");

  const [reports, setReports] = useState([]);
  const [platformAnalytics, setPlatformAnalytics] = useState(null);
  const [abuseReports, setAbuseReports] = useState([]);
  const [abuseStatusFilter, setAbuseStatusFilter] = useState("");

  // Fetch initial dashboard data on mount
  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  // Fetch tab-specific data when sub-tab changes or pagination/filters update
  useEffect(() => {
    if (activeSubTab === "overview") fetchDashboardOverview();
    if (activeSubTab === "users") fetchUsers(usersPagination.page, usersSearch, usersRoleFilter);
    if (activeSubTab === "links") fetchLinks(linksPagination.page, linksSearch, linksStatusFilter);
    if (activeSubTab === "tickets") fetchTickets(ticketsFilter);
    if (activeSubTab === "reports") fetchReports();
    if (activeSubTab === "analytics") fetchPlatformAnalytics();
    if (activeSubTab === "abuse") fetchAbuseReports(abuseStatusFilter);
  }, [activeSubTab, abuseStatusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getReports();
      if (res.success) {
        setReports(res.logs || []);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load reports logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchAbuseReports = async (status = "") => {
    try {
      setLoading(true);
      const params = {};
      if (status) params.status = status;
      const res = await adminAPI.getAbuseReports(params);
      if (res.success) {
        setAbuseReports(res.reports || []);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load abuse reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardOverview = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getDashboard();
      if (res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load dashboard overview");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1, search = "", role = "") => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (role) params.role = role;
      
      const res = await adminAPI.getUsers(params);
      if (res.success) {
        setUsers(res.users || []);
        setUsersPagination({
          page: res.pagination?.page || 1,
          total: res.pagination?.total || 0,
          pages: res.pagination?.pages || 1
        });
      }
    } catch (err) {
      toast.error(err.message || "Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  const fetchLinks = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (status) params.status = status;

      const res = await adminAPI.getLinks(params);
      if (res.success) {
        setLinks(res.links || []);
        setLinksPagination({
          page: res.pagination?.page || 1,
          total: res.pagination?.total || 0,
          pages: res.pagination?.pages || 1
        });
      }
    } catch (err) {
      toast.error(err.message || "Failed to load links list");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async (status = "") => {
    try {
      setLoading(true);
      const params = {};
      if (status) params.status = status;
      const res = await adminAPI.getTickets(params);
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };


  const fetchPlatformAnalytics = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getPlatformAnalytics();
      if (res.success) {
        setPlatformAnalytics(res.analytics);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load platform analytics");
    } finally {
      setLoading(false);
    }
  };

  // Admin action triggers
  const handleUserStatusToggle = async (userItem) => {
    try {
      setActionLoading(true);
      let res;
      if (userItem.suspended) {
        res = await adminAPI.activateUser(userItem._id);
        toast.success(`Activated user: ${userItem.username}`);
      } else {
        res = await adminAPI.suspendUser(userItem._id, "Suspended by Administrator");
        toast.success(`Suspended user: ${userItem.username}`);
      }
      if (res.success) {
        fetchUsers(usersPagination.page, usersSearch, usersRoleFilter);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkStatusToggle = async (linkItem) => {
    try {
      setActionLoading(true);
      let res;
      if (linkItem.status === "active") {
        res = await adminAPI.disableLink(linkItem._id);
        toast.success("Short code deactivated successfully");
      } else {
        res = await adminAPI.enableLink(linkItem._id);
        toast.success("Short code activated successfully");
      }
      if (res.success) {
        fetchLinks(linksPagination.page, linksSearch, linksStatusFilter);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update link status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAbuseReportStatusUpdate = async (id, nextStatus) => {
    try {
      setActionLoading(true);
      const res = await adminAPI.updateAbuseReportStatus(id, nextStatus);
      if (res.success) {
        toast.success(`Report status updated to ${nextStatus}`);
        fetchAbuseReports(abuseStatusFilter);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update abuse report status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLinkSafety = async (linkId, safetyStatus, safetyReason = "") => {
    try {
      setActionLoading(true);
      const res = await adminAPI.updateLinkSafety(linkId, safetyStatus, safetyReason);
      if (res.success) {
        toast.success(res.message || `Link safety status updated to ${safetyStatus}`);
        if (activeSubTab === "links") {
          fetchLinks(linksPagination.page, linksSearch, linksStatusFilter);
        } else if (activeSubTab === "abuse") {
          fetchAbuseReports(abuseStatusFilter);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to update link safety status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTicketStatusUpdate = async (ticketId, nextStatus) => {
    try {
      setActionLoading(true);
      const res = await adminAPI.updateTicketStatus(ticketId, nextStatus, "Status updated by admin");
      if (res.success) {
        toast.success(`Ticket marked as ${nextStatus}`);
        fetchTickets(ticketsFilter);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update ticket");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="admin-page">
          {/* Header */}
          <header className="admin-header">
            <div className="admin-header-left">
              <h1>Admin Dashboard Panel</h1>
              <p>Platform management, abuse control, metrics, tickets, and sent reports log tracker</p>
            </div>
            <div className="admin-header-right">
              <span className="admin-badge">SYSTEM SECURITY: ACTIVE</span>
            </div>
          </header>

          {/* Navigation Sub-Tabs */}
          <div className="admin-subtabs">
            {[
              { id: "overview", label: "📊 Overview" },
              { id: "users", label: "👥 User Accounts" },
              { id: "links", label: "🔗 Link Records" },
              { id: "abuse", label: "⚠️ Abuse Reports" },
              { id: "tickets", label: "📞 Support Tickets" },
              { id: "reports", label: "📄 Email Reports Log" },
              { id: "analytics", label: "⚙️ System Analytics" }
            ].map(tab => (
              <button
                key={tab.id}
                className={`admin-subtab-btn ${activeSubTab === tab.id ? "active" : ""}`}
                onClick={() => {
                  setActiveSubTab(tab.id);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-container">
            {loading && !dashboardData && !users.length && !links.length && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh", flexDirection: 'column', gap: '15px' }}>
                <div className="loading-spinner"></div>
                <p style={{ color: 'var(--text-secondary)' }}>Retrieving administrative records...</p>
              </div>
            )}

            {/* TAB 1: OVERVIEW */}
            {activeSubTab === "overview" && dashboardData && (
              <div className="overview-tab-content">
                {/* Metrics Cards */}
                <div className="admin-metrics-grid">
                  <div className="metric-card">
                    <span className="card-lbl">Total Users</span>
                    <h3>{dashboardData.stats.totalUsers}</h3>
                    <small>+{dashboardData.stats.newUsersThisWeek} new this week</small>
                  </div>
                  <div className="metric-card">
                    <span className="card-lbl">Links / Short URLs</span>
                    <h3>{dashboardData.stats.totalLinks}</h3>
                    <small>{dashboardData.stats.activeLinks} active redirects</small>
                  </div>
                  <div className="metric-card">
                    <span className="card-lbl">Accumulated Clicks</span>
                    <h3>{dashboardData.stats.totalClicks.toLocaleString()}</h3>
                    <small>+{dashboardData.stats.clicksThisWeek.toLocaleString()} clicks this week</small>
                  </div>
                  <div className="metric-card">
                    <span className="card-lbl">Pending Support Inquiry</span>
                    <h3>{dashboardData.stats.pendingTickets}</h3>
                    <small>Requires admin response</small>
                  </div>
                  <div className="metric-card">
                    <span className="card-lbl">Reports Sent (All-time)</span>
                    <h3>{dashboardData.stats.reportsSent}</h3>
                    <small>Cron log delivery history</small>
                  </div>
                  <div className="metric-card">
                    <span className="card-lbl">Abusive / Inactive Links</span>
                    <h3>{dashboardData.stats.disabledLinks}</h3>
                    <small>Deactivated from redirects</small>
                  </div>
                </div>

                {/* Lists Grid */}
                <div className="overview-lists-grid">
                  {/* Recent Users */}
                  <div className="admin-card-section">
                    <div className="card-sec-head">Recent User Signups</div>
                    <div className="sec-list-wrapper">
                      {dashboardData.recentUsers.map(usr => (
                        <div key={usr._id} className="sec-list-item">
                          <div>
                            <strong>{usr.displayName || usr.username}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{usr.email} • Plan: {usr.plan.toUpperCase()}</p>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(usr.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Links */}
                  <div className="admin-card-section">
                    <div className="card-sec-head">Recent Short Links Created</div>
                    <div className="sec-list-wrapper">
                      {dashboardData.recentLinks.map(lnk => (
                        <div key={lnk._id} className="sec-list-item">
                          <div>
                            <strong>/{lnk.shortCode}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Owner: {lnk.userId?.email || 'Guest'} • To: {lnk.originalUrl}
                            </p>
                          </div>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: lnk.status === "active" ? "var(--success-bg)" : "var(--error-bg)", borderRadius: '10px', color: lnk.status === "active" ? "var(--success-color)" : "var(--error-color)" }}>{lnk.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Tickets */}
                  <div className="admin-card-section">
                    <div className="card-sec-head">Pending Support Inquiries</div>
                    <div className="sec-list-wrapper">
                      {dashboardData.recentTickets.filter(t => t.status === "new").map(tkt => (
                        <div key={tkt._id} className="sec-list-item">
                          <div>
                            <strong>{tkt.fullName} • {tkt.subject}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tkt.message.substring(0, 75)}...</p>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--error-color)', fontWeight: 'bold' }}>NEW</span>
                        </div>
                      ))}
                      {dashboardData.recentTickets.filter(t => t.status === "new").length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>🎉 All support inquiries cleared!</div>
                      )}
                    </div>
                  </div>

                  {/* Recent Reports */}
                  <div className="admin-card-section">
                    <div className="card-sec-head">Recent Reports Deliveries</div>
                    <div className="sec-list-wrapper">
                      {dashboardData.recentReports.map(rep => (
                        <div key={rep._id} className="sec-list-item">
                          <div>
                            <strong>To: {rep.recipientEmail}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type: {rep.reportType} • Logs: {rep.status === "sent" ? "Delivered" : "Failed"}</p>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: rep.status === "sent" ? "var(--success-color)" : "var(--error-color)" }}>{rep.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: USER ACCOUNTS */}
            {activeSubTab === "users" && (
              <div className="admin-table-view">
                <div className="filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="filter-search-input"
                    placeholder="Search by name, email, or username..."
                    value={usersSearch}
                    onChange={(e) => {
                      setUsersSearch(e.target.value);
                      fetchUsers(1, e.target.value, usersRoleFilter);
                    }}
                    style={{ flex: 1, padding: '0.75rem 1.25rem', border: '1.5px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <select
                    value={usersRoleFilter}
                    onChange={(e) => {
                      setUsersRoleFilter(e.target.value);
                      fetchUsers(1, usersSearch, e.target.value);
                    }}
                    style={{ padding: '0.75rem 1.25rem', border: '1.5px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div className="table-responsive" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                  <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem' }}>User Info</th>
                        <th style={{ padding: '1rem' }}>Role</th>
                        <th style={{ padding: '1rem' }}>Plan</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem' }}>Created Date</th>
                        <th style={{ padding: '1rem', textRight: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{u.displayName || u.username}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                          </td>
                          <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{u.role}</td>
                          <td style={{ padding: '1rem', textTransform: 'uppercase' }}>{u.plan}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '12px', background: u.suspended ? "var(--error-bg)" : "var(--success-bg)", color: u.suspended ? "var(--error-color)" : "var(--success-color)", fontWeight: 'bold' }}>
                              {u.suspended ? "SUSPENDED" : "ACTIVE"}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <button
                              className="btn-primary"
                              onClick={() => handleUserStatusToggle(u)}
                              disabled={actionLoading || u.role === "superadmin"}
                              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: u.suspended ? 'var(--success-color)' : 'var(--error-color)' }}
                            >
                              {u.suspended ? "Reactivate" : "Suspend"}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No user accounts found matching query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {usersPagination.pages > 1 && (
                  <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1.5rem' }}>
                    <button
                      className="btn-secondary"
                      disabled={usersPagination.page === 1}
                      onClick={() => fetchUsers(usersPagination.page - 1, usersSearch, usersRoleFilter)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                    >
                      ← Previous
                    </button>
                    <span style={{ alignSelf: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Page {usersPagination.page} of {usersPagination.pages}</span>
                    <button
                      className="btn-secondary"
                      disabled={usersPagination.page === usersPagination.pages}
                      onClick={() => fetchUsers(usersPagination.page + 1, usersSearch, usersRoleFilter)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LINK RECORDS */}
            {activeSubTab === "links" && (
              <div className="admin-table-view">
                <div className="filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="filter-search-input"
                    placeholder="Search links by code or original URL..."
                    value={linksSearch}
                    onChange={(e) => {
                      setLinksSearch(e.target.value);
                      fetchLinks(1, e.target.value, linksStatusFilter);
                    }}
                    style={{ flex: 1, padding: '0.75rem 1.25rem', border: '1.5px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                  <select
                    value={linksStatusFilter}
                    onChange={(e) => {
                      setLinksStatusFilter(e.target.value);
                      fetchLinks(1, linksSearch, e.target.value);
                    }}
                    style={{ padding: '0.75rem 1.25rem', border: '1.5px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div className="table-responsive" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                  <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem' }}>Short slug / Owner</th>
                        <th style={{ padding: '1rem' }}>Destination Target</th>
                        <th style={{ padding: '1rem' }}>Clicks</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem' }}>Safety</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {links.map(l => (
                        <tr key={l._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>/{l.shortCode}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{l.userId?.email || "Guest"}</div>
                          </td>
                          <td style={{ padding: '1rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <a href={l.originalUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>{l.originalUrl}</a>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>{l.clicks}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '12px', background: l.status === "active" ? "var(--success-bg)" : "var(--error-bg)", color: l.status === "active" ? "var(--success-color)" : "var(--error-color)", fontWeight: 'bold' }}>
                              {l.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              fontSize: '0.75rem',
                              borderRadius: '12px',
                              background: l.safetyStatus === "blocked" ? "var(--error-bg)" : (l.safetyStatus === "suspicious" ? "rgba(245, 158, 11, 0.15)" : "var(--success-bg)"),
                              color: l.safetyStatus === "blocked" ? "var(--error-color)" : (l.safetyStatus === "suspicious" ? "#d97706" : "var(--success-color)"),
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {l.safetyStatus || "safe"}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <button
                              className="btn-primary"
                              onClick={() => handleLinkStatusToggle(l)}
                              disabled={actionLoading}
                              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: l.status === "active" ? 'var(--error-color)' : 'var(--success-color)' }}
                            >
                              {l.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                            <div style={{ display: 'flex', gap: '5px', marginTop: '5px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  const reason = prompt("Enter safety status update reason (optional):") || "";
                                  handleUpdateLinkSafety(l._id, "safe", reason);
                                }}
                                disabled={actionLoading || l.safetyStatus === "safe"}
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.7rem',
                                  borderRadius: '6px',
                                  border: '1px solid #10b981',
                                  background: l.safetyStatus === "safe" ? '#10b981' : 'transparent',
                                  color: l.safetyStatus === "safe" ? '#fff' : '#10b981',
                                  cursor: 'pointer',
                                  fontWeight: 'bold'
                                }}
                              >
                                Safe
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt("Enter safety status update reason (optional):") || "";
                                  handleUpdateLinkSafety(l._id, "suspicious", reason);
                                }}
                                disabled={actionLoading || l.safetyStatus === "suspicious"}
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.7rem',
                                  borderRadius: '6px',
                                  border: '1px solid #f59e0b',
                                  background: l.safetyStatus === "suspicious" ? '#f59e0b' : 'transparent',
                                  color: l.safetyStatus === "suspicious" ? '#fff' : '#f59e0b',
                                  cursor: 'pointer',
                                  fontWeight: 'bold'
                                }}
                              >
                                Suspicious
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt("Enter safety status update reason (optional):") || "";
                                  handleUpdateLinkSafety(l._id, "blocked", reason);
                                }}
                                disabled={actionLoading || l.safetyStatus === "blocked"}
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.7rem',
                                  borderRadius: '6px',
                                  border: '1px solid #ef4444',
                                  background: l.safetyStatus === "blocked" ? '#ef4444' : 'transparent',
                                  color: l.safetyStatus === "blocked" ? '#fff' : '#ef4444',
                                  cursor: 'pointer',
                                  fontWeight: 'bold'
                                }}
                              >
                                Block
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {links.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No short URLs found matching search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination links */}
                {linksPagination.pages > 1 && (
                  <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1.5rem' }}>
                    <button
                      className="btn-secondary"
                      disabled={linksPagination.page === 1}
                      onClick={() => fetchLinks(linksPagination.page - 1, linksSearch, linksStatusFilter)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                    >
                      ← Previous
                    </button>
                    <span style={{ alignSelf: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Page {linksPagination.page} of {linksPagination.pages}</span>
                    <button
                      className="btn-secondary"
                      disabled={linksPagination.page === linksPagination.pages}
                      onClick={() => fetchLinks(linksPagination.page + 1, linksSearch, linksStatusFilter)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ABUSE REPORTS */}
            {activeSubTab === "abuse" && (
              <div className="admin-table-view">
                <div className="filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <select
                    value={abuseStatusFilter}
                    onChange={(e) => setAbuseStatusFilter(e.target.value)}
                    style={{ padding: '0.75rem 1.25rem', border: '1.5px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="">All Report Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                <div className="table-responsive" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                  <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem' }}>Short URL / Owner</th>
                        <th style={{ padding: '1rem' }}>Reported Target</th>
                        <th style={{ padding: '1rem' }}>Reporter / Date</th>
                        <th style={{ padding: '1rem' }}>Reason & Details</th>
                        <th style={{ padding: '1rem' }}>Status / Link Safety</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abuseReports.map(r => (
                        <tr key={r._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{r.shortUrl}</div>
                            {r.linkId && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Owner: {r.linkId.userId?.email || "Guest"}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '1rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <a href={r.reportedUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>{r.reportedUrl}</a>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.reporterEmail || "Anonymous"}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleString()}</div>
                          </td>
                          <td style={{ padding: '1rem', maxWidth: '300px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: 'var(--error-color)',
                              marginBottom: '4px'
                            }}>
                              {r.reason}
                            </span>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                              {r.details}
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <div>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.6rem',
                                  fontSize: '0.75rem',
                                  borderRadius: '12px',
                                  background: r.status === "pending" ? "rgba(239, 68, 68, 0.15)" : (r.status === "reviewed" ? "rgba(59, 130, 246, 0.15)" : (r.status === "resolved" ? "var(--success-bg)" : "rgba(107, 114, 128, 0.15)")),
                                  color: r.status === "pending" ? "var(--error-color)" : (r.status === "reviewed" ? "var(--primary-color)" : (r.status === "resolved" ? "var(--success-color)" : "var(--text-muted)")),
                                  fontWeight: 'bold',
                                  textTransform: 'uppercase'
                                }}>
                                  Report: {r.status}
                                </span>
                              </div>
                              {r.linkId && (
                                <div>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.2rem 0.6rem',
                                    fontSize: '0.75rem',
                                    borderRadius: '12px',
                                    background: r.linkId.safetyStatus === "blocked" ? "var(--error-bg)" : (r.linkId.safetyStatus === "suspicious" ? "rgba(245, 158, 11, 0.15)" : "var(--success-bg)"),
                                    color: r.linkId.safetyStatus === "blocked" ? "var(--error-color)" : (r.linkId.safetyStatus === "suspicious" ? "#d97706" : "var(--success-color)"),
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                  }}>
                                    Link: {r.linkId.safetyStatus || "safe"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <select
                                  value={r.status}
                                  onChange={(e) => handleAbuseReportStatusUpdate(r._id, e.target.value)}
                                  disabled={actionLoading}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="reviewed">Reviewed</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="dismissed">Dismissed</option>
                                </select>
                              </div>

                              {r.linkId && (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <button
                                    onClick={() => {
                                      const reason = prompt("Enter safety status update reason (optional):") || "";
                                      handleUpdateLinkSafety(r.linkId._id, "safe", reason);
                                    }}
                                    disabled={actionLoading || r.linkId.safetyStatus === "safe"}
                                    style={{
                                      padding: '0.2rem 0.4rem',
                                      fontSize: '0.7rem',
                                      borderRadius: '6px',
                                      border: '1px solid #10b981',
                                      background: r.linkId.safetyStatus === "safe" ? '#10b981' : 'transparent',
                                      color: r.linkId.safetyStatus === "safe" ? '#fff' : '#10b981',
                                      cursor: 'pointer',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    Safe
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt("Enter safety status update reason (optional):") || "";
                                      handleUpdateLinkSafety(r.linkId._id, "suspicious", reason);
                                    }}
                                    disabled={actionLoading || r.linkId.safetyStatus === "suspicious"}
                                    style={{
                                      padding: '0.2rem 0.4rem',
                                      fontSize: '0.7rem',
                                      borderRadius: '6px',
                                      border: '1px solid #f59e0b',
                                      background: r.linkId.safetyStatus === "suspicious" ? '#f59e0b' : 'transparent',
                                      color: r.linkId.safetyStatus === "suspicious" ? '#fff' : '#f59e0b',
                                      cursor: 'pointer',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    Suspicious
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt("Enter safety status update reason (optional):") || "";
                                      handleUpdateLinkSafety(r.linkId._id, "blocked", reason);
                                    }}
                                    disabled={actionLoading || r.linkId.safetyStatus === "blocked"}
                                    style={{
                                      padding: '0.2rem 0.4rem',
                                      fontSize: '0.7rem',
                                      borderRadius: '6px',
                                      border: '1px solid #ef4444',
                                      background: r.linkId.safetyStatus === "blocked" ? '#ef4444' : 'transparent',
                                      color: r.linkId.safetyStatus === "blocked" ? '#fff' : '#ef4444',
                                      cursor: 'pointer',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    Block
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {abuseReports.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No abuse reports found matching query.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: SUPPORT TICKETS */}
            {activeSubTab === "tickets" && (
              <div className="tickets-tab-content">
                <div className="filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'flex-end' }}>
                  <select
                    value={ticketsFilter}
                    onChange={(e) => {
                      setTicketsFilter(e.target.value);
                      fetchTickets(e.target.value);
                    }}
                    style={{ padding: '0.75rem 1.25rem', border: '1.5px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="">All Tickets</option>
                    <option value="new">Pending / New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {tickets.length === 0 ? (
                  <div className="empty-state" style={{ padding: '4rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '3rem' }}>🎉</span>
                    <h3 style={{ margin: '15px 0 5px' }}>No support tickets</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>All queries are fully answered!</p>
                  </div>
                ) : (
                  <div className="tickets-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tickets.map(t => (
                      <div key={t._id} style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        boxShadow: 'var(--card-shadow)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{t.fullName} ({t.email})</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Posted: {new Date(t.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              background: t.status === "new" ? "var(--error-bg)" : (t.status === "read" ? "rgba(var(--primary-rgb), 0.1)" : "var(--success-bg)"),
                              color: t.status === "new" ? "var(--error-color)" : (t.status === "read" ? "var(--primary-color)" : "var(--success-color)")
                            }}>
                              {t.status === "new" ? "PENDING" : t.status.toUpperCase()}
                            </span>
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              background: '#eee',
                              color: '#666',
                              textTransform: 'uppercase',
                              fontWeight: 'bold'
                            }}>
                              {t.priority} Priority
                            </span>
                          </div>
                        </div>

                        <div>
                          <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Subject: {t.subject}</strong>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{t.message}</p>
                        </div>

                        {t.adminNotes && (
                          <div style={{ background: 'var(--bg-primary)', borderLeft: '4px solid var(--primary-color)', padding: '0.75rem 1rem', borderRadius: '0 8px 8px 0', fontSize: '0.9rem' }}>
                            <strong>Admin Remarks:</strong> {t.adminNotes}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleTicketStatusUpdate(t._id, "read")}
                            disabled={actionLoading || t.status === "read"}
                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#6f42c1', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            Mark Read
                          </button>
                          <button
                            onClick={() => handleTicketStatusUpdate(t._id, "replied")}
                            disabled={actionLoading || t.status === "replied"}
                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            Mark Replied
                          </button>
                          <button
                            onClick={() => handleTicketStatusUpdate(t._id, "archived")}
                            disabled={actionLoading || t.status === "archived"}
                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: REPORT LOGS */}
            {activeSubTab === "reports" && (
              <div className="reports-tab-content">
                <div className="table-responsive" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                  <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem' }}>Recipient Email</th>
                        <th style={{ padding: '1rem' }}>Frequency</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem' }}>Dispatch Date</th>
                        <th style={{ padding: '1rem' }}>Report Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(r => (
                        <tr key={r._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{r.recipientEmail}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Owner ID: {r.userId?.username || 'Guest'}</div>
                          </td>
                          <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{r.reportType}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '12px', background: r.status === "sent" ? "var(--success-bg)" : "var(--error-bg)", color: r.status === "sent" ? "var(--success-color)" : "var(--error-color)", fontWeight: 'bold' }}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(r.sentAt || r.createdAt).toLocaleString()}</td>
                          <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {r.status === "failed" ? (
                              <span style={{ color: 'var(--error-color)' }}>Error: {r.errorMessage || "SMTP Connection failure"}</span>
                            ) : (
                              <span>Links: {r.summaryData?.totalLinks || 0} • Clicks: {r.summaryData?.totalClicks || 0}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {reports.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No automatic report logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: PLATFORM ANALYTICS */}
            {activeSubTab === "analytics" && platformAnalytics && (
              <div className="analytics-tab-content">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                  {/* Distribution by Role */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--card-shadow)' }}>
                    <h3 style={{ margin: '0 0 1.25rem', color: 'var(--text-primary)' }}>User Roles Distribution</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {platformAnalytics.distribution.byRole.map(role => (
                        <div key={role._id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-secondary)' }}>{role._id}s</span>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{role.count} accounts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Distribution by Plan */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--card-shadow)' }}>
                    <h3 style={{ margin: '0 0 1.25rem', color: 'var(--text-primary)' }}>User Plans Distribution</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {platformAnalytics.distribution.byPlan.map(plan => (
                        <div key={plan._id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-secondary)' }}>{plan._id} Membership</span>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{plan.count} users</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Redirection Performance summary */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--card-shadow)' }}>
                    <h3 style={{ margin: '0 0 1.25rem', color: 'var(--text-primary)' }}>Redirect Performance Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total Links Registered</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{platformAnalytics.links.total}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Active Links Ratio</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                          {platformAnalytics.links.total > 0 ? ((platformAnalytics.links.active / platformAnalytics.links.total) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Platform Clicks Average</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {platformAnalytics.links.total > 0 ? (platformAnalytics.clicks.total / platformAnalytics.links.total).toFixed(1) : 0} clicks / link
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
