const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI?.trim() || process.env.MONGODB_LOCAL_URI?.trim();
    if (!uri) {
      throw new Error('MONGODB_URI is not defined. Set MONGODB_URI or MONGODB_LOCAL_URI in your .env file.');
    }

    console.log('📡 Connecting to MongoDB...');
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('   - If you are using Atlas, make sure your current IP is allowed in the Atlas Network Access whitelist.');
    console.error('   - If you want to use a local MongoDB server, add MONGODB_LOCAL_URI=mongodb://127.0.0.1:27017/ResumeCraft to your .env');
    process.exit(1);
  }
};

module.exports = connectDB;
