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

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const pool = await getPool();
      
      // Get a connection from the pool
      const connection = await pool.getConnection();
      
      try {
        // Set query timeout to 30 seconds
        await connection.query('SET SESSION MAX_EXECUTION_TIME=30000');
        
        const [rows] = await connection.execute(sql, params);
        return rows as T[];
      } finally {
        // Always release the connection back to the pool
        connection.release();
      }
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Query attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      // If connection lost, reset pool and retry
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET') {
        console.log('🔄 Resetting pool and retrying...');
        pool = null;
        
        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }
      
      // If not a connection error, throw immediately
      if (attempt === maxRetries || !['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code)) {
        throw error;
      }
    }
  }
  
  throw lastError;
}

// Optional: Add a function to close the pool gracefully
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✓ Database pool closed');
  }
}
