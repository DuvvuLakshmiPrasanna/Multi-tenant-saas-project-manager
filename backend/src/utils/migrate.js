const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('Connected to database. Checking for migrations...');

        // Create migrations table if not exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Read migration files
        const migrationsDir = path.join(__dirname, '../../migrations');
        const files = fs.readdirSync(migrationsDir).sort();

        for (const file of files) {
            if (file.endsWith('.sql')) {
                const { rows } = await client.query('SELECT * FROM migrations WHERE name = $1', [file]);
                if (rows.length === 0) {
                    console.log(`Running migration: ${file}`);
                    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                    await client.query('BEGIN');
                    await client.query(sql);
                    await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                    console.log(`Migration ${file} completed.`);
                }
            }
        }

        // Run Seeds if needed (check if users empty?)
        // Or just run seeds every time on startup if they handle conflict? 
        // The requirement says "Seed Data MUST load automatically". 
        // I'll create a separate runner or just include it here.
        // The seed file has INSERTs. If run twice, it might fail on constraints. 
        // I should check if seed already ran.

        const seedsDir = path.join(__dirname, '../../seeds');
        if (fs.existsSync(seedsDir)) {
            const seedFiles = fs.readdirSync(seedsDir).sort();
            for (const file of seedFiles) {
                if (file.endsWith('.sql')) {
                    const { rows } = await client.query('SELECT * FROM migrations WHERE name = $1', [file]);
                    if (rows.length === 0) {
                        console.log(`Running seed: ${file}`);
                        const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
                        await client.query('BEGIN');
                        await client.query(sql);
                        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                        await client.query('COMMIT');
                        console.log(`Seed ${file} completed.`);
                    }
                }
            }
        }

    } catch (err) {
        console.error('Migration failed:', err);
        await client.query('ROLLBACK'); // In case error happened during transaction
        process.exit(1);
    } finally {
        client.release();
        // Don't exit process, just release, so the script ends cleanly
        // Do NOT close pool here as it is shared
    }
};

module.exports = { migrate };

if (require.main === module) {
    migrate().then(() => {
        // process.exit(0); // handled in migrate finally
    });
}
