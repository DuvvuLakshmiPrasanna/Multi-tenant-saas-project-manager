const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Color output helpers
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = (msg, type = 'info') => {
    const icons = { 
        info: `${colors.cyan}ℹ️`,
        success: `${colors.green}✅`, 
        error: `${colors.red}❌`, 
        warn: `${colors.yellow}⚠️`,
        title: `${colors.blue}📋`
    };
    console.log(`${icons[type]} ${msg}${colors.reset}`);
};

const section = (title) => {
    console.log('\n' + '='.repeat(60));
    log(title, 'title');
    console.log('='.repeat(60) + '\n');
};

async function runTests() {
    let superAdminToken = '';
    let tenantAdminToken = '';
    let userToken = '';
    let demoTenantId = '';
    let projectId = '';
    let taskId = '';
    let userId = '';

    // ===========================
    // 1. AUTHENTICATION TESTS
    // ===========================
    section('AUTHENTICATION TESTS');

    // Test 1: Super Admin Login
    try {
        log('Testing Super Admin Login...', 'info');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'superadmin@system.com',
            password: 'Admin@123'
        });
        if (res.data.success) {
            superAdminToken = res.data.data.token;
            log('Super Admin Login: PASS', 'success');
        }
    } catch (err) {
        log(`Super Admin Login: FAIL - ${err.message}`, 'error');
    }

    // Test 2: Tenant Admin Login (Demo Company)
    try {
        log('Testing Tenant Admin Login (demo)...', 'info');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@demo.com',
            password: 'Demo@123',
            tenantSubdomain: 'demo'
        });
        if (res.data.success) {
            tenantAdminToken = res.data.data.token;
            demoTenantId = res.data.data.user.tenantId;
            log('Tenant Admin Login: PASS', 'success');
        }
    } catch (err) {
        log(`Tenant Admin Login: FAIL - ${err.message}`, 'error');
    }

    // Test 3: Regular User Login (Demo Company)
    try {
        log('Testing Regular User Login (demo)...', 'info');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'user1@demo.com',
            password: 'User@123',
            tenantSubdomain: 'demo'
        });
        if (res.data.success) {
            userToken = res.data.data.token;
            log('Regular User Login: PASS', 'success');
        }
    } catch (err) {
        log(`Regular User Login: FAIL - ${err.message}`, 'error');
    }

    // Test 4: Get User Profile (/auth/me)
    try {
        log('Testing Get User Profile...', 'info');
        const res = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${tenantAdminToken}` }
        });
        if (res.data.success && res.data.data.tenant) {
            log('Get User Profile: PASS', 'success');
        }
    } catch (err) {
        log(`Get User Profile: FAIL - ${err.message}`, 'error');
    }

    // ===========================
    // 2. TENANT MANAGEMENT TESTS
    // ===========================
    section('TENANT MANAGEMENT TESTS');

    // Test 5: Register New Tenant
    try {
        log('Testing Tenant Registration...', 'info');
        const res = await axios.post(`${API_URL}/auth/register-tenant`, {
            tenantName: "Test Company",
            subdomain: `test${Date.now()}`,
            adminEmail: `admin${Date.now()}@test.com`,
            adminPassword: "Test@123",
            adminFullName: "Test Admin"
        });
        if (res.data.success) {
            log('Tenant Registration: PASS', 'success');
        }
    } catch (err) {
        log(`Tenant Registration: FAIL - ${err.response?.data?.message || err.message}`, 'error');
    }

    // Test 6: Get Tenant Details
    try {
        log('Testing Get Tenant Details...', 'info');
        const res = await axios.get(`${API_URL}/tenants/${demoTenantId}`, {
            headers: { Authorization: `Bearer ${tenantAdminToken}` }
        });
        if (res.data.success && res.data.data.stats) {
            log(`Get Tenant Details: PASS (${res.data.data.stats.totalUsers} users, ${res.data.data.stats.totalProjects} projects)`, 'success');
        }
    } catch (err) {
        log(`Get Tenant Details: FAIL - ${err.message}`, 'error');
    }

    // Test 7: List All Tenants (Super Admin)
    try {
        log('Testing List All Tenants (Super Admin)...', 'info');
        const res = await axios.get(`${API_URL}/tenants`, {
            headers: { Authorization: `Bearer ${superAdminToken}` }
        });
        if (res.data.success && Array.isArray(res.data.data.tenants)) {
            log(`List All Tenants: PASS (${res.data.data.tenants.length} tenants)`, 'success');
        }
    } catch (err) {
        log(`List All Tenants: FAIL - ${err.message}`, 'error');
    }

    // ===========================
    // 3. USER MANAGEMENT TESTS
    // ===========================
    section('USER MANAGEMENT TESTS');

    // Test 8: List Users in Tenant
    try {
        log('Testing List Users...', 'info');
        const res = await axios.get(`${API_URL}/tenants/${demoTenantId}/users`, {
            headers: { Authorization: `Bearer ${tenantAdminToken}` }
        });
        if (res.data.success && Array.isArray(res.data.data.users)) {
            log(`List Users: PASS (${res.data.data.users.length} users)`, 'success');
        }
    } catch (err) {
        log(`List Users: FAIL - ${err.message}`, 'error');
    }

    // Test 9: Create New User
    try {
        log('Testing Create User...', 'info');
        const res = await axios.post(`${API_URL}/tenants/${demoTenantId}/users`, {
            email: `testuser${Date.now()}@demo.com`,
            password: 'Test@123',
            fullName: 'Test User',
            role: 'user'
        }, {
            headers: { Authorization: `Bearer ${tenantAdminToken}` }
        });
        if (res.data.success) {
            userId = res.data.data.id;
            log('Create User: PASS', 'success');
        }
    } catch (err) {
        log(`Create User: FAIL - ${err.response?.data?.message || err.message}`, 'error');
    }

    // Test 10: Update User
    if (userId) {
        try {
            log('Testing Update User...', 'info');
            const res = await axios.put(`${API_URL}/users/${userId}`, {
                fullName: 'Updated Test User'
            }, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success) {
                log('Update User: PASS', 'success');
            }
        } catch (err) {
            log(`Update User: FAIL - ${err.message}`, 'error');
        }
    }

    // Test 11: Delete User
    if (userId) {
        try {
            log('Testing Delete User...', 'info');
            const res = await axios.delete(`${API_URL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success) {
                log('Delete User: PASS', 'success');
            }
        } catch (err) {
            log(`Delete User: FAIL - ${err.message}`, 'error');
        }
    }

    // ===========================
    // 4. PROJECT MANAGEMENT TESTS
    // ===========================
    section('PROJECT MANAGEMENT TESTS');

    // Test 12: List Projects
    try {
        log('Testing List Projects...', 'info');
        const res = await axios.get(`${API_URL}/projects`, {
            headers: { Authorization: `Bearer ${tenantAdminToken}` }
        });
        if (res.data.success && Array.isArray(res.data.data.projects)) {
            log(`List Projects: PASS (${res.data.data.projects.length} projects)`, 'success');
            if (res.data.data.projects.length > 0) {
                projectId = res.data.data.projects[0].id;
            }
        }
    } catch (err) {
        log(`List Projects: FAIL - ${err.message}`, 'error');
    }

    // Test 13: Create Project
    try {
        log('Testing Create Project...', 'info');
        const res = await axios.post(`${API_URL}/projects`, {
            name: `Test Project ${Date.now()}`,
            description: 'Automated test project',
            status: 'active'
        }, {
            headers: { Authorization: `Bearer ${tenantAdminToken}` }
        });
        if (res.data.success) {
            projectId = res.data.data.id;
            log('Create Project: PASS', 'success');
        }
    } catch (err) {
        log(`Create Project: FAIL - ${err.response?.data?.message || err.message}`, 'error');
    }

    // Test 14: Get Project Details
    if (projectId) {
        try {
            log('Testing Get Project Details...', 'info');
            const res = await axios.get(`${API_URL}/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success) {
                log('Get Project Details: PASS', 'success');
            }
        } catch (err) {
            log(`Get Project Details: FAIL - ${err.message}`, 'error');
        }
    }

    // Test 15: Update Project
    if (projectId) {
        try {
            log('Testing Update Project...', 'info');
            const res = await axios.put(`${API_URL}/projects/${projectId}`, {
                name: 'Updated Test Project',
                status: 'active'
            }, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success) {
                log('Update Project: PASS', 'success');
            }
        } catch (err) {
            log(`Update Project: FAIL - ${err.message}`, 'error');
        }
    }

    // ===========================
    // 5. TASK MANAGEMENT TESTS
    // ===========================
    section('TASK MANAGEMENT TESTS');

    // Test 16: List Tasks in Project
    if (projectId) {
        try {
            log('Testing List Tasks...', 'info');
            const res = await axios.get(`${API_URL}/projects/${projectId}/tasks`, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success && Array.isArray(res.data.data.tasks)) {
                log(`List Tasks: PASS (${res.data.data.tasks.length} tasks)`, 'success');
            }
        } catch (err) {
            log(`List Tasks: FAIL - ${err.message}`, 'error');
        }
    }

    // Test 17: Create Task
    if (projectId) {
        try {
            log('Testing Create Task...', 'info');
            const res = await axios.post(`${API_URL}/projects/${projectId}/tasks`, {
                title: `Test Task ${Date.now()}`,
                description: 'Automated test task',
                priority: 'high',
                status: 'todo',
                dueDate: '2026-12-31'
            }, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success) {
                taskId = res.data.data.id;
                log('Create Task: PASS', 'success');
            }
        } catch (err) {
            log(`Create Task: FAIL - ${err.response?.data?.message || err.message}`, 'error');
        }
    }

    // Test 18: Update Task
    if (taskId) {
        try {
            log('Testing Update Task...', 'info');
            const res = await axios.put(`${API_URL}/tasks/${taskId}`, {
                title: 'Updated Test Task',
                priority: 'medium'
            }, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success) {
                log('Update Task: PASS', 'success');
            }
        } catch (err) {
            log(`Update Task: FAIL - ${err.message}`, 'error');
        }
    }

    // Test 19: Update Task Status
    if (taskId) {
        try {
            log('Testing Update Task Status...', 'info');
            const res = await axios.patch(`${API_URL}/tasks/${taskId}/status`, {
                status: 'in_progress'
            }, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success) {
                log('Update Task Status: PASS', 'success');
            }
        } catch (err) {
            log(`Update Task Status: FAIL - ${err.message}`, 'error');
        }
    }

    // Test 20: Delete Task
    if (taskId) {
        try {
            log('Testing Delete Task...', 'info');
            const res = await axios.delete(`${API_URL}/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${tenantAdminToken}` }
            });
            if (res.data.success) {
                log('Delete Task: PASS', 'success');
            }
        } catch (err) {
            log(`Delete Task: FAIL - ${err.message}`, 'error');
        }
    }

    // ===========================
    // 6. AUTHORIZATION TESTS
    // ===========================
    section('AUTHORIZATION & ISOLATION TESTS');

    // Test 21: Regular User Cannot Create Project
    try {
        log('Testing Regular User Cannot Create Project...', 'info');
        await axios.post(`${API_URL}/projects`, {
            name: 'Unauthorized Project',
            description: 'Should fail'
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        log('Authorization Test: FAIL - User created project (should be forbidden)', 'error');
    } catch (err) {
        if (err.response?.status === 403) {
            log('Authorization Test: PASS - User correctly denied', 'success');
        } else {
            log(`Authorization Test: FAIL - Wrong error: ${err.message}`, 'error');
        }
    }

    // Test 22: Cross-Tenant Isolation
    try {
        log('Testing Cross-Tenant Isolation...', 'info');
        // Create another tenant
        const newTenantRes = await axios.post(`${API_URL}/auth/register-tenant`, {
            tenantName: "Evil Corp",
            subdomain: `evil${Date.now()}`,
            adminEmail: `evil${Date.now()}@test.com`,
            adminPassword: "Evil@123",
            adminFullName: "Evil Admin"
        });

        if (newTenantRes.data.success) {
            // Login as new tenant admin
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: newTenantRes.data.data.adminUser.email,
                password: "Evil@123",
                tenantSubdomain: newTenantRes.data.data.subdomain
            });
            const evilToken = loginRes.data.data.token;

            // Try to access demo project
            if (projectId) {
                try {
                    await axios.get(`${API_URL}/projects/${projectId}`, {
                        headers: { Authorization: `Bearer ${evilToken}` }
                    });
                    log('Isolation Test: FAIL - Cross-tenant access allowed!', 'error');
                } catch (err) {
                    if (err.response?.status === 404 || err.response?.status === 403) {
                        log('Isolation Test: PASS - Cross-tenant access denied', 'success');
                    }
                }
            }
        }
    } catch (err) {
        log(`Isolation Test: ERROR - ${err.message}`, 'warn');
    }

    // Test 23: Super Admin Can Access Any Tenant
    if (demoTenantId) {
        try {
            log('Testing Super Admin Access...', 'info');
            const res = await axios.get(`${API_URL}/tenants/${demoTenantId}`, {
                headers: { Authorization: `Bearer ${superAdminToken}` }
            });
            if (res.data.success) {
                log('Super Admin Access: PASS', 'success');
            }
        } catch (err) {
            log(`Super Admin Access: FAIL - ${err.message}`, 'error');
        }
    }

    // ===========================
    // SUMMARY
    // ===========================
    section('TEST SUMMARY');
    log('All automated tests completed! Check results above.', 'title');
    console.log('\nNext Steps:');
    console.log('1. Log in as Tenant Admin: admin@demo.com / Demo@123 (subdomain: demo)');
    console.log('2. Check Dashboard, Projects, and Team Members pages');
    console.log('3. Create/Edit/Delete projects and tasks');
    console.log('4. Add/Remove team members\n');
}

runTests().catch(err => {
    console.error('Test suite failed:', err);
});
