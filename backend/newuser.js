const User = require('./models/user');

async function createAdmin() {
  const admin = new User({
    email: "admin@example.com",
    passwordHash: "$2b$10$qY5vyKxIZUsSGX2kOrAT/u/rP1/bJdq4d4oxAF9AlNP03mfi0z7B2",
    name: "Admin User"
    // role defaults to 'admin'
    // createdAt defaults to Date.now
  });

  await admin.save();
  console.log("Admin created:", admin);
}
