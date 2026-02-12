const fs = require('fs');
const path = require('path');
const { pool } = require('../db');
const bcrypt = require('bcrypt');

const { migrate } = require('./migrate');

async function runMigrations() {
    console.log('Running migrations via migrate module...');
    await migrate();
}

async function seedData() {
    console.log('Seeding data...');
    const client = await pool.connect();

    try {
        // Read submission.json for credentials
        const submissionPath = path.join(__dirname, '../../../submission.json');

        if (!fs.existsSync(submissionPath)) {
            console.warn('submission.json not found, skipping specific seed data');
            return;
        }

        const submissionData = JSON.parse(fs.readFileSync(submissionPath, 'utf8'));
        const creds = submissionData.testCredentials;

        await client.query('BEGIN');

        // 1. Seed Super Admin
        if (creds.superAdmin) {
            const checkSuper = await client.query('SELECT * FROM users WHERE email = $1', [creds.superAdmin.email]);
            if (checkSuper.rows.length === 0) {
                console.log('Hashing Super Admin Password:', creds.superAdmin.password);
                const hashedPassword = await bcrypt.hash(creds.superAdmin.password, 10);
                await client.query(`
                    INSERT INTO users (email, password, full_name, role, is_active)
                    VALUES ($1, $2, $3, $4, true)
                `, [creds.superAdmin.email, hashedPassword, 'Super Admin', creds.superAdmin.role]);
                console.log('Super Admin seeded');
            }
        }

        // 2. Seed Tenants and their data
        if (creds.tenants && Array.isArray(creds.tenants)) {
            for (const tenantData of creds.tenants) {
                // Check if tenant exists
                let tenantId;
                const checkTenant = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [tenantData.subdomain]);

                if (checkTenant.rows.length > 0) {
                    tenantId = checkTenant.rows[0].id;
                } else {
                    const tenantRes = await client.query(`
                        INSERT INTO tenants (name, subdomain, status, plan)
                        VALUES ($1, $2, $3, $4)
                        RETURNING id
                    `, [tenantData.name, tenantData.subdomain, tenantData.status, tenantData.subscriptionPlan]);
                    tenantId = tenantRes.rows[0].id;
                    console.log(`Tenant ${tenantData.name} seeded`);
                }

                // Seed Tenant Admin
                if (tenantData.admin) {
                    const checkAdmin = await client.query('SELECT * FROM users WHERE email = $1', [tenantData.admin.email]);
                    if (checkAdmin.rows.length === 0) {
                        const hashedAdminPass = await bcrypt.hash(tenantData.admin.password, 10);
                        await client.query(`
                            INSERT INTO users (tenant_id, email, password, full_name, role, is_active)
                            VALUES ($1, $2, $3, $4, $5, true)
                        `, [tenantId, tenantData.admin.email, hashedAdminPass, 'Tenant Admin', tenantData.admin.role]);
                        console.log(`Admin for ${tenantData.name} seeded`);
                    }
                }

                // Seed Users
                if (tenantData.users && Array.isArray(tenantData.users)) {
                    for (const user of tenantData.users) {
                        const checkUser = await client.query('SELECT * FROM users WHERE email = $1', [user.email]);
                        if (checkUser.rows.length === 0) {
                            const hashedUserPass = await bcrypt.hash(user.password, 10);
                            await client.query(`
                                    INSERT INTO users (tenant_id, email, password, full_name, role, is_active)
                                VALUES ($1, $2, $3, $4, $5, true)
                            `, [tenantId, user.email, hashedUserPass, 'Regular User', user.role]);
                            console.log(`User ${user.email} seeded`);
                        }
                    }
                }

                // Seed Projects
                if (tenantData.projects && Array.isArray(tenantData.projects)) {
                    // Get a user to be the creator (e.g., the admin)
                    const creatorRes = await client.query('SELECT id FROM users WHERE email = $1', [tenantData.admin.email]);
                    const creatorId = creatorRes.rows[0]?.id;

                    if (creatorId) {
                        for (const proj of tenantData.projects) {
                            const checkProj = await client.query('SELECT * FROM projects WHERE name = $1 AND tenant_id = $2', [proj.name, tenantId]);

                            if (checkProj.rows.length === 0) {
                                const projRes = await client.query(`
                                    INSERT INTO projects (tenant_id, name, description, status, created_by)
                                    VALUES ($1, $2, $3, 'active', $4)
                                    RETURNING id
                                 `, [tenantId, proj.name, proj.description, creatorId]);
                                console.log(`Project ${proj.name} seeded`);

                                // Seed a task for each project
                                await client.query(`
                                    INSERT INTO tasks (project_id, title, description, status, priority)
                                    VALUES ($1, 'Initial Task', 'This is an auto-generated task', 'todo', 'medium')
                                 `, [projRes.rows[0].id]);
                            }
                        }
                    }
                }
            }
        }

        await client.query('COMMIT');
        console.log('Seeding completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Seeding failed:', error);
        // Don't throw error here to allow server to start even if seeding has issues (e.g. duplicates handled above)
    } finally {
        client.release();
    }
}

async function initDb() {
    await runMigrations();
    await seedData();
}

module.exports = { initDb };
