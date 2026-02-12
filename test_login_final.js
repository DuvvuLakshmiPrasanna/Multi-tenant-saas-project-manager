const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth/login';

async function testLogin(email, password, subdomain, roleName) {
    try {
        console.log(`Testing login for ${roleName}...`);
        const payload = { email, password };
        if (subdomain) payload.tenantSubdomain = subdomain;

        const res = await axios.post(API_URL, payload);
        if (res.data.success) {
            console.log(`✅ ${roleName} Login Successful! Token received.`);
        } else {
            console.log(`❌ ${roleName} Login Failed:`, res.data.message);
        }
    } catch (err) {
        console.log(`❌ ${roleName} Login Error:`, err.response ? err.response.data : err.message);
    }
}

async function runTests() {
    await testLogin('superadmin@system.com', 'Admin@123', null, 'Super Admin');
    await testLogin('admin@demo.com', 'Demo@123', 'demo', 'Tenant Admin');
}

runTests();
