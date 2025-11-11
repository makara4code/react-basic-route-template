/**
 * Quick test script to verify login endpoint
 * Run: node server/test-login.js
 */

async function testLogin() {
  console.log('🧪 Testing login endpoint...\n');

  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'soknay@example.com',
        password: '123456789',
      }),
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });

    const data = await response.json();
    console.log('\n📦 Response Body:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.user) {
      console.log('\n✅ SUCCESS! User data received:');
      console.log(`   - ID: ${data.user.id}`);
      console.log(`   - Email: ${data.user.email}`);
      console.log(`   - First Name: ${data.user.first_name}`);
      console.log(`   - Last Name: ${data.user.last_name}`);
    } else if (data.success && !data.user) {
      console.log('\n⚠️  WARNING: Login successful but no user data!');
    } else {
      console.log('\n❌ FAILED:', data.error);
    }

    // Check for cookies
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      console.log('\n🍪 Cookies Set:');
      const cookieArray = cookies.split(',').map(c => c.trim());
      cookieArray.forEach(cookie => {
        const name = cookie.split('=')[0];
        const hasHttpOnly = cookie.includes('HttpOnly');
        const hasSameSite = cookie.includes('SameSite');
        console.log(`   - ${name} ${hasHttpOnly ? '[HttpOnly]' : ''} ${hasSameSite ? '[SameSite]' : ''}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();

