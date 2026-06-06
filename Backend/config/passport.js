const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/users");
const crypto = require("crypto");

// Helper: Handle OAuth signup or login
const handleOAuthUser = async (provider, profile, done) => {
  try {
    const providerId = profile.id;
    
    // Extract Email
    let email = null;
    if (profile.emails && profile.emails.length > 0) {
      email = profile.emails[0].value;
    } else if (profile._json && profile._json.email) {
      email = profile._json.email;
    } else if (profile._json && profile._json.mail) {
      email = profile._json.mail;
    } else if (profile._json && profile._json.userPrincipalName) {
      email = profile._json.userPrincipalName;
    }

    // Extract Display Name
    const displayName = profile.displayName || profile.username || "OAuth User";

    // Extract Avatar
    let avatar = null;
    if (profile.photos && profile.photos.length > 0) {
      avatar = profile.photos[0].value;
    } else if (profile._json && profile._json.avatar_url) {
      avatar = profile._json.avatar_url;
    } else if (profile._json && profile._json.picture) {
      avatar = profile._json.picture;
    }

    // 1. Find user by provider ID in providers array or matching authProvider
    let user = await User.findOne({
      $or: [
        { authProvider: provider, providerId: providerId },
        { "providers.provider": provider, "providers.providerId": providerId }
      ]
    });

    if (user) {
      return done(null, user);
    }

    // 2. If email is available, check for an existing user with that email
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        // Link the provider to this existing account
        if (!user.providers) user.providers = [];
        user.providers.push({ provider, providerId });
        
        // Update user fields if they were empty
        if (!user.displayName) user.displayName = displayName;
        if (!user.avatar) user.avatar = avatar;
        
        await user.save();
        return done(null, user);
      }
    }

    // 3. If no user exists, create a new one
    const fallbackEmail = email ? email.toLowerCase() : `${providerId}@${provider}.shrinkly.local`;
    
    // Generate a unique sparse username
    const baseUsername = email 
      ? email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") 
      : displayName.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    const uniqueUsername = `${baseUsername}_${crypto.randomBytes(3).toString("hex")}`;

    const newUser = new User({
      username: uniqueUsername,
      email: fallbackEmail,
      displayName: displayName,
      avatar: avatar,
      authProvider: provider,
      providerId: providerId,
      emailVerified: true, // OAuth provider emails are trusted/verified
      providers: [{ provider, providerId }]
    });

    await newUser.save();
    done(null, newUser);
  } catch (err) {
    done(err, null);
  }
};

// ─── Google Strategy ──────────────────────────────────────────
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("⚠️ Warning: Google OAuth environment variables are missing. Using placeholder strategy.");
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: "placeholder",
        clientSecret: "placeholder",
        callbackURL: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`,
        proxy: true
      },
      (accessToken, refreshToken, profile, done) => {
        done(new Error("Google OAuth is not configured on the server."), null);
      }
    )
  );
} else {
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`,
        proxy: true
      },
      (accessToken, refreshToken, profile, done) => {
        handleOAuthUser("google", profile, done);
      }
    )
  );
}

// ─── GitHub Strategy ──────────────────────────────────────────
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.warn("⚠️ Warning: GitHub OAuth environment variables are missing. Using placeholder strategy.");
  passport.use(
    "github",
    new GitHubStrategy(
      {
        clientID: "placeholder",
        clientSecret: "placeholder",
        callbackURL: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/github/callback`,
        proxy: true
      },
      (accessToken, refreshToken, profile, done) => {
        done(new Error("GitHub OAuth is not configured on the server."), null);
      }
    )
  );
} else {
  passport.use(
    "github",
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/github/callback`,
        proxy: true,
        scope: ["user:email"]
      },
      (accessToken, refreshToken, profile, done) => {
        handleOAuthUser("github", profile, done);
      }
    )
  );
}

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Log loaded strategies in development
if (process.env.NODE_ENV !== "production") {
  console.log("OAuth strategies loaded: google, github");
}

module.exports = passport;
