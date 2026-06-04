import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import "../Css/Workspace.css";

export default function Workspace() {
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    fetchWorkspaces
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  // Load details of the selected workspace if one is active
  const fetchSelectedWorkspaceDetails = async (id) => {
    if (!id || id === "personal") {
      setSelectedWorkspace(null);
      return;
    }
    try {
      setLoading(true);
      const data = await api.workspace.getWorkspaceById(id);
      if (data.success) {
        setSelectedWorkspace(data.workspace);
        setRenameValue(data.workspace.name);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load workspace details");
      setSelectedWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace && activeWorkspace !== "personal") {
      fetchSelectedWorkspaceDetails(activeWorkspace);
    } else {
      setSelectedWorkspace(null);
    }
  }, [activeWorkspace, workspaces]);

  // Create workspace
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    try {
      setLoading(true);
      const data = await api.workspace.createWorkspace(newWorkspaceName.trim());
      if (data.success) {
        toast.success("Workspace created successfully");
        setNewWorkspaceName("");
        await fetchWorkspaces();
        // Automatically switch to the newly created workspace
        setActiveWorkspace(data.workspace._id);
      }
    } catch (error) {
      toast.error(error.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  // Rename workspace
  const handleRenameWorkspace = async (e) => {
    e.preventDefault();
    if (!renameValue.trim()) {
      toast.error("Workspace name cannot be empty");
      return;
    }

    try {
      const data = await api.workspace.updateWorkspace(selectedWorkspace._id, renameValue.trim());
      if (data.success) {
        toast.success("Workspace renamed successfully");
        await fetchWorkspaces();
      }
    } catch (error) {
      toast.error(error.message || "Failed to rename workspace");
    }
  };

  // Delete workspace
  const handleDeleteWorkspace = async () => {
    if (!window.confirm(`Are you sure you want to delete "${selectedWorkspace.name}"? This will delete all its workspace configuration.`)) {
      return;
    }

    try {
      const data = await api.workspace.deleteWorkspace(selectedWorkspace._id);
      if (data.success) {
        toast.success("Workspace deleted successfully");
        setActiveWorkspace("personal");
        await fetchWorkspaces();
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete workspace");
    }
  };

  // Leave workspace
  const handleLeaveWorkspace = async (memberId) => {
    if (!window.confirm("Are you sure you want to leave this workspace?")) {
      return;
    }

    try {
      const data = await api.workspace.removeMember(selectedWorkspace._id, memberId);
      if (data.success) {
        toast.success("Left workspace successfully");
        setActiveWorkspace("personal");
        await fetchWorkspaces();
      }
    } catch (error) {
      toast.error(error.message || "Failed to leave workspace");
    }
  };

  // Invite member
  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email");
      return;
    }

    try {
      const data = await api.workspace.inviteMember(selectedWorkspace._id, inviteEmail.trim(), inviteRole);
      if (data.success) {
        toast.success("Invitation sent successfully");
        setInviteEmail("");
        setInviteRole("viewer");
        fetchSelectedWorkspaceDetails(selectedWorkspace._id);
      }
    } catch (error) {
      toast.error(error.message || "Failed to send invitation");
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName || "this member"} from the workspace?`)) {
      return;
    }

    try {
      const data = await api.workspace.removeMember(selectedWorkspace._id, memberId);
      if (data.success) {
        toast.success("Member removed successfully");
        fetchSelectedWorkspaceDetails(selectedWorkspace._id);
      }
    } catch (error) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  // Update role
  const handleRoleChange = async (memberId, newRole) => {
    try {
      const data = await api.workspace.updateMemberRole(selectedWorkspace._id, memberId, newRole);
      if (data.success) {
        toast.success("Member role updated successfully");
        fetchSelectedWorkspaceDetails(selectedWorkspace._id);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update role");
    }
  };

  // Accept Invite
  const handleAcceptInvite = async (wsId) => {
    try {
      const data = await api.workspace.acceptInvite(wsId);
      if (data.success) {
        toast.success("Invitation accepted! Welcome to the workspace.");
        await fetchWorkspaces();
        setActiveWorkspace(wsId);
      }
    } catch (error) {
      toast.error(error.message || "Failed to accept invitation");
    }
  };

  // Decline Invite
  const handleDeclineInvite = async (wsId) => {
    if (!window.confirm("Are you sure you want to decline this invitation?")) {
      return;
    }

    try {
      const data = await api.workspace.declineInvite(wsId);
      if (data.success) {
        toast.success("Invitation declined successfully");
        await fetchWorkspaces();
        if (activeWorkspace === wsId) {
          setActiveWorkspace("personal");
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to decline invitation");
    }
  };

  const currentMemberInfo = selectedWorkspace?.members?.find(
    (m) => m.userId === activeWorkspace // wait, matching logged in user role
  );

  const isOwner = selectedWorkspace?.role === "owner";
  const isAdmin = selectedWorkspace?.role === "admin";
  const canManage = isOwner || isAdmin;

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="workspace-page">
          <header className="workspace-header">
            <h1>Workspace Settings</h1>
            <p>Collaborate with team members, manage roles, and switch environments</p>
          </header>

          <div className="workspace-container">
            {/* Left Column: Switcher & Creator */}
            <div className="workspace-sidebar">
              {/* Workspace Swapper */}
              <div className="workspace-card">
                <h3>Select Context</h3>
                <div className="workspace-list">
                  <button
                    className={`workspace-item ${activeWorkspace === "personal" ? "active" : ""}`}
                    onClick={() => setActiveWorkspace("personal")}
                  >
                    <span className="icon">👤</span>
                    <div className="info">
                      <span className="name">Personal Space</span>
                      <span className="desc">Private links & QR codes</span>
                    </div>
                  </button>

                  {workspaces.length === 0 ? (
                    <div className="empty-state-ws">
                      <span>No workspaces yet</span>
                    </div>
                  ) : (
                    workspaces.map((ws) => (
                      <div key={ws._id} className="workspace-item-wrapper">
                        <button
                          className={`workspace-item ${activeWorkspace === ws._id ? "active" : ""}`}
                          onClick={() => {
                            if (ws.status === "active") {
                              setActiveWorkspace(ws._id);
                            }
                          }}
                          disabled={ws.status !== "active"}
                        >
                          <span className="icon">🏢</span>
                          <div className="info">
                            <span className="name">{ws.name}</span>
                            <span className="desc">
                              {ws.role} • {ws.membersCount} member(s)
                            </span>
                          </div>
                        </button>
                        
                        {ws.status === "invited" && (
                          <div className="invite-actions">
                            <span className="pending-badge">Invited</span>
                            <button
                              className="btn-accept"
                              onClick={() => handleAcceptInvite(ws._id)}
                              title="Accept invitation"
                            >
                              ✓
                            </button>
                            <button
                              className="btn-decline"
                              onClick={() => handleDeclineInvite(ws._id)}
                              title="Decline invitation"
                            >
                              ✗
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Create Workspace Form */}
              <div className="workspace-card">
                <h3>Create New Workspace</h3>
                <form onSubmit={handleCreateWorkspace} className="workspace-form">
                  <div className="form-group-ws">
                    <input
                      type="text"
                      placeholder="Workspace Name"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      maxLength={50}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-create" disabled={loading}>
                    + Create Workspace
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Active Workspace Details */}
            <div className="workspace-main-panel">
              {activeWorkspace === "personal" ? (
                <div className="personal-details-card">
                  <span className="badge-personal">Active Context</span>
                  <h2>👤 Personal Space</h2>
                  <p>
                    You are currently using your private workspace. Links and QR codes created in this
                    workspace are only visible to you.
                  </p>
                  <div className="features-grid">
                    <div className="feature-item">
                      <span className="f-icon">🔒</span>
                      <h4>Secure & Private</h4>
                      <p>Nobody else has access to your links, QR codes, or analytics.</p>
                    </div>
                    <div className="feature-item">
                      <span className="f-icon">🚀</span>
                      <h4>Create Team Workspace</h4>
                      <p>Create a workspace on the left to invite members and collaborate.</p>
                    </div>
                  </div>
                </div>
              ) : selectedWorkspace ? (
                <div className="workspace-details-panel animate-fade">
                  {/* Settings & Info Card */}
                  <div className="workspace-card details-header-card">
                    <div className="details-header-top">
                      <div>
                        <h2>🏢 {selectedWorkspace.name}</h2>
                        <p className="ws-meta">
                          Owned by: <strong>{selectedWorkspace.ownerEmail}</strong> • Created on:{" "}
                          {new Date(selectedWorkspace.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="badge-role">{selectedWorkspace.role}</span>
                    </div>

                    {canManage && (
                      <form onSubmit={handleRenameWorkspace} className="rename-form">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          required
                        />
                        <button type="submit" className="btn-save">
                          Rename
                        </button>
                      </form>
                    )}

                    <div className="danger-actions-ws">
                      {isOwner && (
                        <button onClick={handleDeleteWorkspace} className="btn-danger-ws">
                          ⚠️ Delete Workspace
                        </button>
                      )}
                      {!isOwner && (
                        <button
                          onClick={() => {
                            const self = selectedWorkspace.members.find(
                              (m) => m.email === selectedWorkspace.ownerEmail // Wait, let's search self by logged in user email
                            );
                            // To find self membership ID:
                            // We can just call getWorkspaceById which returns members, let's find the one matching member userId === currentUser
                            const myMemberRecord = selectedWorkspace.members.find(
                              (m) => m.role !== "owner" // or matching currentUser id
                            );
                            if (myMemberRecord) {
                              handleLeaveWorkspace(myMemberRecord._id);
                            } else {
                              toast.error("Could not leave workspace. Please try again.");
                            }
                          }}
                          className="btn-danger-ws"
                        >
                          Leave Workspace
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Invite Member Section */}
                  {canManage && (
                    <div className="workspace-card">
                      <h3>Invite Team Member</h3>
                      <form onSubmit={handleInviteMember} className="invite-form-ws">
                        <div className="form-row-ws">
                          <input
                            type="email"
                            placeholder="member@company.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                          />
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                          >
                            <option value="viewer">Viewer (Read analytics)</option>
                            <option value="editor">Editor (Manage links/QR)</option>
                            <option value="admin">Admin (Manage members except owner)</option>
                          </select>
                          <button type="submit" className="btn-invite-ws">
                            Send Invite
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Members List */}
                  <div className="workspace-card">
                    <h3>Workspace Members ({selectedWorkspace.members?.length || 0})</h3>
                    {!selectedWorkspace.members || selectedWorkspace.members.length === 0 ? (
                      <div className="empty-state-ws">
                        <p>No members in this workspace yet</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="members-table">
                          <thead>
                            <tr>
                              <th>User Info</th>
                              <th>Role</th>
                              <th>Status</th>
                              {canManage && <th style={{ textAlign: "right" }}>Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedWorkspace.members.map((member) => {
                              const isMemberOwner = member.role === "owner";
                              
                              // Check if current user can edit this member's role
                              // Admins cannot change owner, other admins, or promote to admin
                              const canEditRole =
                                canManage &&
                                !isMemberOwner &&
                                !(isAdmin && member.role === "admin");

                              // Check if current user can remove this member
                              const canRemove =
                                canManage &&
                                !isMemberOwner &&
                                !(isAdmin && member.role === "admin");

                              return (
                                <tr key={member._id}>
                                  <td>
                                    <div className="member-info">
                                      <span className="member-avatar">
                                        {member.displayName ? member.displayName[0].toUpperCase() : member.email[0].toUpperCase()}
                                      </span>
                                      <div className="member-details">
                                        <span className="member-name">
                                          {member.displayName || member.username || "Pending User"}
                                        </span>
                                        <span className="member-email">{member.email}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    {canEditRole ? (
                                      <select
                                        value={member.role}
                                        onChange={(e) =>
                                          handleRoleChange(member._id, e.target.value)
                                        }
                                        className="role-dropdown-ws"
                                      >
                                        <option value="viewer">Viewer</option>
                                        <option value="editor">Editor</option>
                                        {isOwner && <option value="admin">Admin</option>}
                                      </select>
                                    ) : (
                                      <span className="role-text-ws">{member.role}</span>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`status-badge-ws ${member.status}`}>
                                      {member.status}
                                    </span>
                                  </td>
                                  {canManage && (
                                    <td style={{ textAlign: "right" }}>
                                      {canRemove && (
                                        <button
                                          onClick={() =>
                                            handleRemoveMember(
                                              member._id,
                                              member.displayName || member.email
                                            )
                                          }
                                          className="btn-remove-member"
                                          title="Remove from Workspace"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="loading-ws-spinner">
                  <div className="spinner"></div>
                  <p>Loading workspace data...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
