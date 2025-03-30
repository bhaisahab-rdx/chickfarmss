import fetch from 'node-fetch';

async function testLogin() {
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'adminraja',
        password: 'admin8751'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
    } else {
      const errorData = await response.json();
      console.error('Login failed:', errorData);
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();