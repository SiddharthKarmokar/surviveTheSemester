import http from 'http';

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/test-200',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log('STATUS:', res.statusCode);
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    console.log('BODY_LENGTH:', Buffer.byteLength(body));
    console.log('BODY:', body);
  });
});
req.end();
