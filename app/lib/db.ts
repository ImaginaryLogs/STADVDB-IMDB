import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "imdb",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 60000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Add these timeout settings
      acquireTimeout: 60000,
      timeout: 60000,
    });

    // Test connection
    pool.on('connection', (connection) => {
      console.log('✓ New database connection established');
    });

    pool.on('error', (err) => {
      console.error('❌ Database pool error:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.log('🔄 Recreating pool due to connection loss...');
        pool = null;
      }
    });
  }
  return pool;
}

