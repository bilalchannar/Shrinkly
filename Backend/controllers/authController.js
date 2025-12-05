const User = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// SIGNUP
exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already registered" });
      }
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ 
      username, 
      email, 
      password: hashedPassword,
      displayName: username 
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ 
      message: "Signup successful", 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        plan: user.plan,
        createdAt: user.createdAt
      },
      token 
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({ 
      message: "Login successful", 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username,
        bio: user.bio,
        phone: user.phone,
        company: user.company,
        location: user.location,
        avatar: user.avatar,
        plan: user.plan,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      },
      token 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET CURRENT USER (validate token)
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username,
        bio: user.bio,
        phone: user.phone,
        company: user.company,
        location: user.location,
        avatar: user.avatar,
        plan: user.plan,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
