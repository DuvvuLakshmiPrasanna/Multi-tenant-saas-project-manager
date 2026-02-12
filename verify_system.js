const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const log = (msg, type = 'info') => {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
    console.log(`${icons[type]} ${msg}`);
};

async function runTests() {
    log('Starting System Verification...', 'info');

    let superAdminToken = '';
    let tenantAdminToken = '';
    let userToken = '';
    let tenantId = '';
    let projectId = '';
    let taskId = '';

    // 1. Test Login - Super Admin
    try {
        log('Testing Super Admin Login...', 'info');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'superadmin@system.com',
            password: 'Admin@123'
        });
        if (res.data.success) {
            superAdminToken = res.data.data.token;
            log('Super Admin Login Successful', 'success');
        } else {
            throw new Error(res.data.message);
        }
    } catch (err) {
        log(`Super Admin Login Failed: ${err.message}`, 'error');
        if (err.response) console.log(err.response.data);
        return; // Stop if super admin can't login (critical)
    }

    // 2. Test Login - Tenant Admin (Demo Company)
    try {
        log('Testing Tenant Admin Login...', 'info');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@demo.com',
            password: 'Demo@123',
            tenantSubdomain: 'demo'
        });
        if (res.data.success) {
            tenantAdminToken = res.data.data.token;
            tenantId = res.data.data.user.tenantId;
            log('Tenant Admin Login Successful', 'success');
        }
    } catch (err) {
        log(`Tenant Admin Login Failed: ${err.message}`, 'error');
    }

    // 3. Test Login - Regular User (Demo Company)
    try {
        log('Testing Regular User Login...', 'info');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'user1@demo.com',
            password: 'User@123',
            tenantSubdomain: 'demo'
        });
        if (res.data.success) {
            userToken = res.data.data.token;
            log('Regular User Login Successful', 'success');
        }
    } catch (err) {
        log(`Regular User Login Failed: ${err.message}`, 'error');
    }

    // 4. Create Project (as Tenant Admin)
    if (tenantAdminToken) {
        try {
            log('Testing Create Project...', 'info');
            const res = await axios.post(`${API_URL}/projects`, {
                name: "Integration Test Project",
                description: "Created by automated test script"
            }, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success) {
                projectId = res.data.data.id;
                log('Create Project Passed', 'success');
            }
        } catch (err) {
            log(`Create Project Failed: ${err.message}`, 'error');
            if (err.response) console.log(err.response.data);
        }
    }

    // 5. Create Task (as Tenant Admin)
    if (tenantAdminToken && projectId) {
        try {
            log('Testing Create Task...', 'info');
            const res = await axios.post(`${API_URL}/projects/${projectId}/tasks`, {
                title: "Test Task 1",
                description: "Testing task creation",
                priority: "high",
                dueDate: "2026-12-31"
            }, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success) {
                taskId = res.data.data.id;
                log('Create Task Passed', 'success');
            }
        } catch (err) {
            log(`Create Task Failed: ${err.message}`, 'error');
        }
    }

    // 6. List Projects (as User)
    if (userToken) {
        try {
            log('Testing List Projects (User)...', 'info');
            const res = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            if (res.data.success && Array.isArray(res.data.data.projects)) {
                log(`List Projects Passed (Found ${res.data.data.projects.length})`, 'success');
            }
        } catch (err) {
            log(`List Projects Failed: ${err.message}`, 'error');
        }
    }

    // 7. Test Tenant Isolation (Cross-Tenant Access)
    // We need another tenant for this. Let's register one.
    let maliciousToken = '';
    try {
        log('Registering Malicious Tenant...', 'info');
        const res = await axios.post(`${API_URL}/auth/register-tenant`, {
            tenantName: "Evil Corp",
            subdomain: "evil",
            adminEmail: "admin@evil.com",
            adminPassword: "EvilPass@123",
            adminFullName: "Dr. Evil"
        });
        if (res.data.success) {
            // Login as evil admin
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: "admin@evil.com",
                password: "EvilPass@123",
                tenantSubdomain: "evil"
            });
            maliciousToken = loginRes.data.data.token;
            log('Malicious Tenant Registered & Logged In', 'success');
        }
    } catch (err) {
        log(`Malicious Tenant Registration Failed: ${err.message}`, 'warn');
    }

    if (maliciousToken && projectId) {
        try {
            log('Testing Isolation: Accessing Demo Project as Evil Tenant...', 'info');
            await axios.get(`${API_URL}/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${maliciousToken}` }
            });
            log('Isolation FAILED! Evil tenant accessed demo project!', 'error');
        } catch (err) {
            if (err.response && (err.response.status === 404 || err.response.status === 403)) {
                log('Isolation Verified (Access Denied/Not Found)', 'success');
            } else {
                log(`Isolation Test Unexpected Error: ${err.message}`, 'warn');
            }
        }
    }

    log('Verification Complete.', 'info');
}

runTests();
