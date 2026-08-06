// Test API call to trigger the error
const http = require('http');

// First, login as an employee to get a token
const loginData = JSON.stringify({
  email: 'adityashastri76@gmail.com', // Change to an employee email if needed
  password: 'Admin@123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('🔐 Logging in...');

const loginReq = http.request(loginOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Login response status:', res.statusCode);
    
    if (res.statusCode !== 200 && res.statusCode !== 201) {
      console.log('Login failed:', data);
      return;
    }

    const loginResponse = JSON.parse(data);
    const token = loginResponse.data?.token || loginResponse.token;

    if (!token) {
      console.log('No token in response:', data);
      return;
    }

    console.log('✅ Logged in successfully');
    console.log('Token:', token.substring(0, 20) + '...');

    // Now call the company-policies endpoint
    console.log('\n📋 Calling GET /company-policies/employee/active...');

    const policyOptions = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/company-policies/employee/active',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const policyReq = http.request(policyOptions, (res) => {
      let policyData = '';

      res.on('data', (chunk) => {
        policyData += chunk;
      });

      res.on('end', () => {
        console.log('Policy response status:', res.statusCode);
        console.log('Policy response body:', policyData);

        if (res.statusCode === 500) {
          console.log('\n🔥 HTTP 500 ERROR DETECTED!');
          console.log('Check the backend console for the actual exception.');
        } else if (res.statusCode === 200) {
          console.log('\n✅ API call successful!');
          const parsed = JSON.parse(policyData);
          console.log('Policies returned:', parsed.length || 0);
        }
      });
    });

    policyReq.on('error', (e) => {
      console.error('Policy request error:', e.message);
    });

    policyReq.end();
  });
});

loginReq.on('error', (e) => {
  console.error('Login request error:', e.message);
});

loginReq.write(loginData);
loginReq.end();
