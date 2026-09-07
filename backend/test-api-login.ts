/**
 * Test actual API login endpoint
 */

async function testApiLogin() {
  try {
    console.log('🔐 Testing API Login Endpoint...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiUrl = 'http://localhost:4000/api/v1/auth/login';
    const credentials = {
      email: 'adityashastri76@gmail.com',
      password: '12345678',
    };

    console.log('API URL:', apiUrl);
    console.log('Credentials:', {
      email: credentials.email,
      password: '********',
    });

    console.log('\n📡 Sending request...\n');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('\nResponse Body:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESSFUL');
      console.log('Access Token:', data.accessToken?.substring(0, 20) + '...');
      console.log('User Role:', data.user?.role);
      console.log('User Email:', data.user?.email);
    } else {
      console.log('\n❌ LOGIN FAILED');
      console.log('Error:', data.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testApiLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
