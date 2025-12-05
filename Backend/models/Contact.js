const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true
  },
  phone: { 
    type: String, 
    default: "",
    trim: true
  },
  subject: {
    type: String,
    default: "General Inquiry",
    trim: true
  },
  message: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["new", "read", "replied", "archived"], 
    default: "new" 
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  adminNotes: {
    type: String,
    default: ""
  },
  repliedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Index for faster queries
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });

module.exports = mongoose.model("Contact", contactSchema);
