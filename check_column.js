
const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/zenzio_db'
});

async function check() {
    await client.connect();
    // Check if delivery_proof_photo column exists in orders table
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_proof_photo';
    `);
    console.log('Column check result:', res.rows);

    if (res.rows.length === 0) {
        console.log('❌ Column delivery_proof_photo MISSING');
    } else {
        console.log('✅ Column delivery_proof_photo EXISTS');
    }

    await client.end();
}
check().catch(console.error);
