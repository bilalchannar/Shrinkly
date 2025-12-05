const Contact = require("../models/Contact");

// Submit contact form (public)
exports.submitContact = async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    // Validation
    if (!fullName || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "Full name, email, and message are required" 
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    const contact = new Contact({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      subject: subject?.trim() || "General Inquiry",
      message: message.trim()
    });

    await contact.save();

    return res.status(201).json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
      contactId: contact._id
    });
  } catch (error) {
    console.error("Error submitting contact:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error. Please try again later." 
    });
  }
};

// Get all contacts (admin only)
exports.getAllContacts = async (req, res) => {
  try {
    const { status, priority, search, sortBy, page = 1, limit = 20 } = req.query;

    let query = {};

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== "all") {
      query.priority = priority;
    }

    // Search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } }
      ];
    }

    // Sort options
    let sortOptions = { createdAt: -1 }; // default: newest first
    if (sortBy === "oldest") sortOptions = { createdAt: 1 };
    if (sortBy === "priority") sortOptions = { priority: -1, createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const contacts = await Contact.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalContacts = await Contact.countDocuments(query);
    const totalPages = Math.ceil(totalContacts / parseInt(limit));

    return res.json({
      success: true,
      contacts: contacts.map(c => ({
        _id: c._id,
        fullName: c.fullName,
        email: c.email,
        phone: c.phone,
        subject: c.subject,
        message: c.message,
        status: c.status,
        priority: c.priority,
        adminNotes: c.adminNotes,
        repliedAt: c.repliedAt,
        createdAt: c.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalContacts,
        hasMore: parseInt(page) < totalPages
      }
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Get single contact by ID (admin only)
exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: "Contact not found" 
      });
    }

    // Mark as read if it's new
    if (contact.status === "new") {
      contact.status = "read";
      await contact.save();
    }

    return res.json({
      success: true,
      contact: {
        _id: contact._id,
        fullName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
        subject: contact.subject,
        message: contact.message,
        status: contact.status,
        priority: contact.priority,
        adminNotes: contact.adminNotes,
        repliedAt: contact.repliedAt,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt
      }
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Update contact status/notes (admin only)
exports.updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, adminNotes } = req.body;

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: "Contact not found" 
      });
    }

    // Update fields if provided
    if (status) {
      contact.status = status;
      if (status === "replied") {
        contact.repliedAt = new Date();
      }
    }
    if (priority) contact.priority = priority;
    if (adminNotes !== undefined) contact.adminNotes = adminNotes;

    await contact.save();

    return res.json({
      success: true,
      message: "Contact updated successfully",
      contact: {
        _id: contact._id,
        fullName: contact.fullName,
        email: contact.email,
        status: contact.status,
        priority: contact.priority,
        adminNotes: contact.adminNotes,
        repliedAt: contact.repliedAt
      }
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Delete contact (admin only)
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: "Contact not found" 
      });
    }

    return res.json({ 
      success: true, 
      message: "Contact deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Get contact statistics (admin only)
exports.getContactStats = async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const newContacts = await Contact.countDocuments({ status: "new" });
    const readContacts = await Contact.countDocuments({ status: "read" });
    const repliedContacts = await Contact.countDocuments({ status: "replied" });
    const archivedContacts = await Contact.countDocuments({ status: "archived" });

    // Get contacts by priority
    const highPriority = await Contact.countDocuments({ priority: "high" });
    const mediumPriority = await Contact.countDocuments({ priority: "medium" });
    const lowPriority = await Contact.countDocuments({ priority: "low" });

    // Get recent contacts
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName email subject status createdAt");

    return res.json({
      success: true,
      stats: {
        total: totalContacts,
        byStatus: {
          new: newContacts,
          read: readContacts,
          replied: repliedContacts,
          archived: archivedContacts
        },
        byPriority: {
          high: highPriority,
          medium: mediumPriority,
          low: lowPriority
        }
      },
      recentContacts
    });
  } catch (error) {
    console.error("Error fetching contact stats:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Bulk update contacts (admin only)
exports.bulkUpdateContacts = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No contact IDs provided" 
      });
    }

    const updateData = { status };
    if (status === "replied") {
      updateData.repliedAt = new Date();
    }

    const result = await Contact.updateMany(
      { _id: { $in: ids } },
      { $set: updateData }
    );

    return res.json({
      success: true,
      message: `${result.modifiedCount} contact(s) updated successfully`
    });
  } catch (error) {
    console.error("Error bulk updating contacts:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Bulk delete contacts (admin only)
exports.bulkDeleteContacts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No contact IDs provided" 
      });
    }

    const result = await Contact.deleteMany({ _id: { $in: ids } });

    return res.json({
      success: true,
      message: `${result.deletedCount} contact(s) deleted successfully`
    });
  } catch (error) {
    console.error("Error bulk deleting contacts:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};
