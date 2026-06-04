import { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { reportsAPI } from "../services/api";
import toast from "react-hot-toast";
import "../Css/Reports.css";

export default function Reports() {
  const [settings, setSettings] = useState({
    enabled: false,
    frequency: "daily",
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: "09:00",
    recipientEmail: "",
  });
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);

  // Fetch settings and logs on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsData, logsData] = await Promise.allSettled([
        reportsAPI.getSettings(),
        reportsAPI.getLogs(),
      ]);

      if (settingsData.status === "fulfilled" && settingsData.value.success) {
        const s = settingsData.value.settings;
        if (s) {
          setSettings({
            enabled: s.enabled || false,
            frequency: s.frequency || "daily",
            dayOfWeek: s.dayOfWeek ?? 1,
            dayOfMonth: s.dayOfMonth ?? 1,
            time: s.time || "09:00",
            recipientEmail: s.recipientEmail || "",
          });
          setHasExistingSettings(true);
        }
      }

      if (logsData.status === "fulfilled" && logsData.value.success) {
        setLogs(logsData.value.logs || []);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!settings.recipientEmail.trim()) {
      toast.error("Please enter a recipient email");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        enabled: settings.enabled,
        frequency: settings.frequency,
        time: settings.time,
        recipientEmail: settings.recipientEmail.trim(),
      };

      if (settings.frequency === "weekly") {
        payload.dayOfWeek = Number(settings.dayOfWeek);
      }
      if (settings.frequency === "monthly") {
        payload.dayOfMonth = Number(settings.dayOfMonth);
      }

      if (hasExistingSettings) {
        await reportsAPI.updateSettings(payload);
      } else {
        await reportsAPI.createSettings(payload);
        setHasExistingSettings(true);
      }

      toast.success("Report settings saved!");
    } catch (error) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async () => {
    try {
      setSending(true);
      await reportsAPI.sendNow();
      toast.success("Report sent successfully!");
      // Refresh logs after sending
      const logsData = await reportsAPI.getLogs();
      if (logsData.success) {
        setLogs(logsData.logs || []);
      }
    } catch (error) {
      toast.error("Failed to send report");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="reports-page">
          {/* Header */}
          <header className="reports-header">
            <div className="reports-header-left">
              <h1>Reports</h1>
              <p>Configure automated reports &amp; view history</p>
            </div>
          </header>

          {/* Tabs */}
          <div className="reports-tabs">
            <button
              className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              ⚙️ Settings
            </button>
            <button
              className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              📋 History
            </button>
          </div>

          <div className="reports-container">
            {/* ===== Settings Tab ===== */}
            {activeTab === "settings" && (
              <div className="settings-card">
                {loading ? (
                  <div className="skeleton-form">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="skeleton-row skeleton-pulse" />
                    ))}
                  </div>
                ) : (
                  <form className="settings-form" onSubmit={handleSave}>
                    {/* Enable / Disable Toggle */}
                    <div className="form-group">
                      <label className="toggle-label">
                        Enable Automated Reports
                      </label>
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          id="enabled"
                          name="enabled"
                          checked={settings.enabled}
                          onChange={handleChange}
                        />
                        <label htmlFor="enabled" className="toggle-slider">
                          <span className="toggle-text">
                            {settings.enabled ? "ON" : "OFF"}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div className="form-group">
                      <label htmlFor="frequency">FREQUENCY</label>
                      <select
                        id="frequency"
                        name="frequency"
                        value={settings.frequency}
                        onChange={handleChange}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    {/* Day of Week (weekly only) */}
                    {settings.frequency === "weekly" && (
                      <div className="form-group">
                        <label htmlFor="dayOfWeek">DAY OF WEEK</label>
                        <select
                          id="dayOfWeek"
                          name="dayOfWeek"
                          value={settings.dayOfWeek}
                          onChange={handleChange}
                        >
                          {dayNames.map((day, idx) => (
                            <option key={idx} value={idx}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Day of Month (monthly only) */}
                    {settings.frequency === "monthly" && (
                      <div className="form-group">
                        <label htmlFor="dayOfMonth">DAY OF MONTH</label>
                        <select
                          id="dayOfMonth"
                          name="dayOfMonth"
                          value={settings.dayOfMonth}
                          onChange={handleChange}
                        >
                          {[...Array(31)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Time */}
                    <div className="form-group">
                      <label htmlFor="time">TIME</label>
                      <input
                        type="time"
                        id="time"
                        name="time"
                        value={settings.time}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Recipient Email */}
                    <div className="form-group">
                      <label htmlFor="recipientEmail">RECIPIENT EMAIL</label>
                      <input
                        type="email"
                        id="recipientEmail"
                        name="recipientEmail"
                        value={settings.recipientEmail}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn-save"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Settings"}
                      </button>
                      <button
                        type="button"
                        className="btn-send-now"
                        onClick={handleSendNow}
                        disabled={sending}
                      >
                        {sending ? "Sending..." : "Send Report Now"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ===== History Tab ===== */}
            {activeTab === "history" && (
              <div className="reports-table-container">
                {loading ? (
                  <div className="skeleton-table">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="skeleton-row skeleton-pulse" />
                    ))}
                  </div>
                ) : logs.length > 0 ? (
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Sent Date</th>
                        <th>Report Type</th>
                        <th>Recipient Email</th>
                        <th>Status</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, idx) => (
                        <tr key={log._id || idx}>
                          <td>{formatDate(log.sentAt || log.createdAt)}</td>
                          <td>
                            <span className={`type-badge ${log.reportType}`}>
                              {log.reportType || "—"}
                            </span>
                          </td>
                          <td>{log.recipientEmail || "—"}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                log.status === "sent" ? "sent" : "failed"
                              }`}
                            >
                              {log.status || "—"}
                            </span>
                          </td>
                          <td className="error-cell">
                            {log.status === "failed"
                              ? log.errorMessage || log.error || "Unknown error"
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">📊</span>
                    <h3>No reports sent yet</h3>
                    <p>
                      Configure your settings and send your first report!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
