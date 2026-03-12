const GATEWAY_URL = 'http://localhost:5000/api/v1';

async function test() {
    console.log('--- TESTING API GATEWAY & AUTH SERVICE ---');

    try {
        // 1. Register a Tenant
        console.log('\n1. Registering Tenant...');
        const regRes = await fetch(`${GATEWAY_URL}/auth/register-tenant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
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
            })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(JSON.stringify(regData));
        console.log('✅ Tenant Registered:', regData.message);

        // 2. Login as Tenant Admin
        console.log('\n2. Logging in as Tenant Admin...');
        const loginRes = await fetch(`${GATEWAY_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@testmotors.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
        const token = loginData.data.accessToken;
        console.log('✅ Login Successful. Token received.');

        // 3. Get Profile
        console.log('\n3. Fetching Profile...');
        const profileRes = await fetch(`${GATEWAY_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        if (!profileRes.ok) throw new Error(JSON.stringify(profileData));
        console.log('✅ Profile:', profileData.data.user.fullName, `(${profileData.data.user.role})`);

        // 4. Super Admin Login
        console.log('\n4. Logging in as Super Admin...');
        const superLoginRes = await fetch(`${GATEWAY_URL}/auth/super-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'superadmin@automoto.ai',
                password: 'admin123'
            })
        });
        const superLoginData = await superLoginRes.json();
        if (!superLoginRes.ok) throw new Error(JSON.stringify(superLoginData));
        const superToken = superLoginData.data.accessToken;
        console.log('✅ Super Admin Login Successful.');

        // 5. Fetch Tenants (Super Admin Only)
        console.log('\n5. Fetching Tenants as Super Admin...');
        const tenantsRes = await fetch(`${GATEWAY_URL}/super/tenants`, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        const tenantsData = await tenantsRes.json();
        if (!tenantsRes.ok) throw new Error(JSON.stringify(tenantsData));
        console.log('✅ Tenants Found:', tenantsData.data.length);

        console.log('\n--- ALL TESTS PASSED ✅ ---');
    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error(error.message);
    }
}

test();
