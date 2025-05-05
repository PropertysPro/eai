import mongoose from 'mongoose';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbType = process.env.DB_TYPE || 'mongodb';

// MongoDB connection
const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// PostgreSQL connection
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ella_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

const pgPool = new Pool(pgConfig);

const connectPostgreSQL = async () => {
  try {
    const client = await pgPool.connect();
    console.log(`PostgreSQL Connected: ${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`);
    client.release();
    return pgPool;
  } catch (error) {
    console.error(`Error connecting to PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

// Export the appropriate connection based on DB_TYPE
export const connectDB = async () => {
  if (dbType === 'postgres') {
    return await connectPostgreSQL();
  } else {
    return await connectMongoDB();
  }
};

export const getDB = () => {
  if (dbType === 'postgres') {
    return pgPool;
  } else {
    return mongoose.connection;
  }
};

export default { connectDB, getDB };