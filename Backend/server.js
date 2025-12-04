require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

const ShortUrl = mongoose.model(
  "ShortUrl",
  new mongoose.Schema({
    original: String,
    short: String
  })
);

app.post("/api/shorten", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Valid URL is required" });
    }

    const trimmedUrl = url.trim();

    // Validate URL format
    try {
      new URL(trimmedUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const random = Math.random().toString(36).substring(2, 8);
    const short = "shr.ly/" + random;

    const data = await ShortUrl.create({
      original: trimmedUrl,
      short: short
    });

    res.json({
      success: true,
      original: data.original,
      short: data.short,
      _id: data._id
    });
  } catch (error) {
    console.error("Error shortening URL:", error);
    res.status(500).json({ error: "Failed to create short link" });
  }
});

app.get("/:code", async (req, res) => {
  const code = req.params.code;
  const item = await ShortUrl.findOne({ short: "shr.ly/" + code });

  if (!item) {
    return res.status(404).send("Not found");
  }

  res.redirect(item.original);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
