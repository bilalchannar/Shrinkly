const Contact = require("../models/Contact");

// Helper: escape HTML to prevent XSS in email templates
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

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
      userId: req.userId || null,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      subject: subject?.trim() || "General Inquiry",
      message: message.trim()
    });

    await contact.save();

    // Send email notification to Admin
    try {
      const sendEmail = require("../utils/sendEmail");
      const adminEmail = process.env.ADMIN_EMAIL || "bilalchannar01@gmail.com";
      const emailSubject = `New Contact Message: ${escapeHtml(subject) || "General Inquiry"}`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6f42c1;">New Contact Submission</h2>
          <p><strong>From:</strong> ${escapeHtml(fullName)} (${escapeHtml(email)})</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone) || "Not provided"}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject) || "General Inquiry"}</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <strong>Message:</strong><br/>
            ${escapeHtml(message).replace(/\n/g, "<br/>")}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p style="font-size: 12px; color: #999;">This is an automated notification from Shrinkly.</p>
        </div>
      `;

      await sendEmail(adminEmail, emailSubject, html);
    } catch (emailErr) {
      console.error("Failed to send contact notification email:", emailErr);
      // Don't fail the request if email fails
    }


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

// Get all contacts (admin, or user's own)
exports.getAllContacts = async (req, res) => {
  try {
    const { status, priority, search, sortBy, page = 1, limit = 20 } = req.query;

    let query = {};

    // If not admin/superadmin, restrict to user's own tickets (by userId or email)
    if (req.userRole !== "admin" && req.userRole !== "superadmin") {
      const User = require("../models/users");
      const userObj = await User.findById(req.userId);
      if (userObj) {
        query.$or = [
          { userId: req.userId },
          { email: userObj.email }
        ];
      } else {
        query.userId = req.userId;
      }
    }

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

// Get single contact by ID (admin or ticket owner)
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

    // Authorization check: only admin/superadmin or the ticket owner can view
    if (req.userRole !== "admin" && req.userRole !== "superadmin") {
      const User = require("../models/users");
      const userObj = await User.findById(req.userId);
      const isOwner = (contact.userId && contact.userId.toString() === req.userId) || 
                      (userObj && contact.email === userObj.email);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You do not own this ticket."
        });
      }
    }

    // Mark as read if it's new (admin only)
    if (contact.status === "new" && (req.userRole === "admin" || req.userRole === "superadmin")) {
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
        try {
          const User = require("../models/users");
          const userObj = await User.findOne({ email: contact.email });
          if (userObj) {
            const { createNotification } = require("../services/notificationService");
            await createNotification(
              userObj._id,
              "success",
              "Support Ticket Replied",
              `Your support request regarding "${contact.subject}" has received a reply.`,
              { contactId: contact._id }
            );
          }
        } catch (err) {
          console.error("Failed to create support reply notification:", err);
        }
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
