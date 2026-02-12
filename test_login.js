const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login with:', {
            email: 'admin@demo.com',
            password: 'Demo@123',
            tenantSubdomain: 'demo'
        });

        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@demo.com',
            password: 'Demo@123',
            tenantSubdomain: 'demo'
        });

        console.log('Login Success:', res.data);
    } catch (err) {
        console.error('Login Failed:', err.response ? err.response.data : err.message);
    }
}

testLogin();
