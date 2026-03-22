import http from 'http';

const data = JSON.stringify({ email: 'siddharthkarmokari38@gmail.com', password: 'test' });

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers));
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    console.log('BODY_LENGTH:', Buffer.byteLength(body));
    console.log('BODY:', body);
  });
});

req.on('error', e => {
  console.error('REQ_ERROR:', e);
});

req.write(data);
req.end();
