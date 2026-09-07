/**
 * Test actual API login for superadmin@fcs.com
 */

async function testApiLogin() {
  try {
    console.log('🔐 Testing API Login for superadmin@fcs.com...\n');

    const apiUrl = 'http://localhost:4000/api/v1/auth/login';
    const credentials = {
      email: 'superadmin@fcs.com',
      password: 'Admin@123',
    };

    console.log('API URL:', apiUrl);
    console.log('Email:', credentials.email);
    console.log('Password: ********\n');

    console.log('📡 Sending request...\n');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('Status:', response.status, response.statusText);

    const data = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESSFUL');
      console.log('Access Token:', data.data?.accessToken?.substring(0, 30) + '...');
      console.log('User Role:', data.data?.user?.role);
      console.log('User Email:', data.data?.user?.email);
      console.log('\n✅ Super Admin can now login at /super-admin');
    } else {
      console.log('\n❌ LOGIN FAILED');
      console.log('Error:', data.message);
    }

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
