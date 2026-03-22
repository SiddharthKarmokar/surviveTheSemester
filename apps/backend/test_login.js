const data = JSON.stringify({ email: 'test@test.com', password: 'test' });

fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  body: data
}).then(async (res) => {
  console.log('statusCode:', res.status);
  res.headers.forEach((val, key) => console.log(key, ':', val));
  const text = await res.text();
  console.log('body length:', text.length);
  console.log('body content:', text);
}).catch(console.error);
