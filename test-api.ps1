echo "--- TESTING API GATEWAY & AUTH SERVICE ---"

# Use curl.exe to avoid PowerShell's Invoke-WebRequest alias
$CURL = "curl.exe"

# 1. Register a Tenant
echo "1. Registering Tenant..."
$regRes = & $CURL -s -X POST http://localhost:5000/api/v1/auth/register-tenant `
    -H "Content-Type: application/json" `
    -d '{
        "tenantData": {
            "name": "Test Motors",
            "slug": "test-motors",
            "expiryDate": "2027-01-01"
        },
        "adminData": {
            "fullName": "Test Admin",
            "email": "admin@testmotors.com",
            "phone": "1234567890",
            "password": "password123"
        }
    }'
echo $regRes

# 2. Login as Tenant Admin
echo "`n2. Logging in as Tenant Admin..."
$loginRes = & $CURL -s -X POST http://localhost:5000/api/v1/auth/login `
    -H "Content-Type: application/json" `
    -d '{
        "email": "admin@testmotors.com",
        "password": "password123"
    }'
echo $loginRes
try {
    $token = ($loginRes | ConvertFrom-Json).data.accessToken
} catch {
    echo "FALIED TO GET TOKEN"
}

# 3. Get Profile
if ($token) {
    echo "`n3. Fetching Profile..."
    $profileRes = & $CURL -s -X GET http://localhost:5000/api/v1/auth/profile `
        -H "Authorization: Bearer $token"
    echo $profileRes
}

# 4. Super Admin Login
echo "`n4. Logging in as Super Admin..."
$superLoginRes = & $CURL -s -X POST http://localhost:5000/api/v1/auth/super-login `
    -H "Content-Type: application/json" `
    -d '{
        "email": "superadmin@automoto.ai",
        "password": "admin123"
    }'
echo $superLoginRes
try {
    $superToken = ($superLoginRes | ConvertFrom-Json).data.accessToken
} catch {
    echo "FALIED TO GET SUPER TOKEN"
}

# 5. Fetch Tenants (Super Admin Only)
if ($superToken) {
    echo "`n5. Fetching Tenants as Super Admin..."
    $tenantsRes = & $CURL -s -X GET http://localhost:5000/api/v1/super/tenants `
        -H "Authorization: Bearer $superToken"
    echo $tenantsRes
}

echo "`n--- TESTS COMPLETED ---"
