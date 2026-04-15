const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function initGlobalSettings() {
    const dbConfig = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    };

    if (process.env.DATABASE_URL) {
        const dbUrl = new URL(process.env.DATABASE_URL);
        dbConfig.host = dbUrl.hostname;
        dbConfig.port = parseInt(dbUrl.port, 10);
        dbConfig.user = dbUrl.username;
        dbConfig.password = dbUrl.password;
        dbConfig.database = dbUrl.pathname.slice(1);
    }

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('Connected to database');

        // Check if table exists
        const checkTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'global_settings'
            );
        `;
        const res = await client.query(checkTableQuery);
        const exists = res.rows[0].exists;

        if (!exists) {
            console.log('Creating global_settings table...');
            const createTableQuery = `
                CREATE TABLE "global_settings" (
                    "id" SERIAL NOT NULL, 
                    "enableOnlinePayment" boolean NOT NULL DEFAULT true, 
                    "enableCODPayment" boolean NOT NULL DEFAULT true, 
                    CONSTRAINT "PK_global_settings_id" PRIMARY KEY ("id")
                );
            `;
            await client.query(createTableQuery);
            console.log('Table global_settings created.');

            // Insert default row
            const insertDefaultQuery = `
                INSERT INTO "global_settings" ("enableOnlinePayment", "enableCODPayment") 
                VALUES (true, true);
            `;
            await client.query(insertDefaultQuery);
            console.log('Default global settings inserted.');
        } else {
            console.log('global_settings table already exists.');
        }

    } catch (err) {
        console.error('Error initializing global settings:', err);
    } finally {
        await client.end();
    }
}

initGlobalSettings();
