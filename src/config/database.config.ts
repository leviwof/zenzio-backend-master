import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export default registerAs('database', (): DatabaseConfig => {
  const { DATABASE_URL, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;

  if (DATABASE_URL) {
    // Parse DATABASE_URL
    const db = new URL(DATABASE_URL);

    return {
      host: db.hostname,
      port: parseInt(db.port, 10) || 5432, // default Postgres port fallback
      username: db.username,
      password: db.password,
      database: db.pathname.slice(1), // remove leading '/'
    };
  }

  // Fall back to individual vars
  if (!DB_HOST || !DB_PORT || !DB_USERNAME || !DB_PASSWORD || !DB_NAME) {
    throw new Error('❌ Missing required environment variables for database');
  }

  return {
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  };
});
