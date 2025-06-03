import fetch from 'node-fetch';

async function testServer() {
  try {
    const response = await fetch('http://localhost:5000/api/test');
    const data = await response.json();
    console.log('Server test response:', data);
    return true;
  } catch (error) {
    console.error('Server test failed:', error.message);
    return false;
  }
}

testServer(); 