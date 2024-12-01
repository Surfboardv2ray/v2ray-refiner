// Developed by Surfboardv2ray
// https://github.com/Surfboardv2ray/v2ray-refiner
// Version 1.2.1

export default {
  async fetch(request) {
    return handleRequest(request);
  }
};

async function handleRequest(request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*'); 
  headers.set('Access-Control-Allow-Methods', 'GET, POST');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  if (request.headers.get('Upgrade') === 'websocket') {
    return handleWebSocket(request);
  }

  if (request.method === 'OPTIONS') {
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
    <title>TLS Config Refiner</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 0;
        background: #f5f5f5;
        color: #333;
      }
  
      .container {
        max-width: 800px;
        margin: 40px auto;
        padding: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
  
      h2 {
        text-align: center;
        color: #ff5722;
        font-weight: bold;
      }
  
      label {
        font-size: 16px;
        margin-top: 10px;
        display: block;
        font-weight: 600;
        color: #555;
      }
  
      input, textarea {
        width: 100%;
        padding: 6px;
        margin: 0 0;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 16px;
        background: #f9f9f9;
        transition: all 0.3s;
      }
  
      input:focus, textarea:focus {
        border-color: #ff5722;
        outline: none;
        background: #fff;
        box-shadow: 0 0 5px rgba(255, 87, 34, 0.5);
      }
  
      textarea {
        resize: vertical;
        min-height: 120px;
      }
  
      button {
        padding: 12px 20px;
        margin: 10px 0;
        font-size: 16px;
        color: white;
        background: linear-gradient(145deg, #ff6b3d, #ff5722);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        text-shadow: 0 2px 3px rgba(0, 0, 0, 0.2);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s, box-shadow 0.2s;
      }
  
      button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
      }
  
      button:active {
        transform: translateY(0);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      }
  
      .output-box {
        position: relative;
      }
  
      .copy-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        font-size: 14px;
        background: linear-gradient(145deg, #ff6b3d, #ff5722);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
  
      .copy-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
      }
  
      .copy-btn:active {
        transform: translateY(0);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      }
  
      @media (max-width: 768px) {
        .container {
          margin: 20px;
          padding: 15px;
        }
  
        button, .copy-btn {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>TLS Config Refiner</h2>
      <label for="config">Enter your proxy config (Vmess, Vless, Trojan):</label>
      <textarea id="config" placeholder="vmess://..."></textarea>
      
      <label for="clean-ip">Clean IP Address (Please set your own):</label>
      <input type="text" id="clean-ip" value="162.159.195.189">
  
      <button id="refine-btn">Refine</button>
      
      <h3>Refined Config:</h3>
      <div class="output-box">
        <textarea id="refined-config" readonly></textarea>
        <button class="copy-btn" id="copy-btn">Copy</button>
      </div>
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
  const allowedPorts = ['443', '8443', '2053', '2083', '2087', '2096'];
  if (config.startsWith('vmess://')) {
    return refineVmess(config, cleanIp, workerHost, allowedPorts);
  } else if (config.startsWith('vless://')) {
    return refineVless(config, cleanIp, workerHost, allowedPorts);
  } else if (config.startsWith('trojan://')) {
    return refineTrojan(config, cleanIp, workerHost, allowedPorts);
  } else {
    throw new Error('Invalid config format. Please enter a valid vmess, vless or trojan config with WS+TLS.');
  }
}

function refineVmess(config, cleanIp, workerHost, allowedPorts) {
  const base64Data = config.slice(8); // Remove 'vmess://'
  const decodedString = atob(base64Data); // Decode base64 string
  const decoded = JSON.parse(decodeURIComponent(escape(decodedString))); // Handle non-Latin1 characters

  if (decoded.net !== 'ws') throw new Error('Network must be WS');
  if (decoded.tls !== 'tls') throw new Error('Security must be TLS');
  
  // Check if the input port is allowed
  if (!allowedPorts.includes(String(decoded.port))) {
    throw new Error('Config must use a Cloudflare TLS Port (443, 8443, 2053, 2083, 2087, or 2096) to proceed');
  }

  // Preserve the original `host` and `sni` values before overwriting
  const originalHost = decoded.host || ''; // Original host
  const originalSni = decoded.sni || decoded.host || ''; // Original SNI or fallback to host
  
  // Set the port to 443 regardless of input config
  decoded.port = 443;
  decoded.add = cleanIp; // Set clean IP for "address"
  decoded.host = workerHost; // New worker host
  decoded.sni = workerHost; // New worker SNI

  const originalPath = decoded.path || ''; // Original path
  decoded.path = `/${originalSni}${originalPath}`; // Concatenated path with original SNI

  const newConfig = 'vmess://' + btoa(unescape(encodeURIComponent(JSON.stringify(decoded))));
  return newConfig;
}

function refineVless(config, cleanIp, workerHost, allowedPorts) {
  const url = new URL(config);
  if (url.searchParams.get('type') !== 'ws') throw new Error('Network must be WS');
  if (url.searchParams.get('security') !== 'tls') throw new Error('Security must be TLS');

  // Check if the input port is allowed
  if (!allowedPorts.includes(url.port)) {
    throw new Error('Config must use a Cloudflare TLS Port (443, 8443, 2053, 2083, 2087, or 2096) to proceed');
  }

  // Set the port to 443 regardless of input config
  url.port = 443;
  url.host = cleanIp; // Set clean IP for "address"
  const originalHost = url.searchParams.get('host') || ''; // Original host
  const originalPath = url.searchParams.get('path') || ''; // Original path
  url.searchParams.set('host', workerHost);
  url.searchParams.set('sni', workerHost);
  url.searchParams.set('path', `/${originalHost}${originalPath}`); // Concatenated path

  return url.toString();
}

function refineTrojan(config, cleanIp, workerHost, allowedPorts) {
  const url = new URL(config);
  if (url.searchParams.get('type') !== 'ws') throw new Error('Network must be WS');
  if (url.searchParams.get('security') !== 'tls') throw new Error('Security must be TLS');

  // Check if the input port is allowed
  if (!allowedPorts.includes(url.port)) {
    throw new Error('Config must use a Cloudflare TLS Port (443, 8443, 2053, 2083, 2087, or 2096) to proceed');
  }

  // Set the port to 443 regardless of input config
  url.port = 443;
  url.host = cleanIp; // Set clean IP for "address"
  const originalHost = url.searchParams.get('host') || ''; // Original host
  const originalPath = url.searchParams.get('path') || ''; // Original path
  url.searchParams.set('host', workerHost);
  url.searchParams.set('sni', workerHost);
  url.searchParams.set('path', `/${originalHost}${originalPath}`); // Concatenated path

  return url.toString();
}
