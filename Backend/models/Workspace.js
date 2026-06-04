const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    members: [
      {
        userId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "User",
          default: null 
        },
        email: { 
          type: String, 
          required: true,
          trim: true,
          lowercase: true
        },
        role: { 
          type: String, 
          enum: ["owner", "admin", "editor", "viewer"], 
          default: "viewer" 
        },
        status: { 
          type: String, 
          enum: ["invited", "active"], 
          default: "invited" 
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);
