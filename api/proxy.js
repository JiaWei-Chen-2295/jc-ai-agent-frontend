export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/proxy/, '') || '';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8525';
  const targetUrl = `${backendUrl}/api${path}`;

  const headers = { ...req.headers };
  delete headers.host;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });

    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
