async function run() {
  const data = JSON.stringify({ email: 'siddharthkarmokari38@gmail.com', password: 'test' });
  try {
    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data
    });
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("TEXT_LENGTH_EXACT_IS_THIS:", text.length);
    console.log("TEXT_BODY_EXACT_IS_THIS:", text);
  } catch (err) {
    console.error("FETCH_ERR:", err);
  }
}
run();
