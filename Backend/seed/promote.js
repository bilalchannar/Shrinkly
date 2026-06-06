require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/users');

async function checkAndConfigure() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not defined");
  }
  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.");

  // Find all users
  const users = await User.find({});
  console.log(`\nFound ${users.length} user(s) in the database:\n`);
  
  users.forEach(u => {
    console.log(`- Username: ${u.username}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Plan: ${u.plan}`);
    console.log(`  Email Verified: ${u.emailVerified}`);
    console.log(`  Suspended: ${u.suspended || false}`);
    console.log('-----------------------------');
  });

  // Promote demo@shrinkly.com to superadmin
  const demoEmail = "demo@shrinkly.com";
  const demoUser = await User.findOne({ email: demoEmail });
  if (demoUser) {
    if (demoUser.role !== 'superadmin') {
      demoUser.role = 'superadmin';
      await demoUser.save();
      console.log(`\n🚀 Promoted ${demoEmail} to "superadmin"!`);
    } else {
      console.log(`\n✅ ${demoEmail} is already a "superadmin".`);
    }
  } else {
    console.log(`\n❌ Demo user ${demoEmail} not found.`);
  }

  // Promote bilalchannar01@gmail.com to superadmin
  const adminEmail = "bilalchannar01@gmail.com";
  const adminUser = await User.findOne({ email: adminEmail });
  if (adminUser) {
    if (adminUser.role !== 'superadmin') {
      adminUser.role = 'superadmin';
      await adminUser.save();
      console.log(`🚀 Promoted ${adminEmail} to "superadmin"!`);
    } else {
      console.log(`✅ ${adminEmail} is already a "superadmin".`);
    }
  } else {
    console.log(`❌ User ${adminEmail} not found.`);
  }

  await mongoose.disconnect();
  console.log("\nDisconnected from database.");
}

checkAndConfigure().catch(err => {
  console.error("Error running script:", err);
  process.exit(1);
});
