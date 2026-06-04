import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { notificationsAPI } from "../services/api";
import "../Css/Notifications.css";

const typeIcon = (type) => {
  switch (type) {
    case "success": return "✅";
    case "warning": return "⚠️";
    case "danger": return "🚨";
    default: return "ℹ️";
  }
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | unread

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === "unread") params.isRead = "false";
      const data = await notificationsAPI.getAll(params);
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      toast.error("Failed to load notifications");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]); // eslint-disable-line

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    const toastId = toast.loading("Marking all as read...");
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All marked as read", { id: toastId });
    } catch {
      toast.error("Failed to mark all as read", { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleClearRead = async () => {
    if (!window.confirm("Clear all read notifications?")) return;
    const toastId = toast.loading("Clearing read notifications...");
    try {
      await notificationsAPI.clearRead();
      setNotifications(prev => prev.filter(n => !n.isRead));
      toast.success("Read notifications cleared", { id: toastId });
    } catch {
      toast.error("Failed to clear", { id: toastId });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="notifications-page">
          <header className="notif-header">
            <div className="notif-header-left">
              <h1>🔔 Notifications</h1>
              <p>Stay updated with important events and alerts</p>
            </div>
            <div className="notif-header-actions">
              <button className="btn-ds btn-ds-secondary" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                ✓ Mark All Read
              </button>
              <button className="btn-ds btn-ds-secondary" onClick={handleClearRead}>
                🗑️ Clear Read
              </button>
            </div>
          </header>

          {/* Filter Tabs */}
          <div className="notif-filter-tabs">
            <button
              className={`notif-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All {notifications.length > 0 && `(${notifications.length})`}
            </button>
            <button
              className={`notif-tab ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Notification List */}
          <div className="notif-list">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="notif-skeleton">
                  <div className="skeleton-pulse" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-pulse" style={{ height: "16px", width: "60%", borderRadius: "4px", marginBottom: "8px" }} />
                    <div className="skeleton-pulse" style={{ height: "14px", width: "80%", borderRadius: "4px" }} />
                  </div>
                </div>
              ))
            ) : notifications.length === 0 ? (
              <div className="empty-state-ds card-ds">
                <span className="icon-wrap">🔔</span>
                <h3>No notifications yet</h3>
                <p>When important events happen — like link expiry, click limits, or report delivery — you'll see them here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notif-item card-ds ${notif.isRead ? "read" : "unread"}`}
                >
                  <div className="notif-icon">{typeIcon(notif.type)}</div>
                  <div className="notif-body">
                    <div className="notif-title-row">
                      <h4>{notif.title}</h4>
                      <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                    </div>
                    <p className="notif-message">{notif.message}</p>
                  </div>
                  <div className="notif-actions">
                    {!notif.isRead && (
                      <button className="notif-action-btn" onClick={() => handleMarkRead(notif._id)} title="Mark as read">
                        ✓
                      </button>
                    )}
                    <button className="notif-action-btn danger" onClick={() => handleDelete(notif._id)} title="Delete">
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
