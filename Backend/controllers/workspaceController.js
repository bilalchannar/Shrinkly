const Workspace = require("../models/Workspace");
const User = require("../models/users");

/**
 * Helper: Find user's role in a workspace.
 */
const getUserRoleInWorkspace = (workspace, userId) => {
  if (workspace.ownerId.toString() === userId.toString()) return "owner";
  const member = workspace.members.find(
    (m) => m.userId && m.userId.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// ======================== CREATE WORKSPACE ========================
exports.createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Workspace name is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const workspace = new Workspace({
      name: name.trim(),
      ownerId: req.userId,
      members: [
        {
          userId: req.userId,
          email: user.email,
          role: "owner",
          status: "active"
        }
      ]
    });

    await workspace.save();

    return res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      workspace
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET ALL WORKSPACES ========================
exports.getAllWorkspaces = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Auto-link invitations sent to this user's email that don't have userId associated yet
    await Workspace.updateMany(
      { "members.email": user.email, "members.userId": null },
      { $set: { "members.$[elem].userId": req.userId } },
      { arrayFilters: [{ "elem.email": user.email, "elem.userId": null }] }
    );

    // Retrieve all workspaces where user is owner or member
    const workspaces = await Workspace.find({
      $or: [
        { ownerId: req.userId },
        { "members.userId": req.userId }
      ]
    }).populate("ownerId", "username email displayName avatar");

    // Map workspaces to include user's specific role and status
    const formattedWorkspaces = workspaces.map((ws) => {
      const isOwner = ws.ownerId._id.toString() === req.userId.toString();
      let userMember = null;
      
      if (!isOwner) {
        userMember = ws.members.find(
          (m) => m.userId && m.userId.toString() === req.userId.toString()
        );
      }

      return {
        _id: ws._id,
        name: ws.name,
        ownerId: ws.ownerId._id,
        ownerName: ws.ownerId.displayName || ws.ownerId.username,
        ownerEmail: ws.ownerId.email,
        membersCount: ws.members.length,
        members: ws.members,
        role: isOwner ? "owner" : (userMember ? userMember.role : null),
        status: isOwner ? "active" : (userMember ? userMember.status : null),
        createdAt: ws.createdAt,
        updatedAt: ws.updatedAt
      };
    });

    return res.json({
      success: true,
      workspaces: formattedWorkspaces
    });
  } catch (error) {
    console.error("Error getting workspaces:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET WORKSPACE BY ID ========================
exports.getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("ownerId", "username email displayName avatar")
      .populate("members.userId", "username email displayName avatar");

    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    // Check if current user is owner or member
    const isOwner = workspace.ownerId._id.toString() === req.userId.toString();
    const member = workspace.members.find(
      (m) => m.userId && m.userId._id.toString() === req.userId.toString()
    );

    if (!isOwner && !member) {
      return res.status(403).json({ success: false, message: "Access denied. Not a member of this workspace." });
    }

    return res.json({
      success: true,
      workspace: {
        _id: workspace._id,
        name: workspace.name,
        ownerId: workspace.ownerId._id,
        ownerName: workspace.ownerId.displayName || workspace.ownerId.username,
        ownerEmail: workspace.ownerId.email,
        members: workspace.members.map(m => ({
          _id: m._id,
          userId: m.userId ? m.userId._id : null,
          username: m.userId ? m.userId.username : null,
          displayName: m.userId ? (m.userId.displayName || m.userId.username) : null,
          email: m.email,
          role: m.role,
          status: m.status
        })),
        role: isOwner ? "owner" : (member ? member.role : null),
        status: isOwner ? "active" : (member ? member.status : null),
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt
      }
    });
  } catch (error) {
    console.error("Error getting workspace by ID:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== UPDATE WORKSPACE ========================
exports.updateWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Workspace name is required" });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    // Check permission: owner or admin can update name
    const userRole = getUserRoleInWorkspace(workspace, req.userId);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Requires owner or admin role." });
    }

    workspace.name = name.trim();
    await workspace.save();

    return res.json({
      success: true,
      message: "Workspace updated successfully",
      workspace
    });
  } catch (error) {
    console.error("Error updating workspace:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== DELETE WORKSPACE ========================
exports.deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    // Check permission: only owner can delete workspace
    if (workspace.ownerId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. Only the owner can delete the workspace." });
    }

    // Delete workspace
    await Workspace.findByIdAndDelete(req.params.id);

    // Optional: Clean up workspace links and QR codes, or set workspaceId to null
    const Link = require("../models/Link");
    const QRCode = require("../models/QRCode");
    await Link.updateMany({ workspaceId: req.params.id }, { $set: { workspaceId: null } });
    await QRCode.updateMany({ workspaceId: req.params.id }, { $set: { workspaceId: null } });

    return res.json({
      success: true,
      message: "Workspace deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== INVITE MEMBER ========================
exports.inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    // Check permission: owner or admin can invite
    const userRole = getUserRoleInWorkspace(workspace, req.userId);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Requires owner or admin role." });
    }

    // Validate role
    const allowedRoles = ["admin", "editor", "viewer"];
    const memberRole = role && allowedRoles.includes(role) ? role : "viewer";

    // Check if already owner
    const isOwner = workspace.members.some(
      (m) => m.role === "owner" && m.email === cleanEmail
    );
    if (isOwner || workspace.ownerId.toString() === cleanEmail) {
      return res.status(400).json({ success: false, message: "User is the owner of this workspace" });
    }

    // Check if already invited or a member
    const existingMember = workspace.members.find(
      (m) => m.email === cleanEmail
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: existingMember.status === "active"
          ? "User is already a member of this workspace"
          : "User has already been invited to this workspace"
      });
    }

    // Look up if user already exists in Shrinkly database
    const invitee = await User.findOne({ email: cleanEmail });

    workspace.members.push({
      userId: invitee ? invitee._id : null,
      email: cleanEmail,
      role: memberRole,
      status: "invited"
    });

    await workspace.save();

    return res.json({
      success: true,
      message: "Member invited successfully",
      workspace
    });
  } catch (error) {
    console.error("Error inviting member:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== UPDATE MEMBER ROLE ========================
exports.updateMemberRole = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    const allowedRoles = ["admin", "editor", "viewer"];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    // Get current user's role
    const currentUserRole = getUserRoleInWorkspace(workspace, req.userId);
    if (currentUserRole !== "owner" && currentUserRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Requires owner or admin role." });
    }

    // Find member to update
    const member = workspace.members.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    // Prevent changing owner role
    if (member.role === "owner") {
      return res.status(400).json({ success: false, message: "Cannot change the role of the owner" });
    }

    // Admins cannot modify other admins or make someone owner
    if (currentUserRole === "admin") {
      if (member.role === "admin") {
        return res.status(403).json({ success: false, message: "Admins cannot modify role of other admins" });
      }
      if (role === "admin") {
        return res.status(403).json({ success: false, message: "Admins cannot promote members to admin role" });
      }
    }

    member.role = role;
    await workspace.save();

    return res.json({
      success: true,
      message: "Member role updated successfully",
      workspace
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== REMOVE MEMBER ========================
exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    // Get current user's role
    const currentUserRole = getUserRoleInWorkspace(workspace, req.userId);
    const member = workspace.members.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    // Check if the member is leaving on their own
    const isSelfLeaving = member.userId && member.userId.toString() === req.userId.toString();

    if (!isSelfLeaving) {
      // Must be owner or admin to kick
      if (currentUserRole !== "owner" && currentUserRole !== "admin") {
        return res.status(403).json({ success: false, message: "Access denied. Requires owner or admin role." });
      }

      // Admins cannot remove the owner
      if (member.role === "owner") {
        return res.status(403).json({ success: false, message: "Cannot remove the owner" });
      }

      // Admins cannot remove other admins
      if (currentUserRole === "admin" && member.role === "admin") {
        return res.status(403).json({ success: false, message: "Admins cannot remove other admins" });
      }
    } else {
      // User is leaving. Owners cannot leave their own workspace.
      if (member.role === "owner" || workspace.ownerId.toString() === req.userId.toString()) {
        return res.status(400).json({ success: false, message: "Owners cannot leave their own workspace. Delete it instead." });
      }
    }

    // Remove the member
    workspace.members.pull(memberId);
    await workspace.save();

    return res.json({
      success: true,
      message: isSelfLeaving ? "Left workspace successfully" : "Member removed successfully",
      workspace
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== ACCEPT INVITATION ========================
exports.acceptInvite = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    // Find user in members
    const member = workspace.members.find(
      (m) => m.userId && m.userId.toString() === req.userId.toString()
    );

    if (!member) {
      return res.status(404).json({ success: false, message: "Invitation not found for this user" });
    }

    if (member.status === "active") {
      return res.status(400).json({ success: false, message: "Invitation already accepted" });
    }

    member.status = "active";
    await workspace.save();

    return res.json({
      success: true,
      message: "Invitation accepted successfully",
      workspace
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== DECLINE INVITATION ========================
exports.declineInvite = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    // Find member by userId
    const memberIndex = workspace.members.findIndex(
      (m) => m.userId && m.userId.toString() === req.userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    // Remove member
    workspace.members.splice(memberIndex, 1);
    await workspace.save();

    return res.json({
      success: true,
      message: "Invitation declined successfully"
    });
  } catch (error) {
    console.error("Error declining invitation:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
