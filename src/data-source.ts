import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { DATABASE_URL, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_SSL } = process.env;

let dbConfig: any = {};

if (DATABASE_URL) {
  const db = new URL(DATABASE_URL);
  dbConfig = {
    host: db.hostname,
    port: parseInt(db.port, 10) || 5432,
    username: db.username,
    password: db.password,
    database: db.pathname.slice(1),
  };
} else {
  dbConfig = {
    host: DB_HOST,
    port: parseInt(DB_PORT || '5432', 10),
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  };
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...dbConfig,
  entities: [path.resolve(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [path.resolve(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false,
  logging: false,
  ssl: DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});
