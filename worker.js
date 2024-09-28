addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Set CORS headers to allow requests from proxies
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*'); // Adjust as needed for security
  headers.set('Access-Control-Allow-Methods', 'GET, POST');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle WebSocket requests
  if (request.headers.get('Upgrade') === 'websocket') {
    return handleWebSocket(request);
  }

  if (request.method === 'OPTIONS') {
    // Respond to preflight requests
    return new Response(null, {
      headers,
    });
  }

  if (request.method === 'GET') {
    return new Response(renderHTML(), {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
  } else if (request.method === 'POST') {
    const formData = await request.formData();
    const config = formData.get('config');
    const cleanIp = formData.get('cleanIp');
    const workerHost = new URL(request.url).hostname;

    try {
      const refinedConfig = await refineConfig(config, cleanIp, workerHost);
      return new Response(JSON.stringify({ refinedConfig }), {
        headers: { 'content-type': 'application/json', ...headers },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'content-type': 'application/json', ...headers },
        status: 400,
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}

async function handleWebSocket(request) {
  const url = new URL(request.url);
  const newUrl = new URL("https://" + url.pathname.replace(/^\/|\/$/g, ""));

  return fetch(new Request(newUrl, request));
}

function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proxy Config Refiner</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    input, textarea { width: 100%; padding: 10px; margin: 10px 0; }
    button { padding: 10px 20px; background-color: #007bff; color: white; border: none; cursor: pointer; }
    button:hover { background-color: #0056b3; }
    textarea { resize: vertical; min-height: 150px; }
    .output-box { position: relative; }
    .copy-btn { position: absolute; right: 10px; top: 10px; background: #007bff; color: white; padding: 5px; cursor: pointer; border: none; font-size: 12px; }
  </style>
</head>
<body>
  <h2>Proxy Config Refiner</h2>
  <label for="config">Enter your proxy config (Vmess, Vless, Trojan):</label>
  <textarea id="config" placeholder="vmess://..."></textarea>
  
  <label for="clean-ip">Clean IP Address:</label>
  <input type="text" id="clean-ip" value="162.159.195.189">

  <button id="refine-btn">Refine</button>
  
  <h3>Refined Config:</h3>
  <div class="output-box">
    <textarea id="refined-config" readonly></textarea>
    <button class="copy-btn" id="copy-btn">Copy</button>
  </div>

  <script>
    document.getElementById('refine-btn').addEventListener('click', async () => {
      const config = document.getElementById('config').value.trim();
      const cleanIp = document.getElementById('clean-ip').value.trim();

      try {
        const response = await fetch(window.location.href, {
          method: 'POST',
          body: new URLSearchParams({ config, cleanIp }),
        });
        
        const result = await response.json();
        if (response.ok) {
          document.getElementById('refined-config').value = result.refinedConfig;
        } else {
          document.getElementById('refined-config').value = result.error;
        }
      } catch (error) {
        document.getElementById('refined-config').value = 'Error: ' + error.message;
      }
    });

    document.getElementById('copy-btn').addEventListener('click', () => {
      const refinedConfig = document.getElementById('refined-config');
      refinedConfig.select();
      document.execCommand('copy');
      alert('Config copied to clipboard');
    });
  </script>
</body>
</html>
  `;
}

async function refineConfig(config, cleanIp, workerHost) {
  if (config.startsWith('vmess://')) {
    return refineVmess(config, cleanIp, workerHost);
  } else if (config.startsWith('vless://')) {
    return refineVless(config, cleanIp, workerHost);
  } else if (config.startsWith('trojan://')) {
    return refineTrojan(config, cleanIp, workerHost);
  } else {
    throw new Error('Invalid config format. Please enter a valid vmess, vless or trojan config with WS+TLS and port 443 to proceed');
  }
}

function refineVmess(config, cleanIp, workerHost) {
  const base64Data = config.slice(8); // Remove 'vmess://'
  const decodedString = atob(base64Data); // Decode base64 string
  const decoded = JSON.parse(decodeURIComponent(escape(decodedString))); // Handle non-Latin1 characters

  // Check required fields
  if (decoded.net !== 'ws') throw new Error('Network must be WS');
  if (decoded.tls !== 'tls') throw new Error('Security must be TLS');
  if (decoded.port !== '443') throw new Error('Port must be 443');

  // Update fields
  decoded.add = cleanIp; // Set clean IP for "address"
  decoded.host = workerHost;
  decoded.sni = workerHost;
  const originalHost = decoded.host || ''; // Original host
  const originalPath = decoded.path || ''; // Original path
  decoded.path = `/${originalHost}${originalPath}`; // Concatenated path

  // Re-encode to base64 (ensure proper UTF-8 handling)
  const newConfig = 'vmess://' + btoa(unescape(encodeURIComponent(JSON.stringify(decoded))));
  return newConfig;
}

function refineVless(config, cleanIp, workerHost) {
  const url = new URL(config);
  if (url.searchParams.get('type') !== 'ws') throw new Error('Network must be WS');
  if (url.searchParams.get('security') !== 'tls') throw new Error('Security must be TLS');
  if (url.port !== '443' && url.port !== '') throw new Error('Port must be 443'); // Accept empty port (default 443)

  // Update fields
  url.host = cleanIp; // Set clean IP for "address"
  url.port = '443'; // Set port to 443
  const originalHost = url.searchParams.get('host') || ''; // Original host
  const originalPath = url.searchParams.get('path') || ''; // Original path
  url.searchParams.set('host', workerHost);
  url.searchParams.set('sni', workerHost);
  url.searchParams.set('path', `/${originalHost}${originalPath}`); // Concatenated path

  return url.toString();
}

function refineTrojan(config, cleanIp, workerHost) {
  const url = new URL(config);
  if (url.searchParams.get('type') !== 'ws') throw new Error('Network must be WS');
  if (url.searchParams.get('security') !== 'tls') throw new Error('Security must be TLS');
  if (url.port !== '443' && url.port !== '') throw new Error('Port must be 443'); // Accept empty port (default 443)

  // Update fields
  url.host = cleanIp; // Set clean IP for "address"
  url.port = '443'; // Set port to 443
  const originalHost = url.searchParams.get('host') || ''; // Original host
  const originalPath = url.searchParams.get('path') || ''; // Original path
  url.searchParams.set('host', workerHost);
  url.searchParams.set('sni', workerHost);
  url.searchParams.set('path', `/${originalHost}${originalPath}`); // Concatenated path

  return url.toString();
}
