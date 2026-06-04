const Workspace = require("../models/Workspace");

/**
 * Helper to get a user's membership and role in a workspace.
 */
const getWorkspaceMember = async (workspaceId, userId) => {
  if (!workspaceId) return null;
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return null;

    if (workspace.ownerId.toString() === userId.toString()) {
      return { workspace, role: "owner", status: "active" };
    }

    const member = workspace.members.find(
      (m) => m.userId && m.userId.toString() === userId.toString()
    );
    if (member) {
      return { workspace, role: member.role, status: member.status };
    }

    return null;
  } catch (error) {
    console.error("Error checking workspace member:", error);
    return null;
  }
};

/**
 * Helper to verify role permission based on hierarchy.
 * owner (4) > admin (3) > editor (2) > viewer (1)
 */
const hasRolePermission = (userRole, requiredRole) => {
  const hierarchy = { owner: 4, admin: 3, editor: 2, viewer: 1 };
  const userVal = hierarchy[userRole] || 0;
  const reqVal = hierarchy[requiredRole] || 0;
  return userVal >= reqVal;
};

/**
 * Middleware to check workspace permission for workspace-specific routes.
 */
const checkWorkspaceRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.id || req.body.workspaceId || req.query.workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ success: false, message: "Workspace ID is required" });
      }

      const memberInfo = await getWorkspaceMember(workspaceId, req.userId);
      if (!memberInfo) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You are not a member of this workspace."
        });
      }

      if (memberInfo.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Your invitation to this workspace is pending."
        });
      }

      if (!hasRolePermission(memberInfo.role, requiredRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Requires ${requiredRole} or higher role.`
        });
      }

      req.workspace = memberInfo.workspace;
      req.workspaceRole = memberInfo.role;
      next();
    } catch (error) {
      console.error("Workspace middleware error:", error);
      return res.status(500).json({ success: false, message: "Server error checking workspace permissions" });
    }
  };
};

module.exports = {
  getWorkspaceMember,
  hasRolePermission,
  checkWorkspaceRole
};
