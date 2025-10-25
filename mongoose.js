let mongoose=require('mongoose')
require('dotenv').config();

mongoose.connect(process.env.DB)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });