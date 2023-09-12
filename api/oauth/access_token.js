async function toJSON(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];

  async function read() {
    const { done, value } = await reader.read();
    if (done) {
      return JSON.parse(chunks.join(''));
    }

    const chunk = decoder.decode(value, { stream: true });
    chunks.push(chunk);
    return read();
  }

  return read();
}

async function allowCors(fn) {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    );
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    console.log('allowCors req', req);
    return await fn(req, res);
  };
}

async function handler(request) {
  console.log('handler request', request);
  const requestBodyJson = await toJSON(request.body);
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      body: JSON.stringify({
        code: requestBodyJson.code,
        client_id: requestBodyJson.client_id,
        client_secret: process.env.VITE_GITSTARS_CLIENT_SECRET,
      }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data));
  } catch (e) {
    console.error(e);
    return new Response(e.message);
  }
}

export default allowCors(handler);
