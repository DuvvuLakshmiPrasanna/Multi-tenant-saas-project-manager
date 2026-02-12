const axios = require('axios');

async function testCors() {
    try {
        console.log('Testing CORS for Origin: http://localhost:3000...');
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@demo.com',
            password: 'Demo@123',
            tenantSubdomain: 'demo'
        }, {
            headers: {
                'Origin': 'http://localhost:3000'
            }
        });

        console.log('✅ Request Successful (200 OK)');
        console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);

        if (res.headers['access-control-allow-origin'] === 'http://localhost:3000') {
            console.log('✅ CORS Header verification PASSED');
        } else {
            console.log('❌ CORS Header verification FAILED: Value is', res.headers['access-control-allow-origin']);
        }

    } catch (err) {
        console.log('❌ Request Failed:', err.message);
        if (err.response) {
            console.log('Status:', err.response.status);
            console.log('Data:', err.response.data);
            console.log('Access-Control-Allow-Origin:', err.response.headers['access-control-allow-origin']);
        }
    }
}

testCors();
