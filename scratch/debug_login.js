import axios from 'axios';

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@urbanpulse.pk',
      password: 'admin123'
    });
    console.log('✅ Login Response:', res.data);
  } catch (err) {
    console.error('❌ Login Error:', err.response ? err.response.data : err.message);
  }
}

testLogin();
