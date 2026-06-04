const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  createWorkspace,
  getAllWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  updateMemberRole,
  removeMember,
  acceptInvite,
  declineInvite
} = require("../controllers/workspaceController");

// Protect all routes with auth
router.use(auth);

// CRUD routes
router.post("/", createWorkspace);
router.get("/", getAllWorkspaces);
router.get("/:id", getWorkspaceById);
router.patch("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);

// Invitation and membership routes
router.post("/:id/invite", inviteMember);
router.patch("/:id/members/:memberId/role", updateMemberRole);
router.delete("/:id/members/:memberId", removeMember);

// Self invitation response routes
router.post("/:id/accept", acceptInvite);
router.post("/:id/decline", declineInvite);

module.exports = router;
