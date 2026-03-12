const axios = require('axios');

const GATEWAY_URL = 'http://localhost:5000/api/v1';

async function test() {
    console.log('--- TESTING API GATEWAY & AUTH SERVICE ---');

    try {
        // 1. Register a Tenant
        console.log('\n1. Registering Tenant...');
        const regRes = await axios.post(`${GATEWAY_URL}/auth/register-tenant`, {
            tenantData: {
                name: 'Test Motors',
                slug: 'test-motors',
                expiryDate: '2027-01-01'
            },
            adminData: {
                fullName: 'Test Admin',
                email: 'admin@testmotors.com',
                phone: '1234567890',
                password: 'password123'
            }
        });
        console.log('✅ Tenant Registered:', regRes.data.message);

        // 2. Login as Tenant Admin
        console.log('\n2. Logging in as Tenant Admin...');
        const loginRes = await axios.post(`${GATEWAY_URL}/auth/login`, {
            email: 'admin@testmotors.com',
            password: 'password123'
        });
        const token = loginRes.data.data.accessToken;
        console.log('✅ Login Successful. Token received.');

        // 3. Get Profile
        console.log('\n3. Fetching Profile...');
        const profileRes = await axios.get(`${GATEWAY_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Profile:', profileRes.data.data.user.fullName, `(${profileRes.data.data.user.role})`);

        // 4. Super Admin Login
        console.log('\n4. Logging in as Super Admin...');
        const superLoginRes = await axios.post(`${GATEWAY_URL}/auth/super-login`, {
            email: 'superadmin@automoto.ai',
            password: 'admin123'
        });
        const superToken = superLoginRes.data.data.accessToken;
        console.log('✅ Super Admin Login Successful.');

        // 5. Fetch Tenants (Super Admin Only)
        console.log('\n5. Fetching Tenants as Super Admin...');
        const tenantsRes = await axios.get(`${GATEWAY_URL}/super/tenants`, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        console.log('✅ Tenants Found:', tenantsRes.data.data.length);

        console.log('\n--- ALL TESTS PASSED ✅ ---');
    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

test();
