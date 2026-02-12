require('dotenv').config({ path: './.env' });
const { pool } = require('./src/db');

async function debug() {
    try {
        console.log('--- Tenants ---');
        // Show Data
        console.log('--- Tenants ---');
        const tenants = await pool.query('SELECT * FROM tenants');
        console.table(tenants.rows);

        console.log('--- Users ---');
        const users = await pool.query('SELECT id, email, role, tenant_id, password FROM users');
        console.log(JSON.stringify(users.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

debug();
