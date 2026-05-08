import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urbanpulse';
    
    // Improved connection options for stability
    const options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(uri, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB Connection Event Error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB Disconnected. Attempting to reconnect...');
    });

  } catch (error) {
    console.error(`❌ MongoDB Startup Error: ${error.message}`);
    // Only exit on initial startup failure if desired, or keep retrying
    // process.exit(1); 
  }
};

export default connectDB;
