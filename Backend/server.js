require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Import routes
const linkRoutes = require("./routes/link");
const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

// Use routes
app.use("/api", linkRoutes);
app.use("/api/auth", authRoutes);

// Redirect route for short links
app.get("/r/:code", async (req, res) => {
  const Link = require("./models/Link");
  try {
    const code = req.params.code;
    const link = await Link.findOne({ shortCode: code });

    if (!link) {
      return res.status(404).send("Link not found");
    }

    if (link.status === "inactive") {
      return res.status(403).send("This link has been deactivated");
    }

    // Track click
    link.clicks += 1;
    await link.save();

    res.redirect(link.originalUrl);
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
