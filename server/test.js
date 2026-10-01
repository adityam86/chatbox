import http from 'http';

const req = http.request('http://localhost:5000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer fake-token'
  }
}, (res) => {
  console.log('Test 1 - Invalid token status:', res.statusCode);
  if (res.statusCode === 401 || res.statusCode === 403) {
    console.log('✅ REST Authentication test passed');
  } else {
    console.log('❌ REST Authentication test failed');
  }
});

req.on('error', (e) => {
  console.error('Test failed to connect (is server running?):', e.message);
});

req.end();
