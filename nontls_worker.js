// Developed by Surfboardv2ray
// https://github.com/Surfboardv2ray/v2ray-refiner
// Version 1.2.1
// Change 'url.port' and 'const workerport' value if your config uses another port. Only one port will work at a time.

export default {
  async fetch(request) {
    let url = new URL(request.url);

    if (url.pathname === '/' && request.method === 'GET') {
      // Serve the HTML page at the root URL for GET request
      return handleRequest();
    } else if (url.pathname === '/' && request.method === 'POST') {
      // Handle POST request to process the config refinement
      const { config, hostname, cleanIp } = await request.json();

      const refinedConfig = refineConfig({ config, hostname, cleanIp }, url);
      return new Response(JSON.stringify({ refinedConfig }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (url.pathname === '/sub' && request.method === 'GET') {
      const hostname = 'abc.myvnc.com'; // custom domain
      const config = `abc`; //your vless, vmess or trojan config.
      const cleanIp4Source =
        'https://raw.githubusercontent.com/ircfspace/cf2dns/master/list/ipv4.json'; //clean ip4 resource from ircfspace
      const response = await fetch(cleanIp4Source);
      const cleanIps = await response.json();
      const refinedConfigs = cleanIps
        .map((c) => refineConfig({ config, hostname, cleanIp: c.ip }, url))
        .join('\r\n');
      return new Response(refinedConfigs, {
        headers: { 'Content-Type': 'text/plain' },
      });
    } else {
      // Proceed with the existing fetch logic for other paths
      let realhostname = url.pathname.split('/')[1];
      let realpathname = url.pathname.split('/')[2];
      url.hostname = realhostname;
      url.pathname = '/' + realpathname;
      url.port = 8080;
      url.protocol = 'http';
      let newRequest = new Request(url, request);
      return fetch(newRequest);
    }
  },
};

async function handleRequest() {
  const html = `
  <!DOCTYPE html>
  <html lang='en'>
  <head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Non-TLS Config Refiner</title>
    <style>
      /* General Reset */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
  
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(to right, #fff, #f4f4f4);
        color: #333;
        padding: 50px 20px;
      }
  
      .container {
        max-width: 900px;
        margin: 0 auto;
        padding: 40px;
        background-color: #fff;
        border-radius: 15px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
      }
  
      h1 {
        text-align: center;
        font-size: 36px;
        color: #FF8C00;
        margin-bottom: 20px;
      }
  
      h2 {
        font-size: 24px;
        color: #444;
        margin-top: 40px;
      }
  
      label {
        font-weight: bold;
        font-size: 14px;
        display: block;
        margin-bottom: 8px;
        color: #444;
      }
  
      input[type='text'], textarea {
        width: 100%;
        padding: 12px 16px;
        margin-bottom: 20px;
        border-radius: 10px;
        border: 2px solid #ddd;
        font-size: 16px;
        transition: border 0.3s;
        box-shadow: inset 0 1px 5px rgba(0,0,0,0.1);
      }
  
      input[type='text']:focus, textarea:focus {
        border-color: #FF8C00;
        outline: none;
        box-shadow: inset 0 1px 5px rgba(255, 140, 0, 0.3);
      }
  
      button {
        width: 100%;
        padding: 15px;
        background-color: #FF8C00;
        color: #fff;
        font-size: 18px;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
  
      button:hover {
        background-color: #e67e22;
        transform: translateY(-2px);
        box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
      }
  
      button:active {
        transform: translateY(2px);
        box-shadow: none;
      }
  
      .error {
        color: red;
        font-size: 14px;
        margin-bottom: 20px;
        text-align: center;
      }
  
      .refined-box {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #ddd;
        word-wrap: break-word;
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
      }
  
      .copy-icon {
        display: inline-block;
        margin-top: 10px;
        font-size: 20px;
        cursor: pointer;
        color: #FF8C00;
        transition: color 0.2s ease;
      }
  
      .copy-icon:hover {
        color: #e67e22;
      }
  
      @media (max-width: 600px) {
        .container {
          padding: 20px;
        }
  
        h1 {
          font-size: 28px;
        }
  
        button {
          font-size: 16px;
        }
  
        input[type='text'], textarea {
          font-size: 14px;
        }
      }
    </style>
  </head>
  <body>
    <div class='container'>
      <h1>Non-TLS Config Refiner</h1>
      <form id='config-form'>
        <label for='config'>Config (vless, vmess, or trojan):</label>
        <textarea id='config' rows='6'></textarea>
  
        <label for='hostname'>Hostname pointing to Server IP:</label>
        <input type='text' id='hostname' placeholder='Enter your server hostname'>
  
        <label for='clean-ip'>Clean IP:</label>
        <input type='text' id='clean-ip' value='162.159.141.134' placeholder='Enter Cloudflare clean IP'>
  
        <button type='submit'>Refine Config</button>
        <div class='error' id='error'></div>
      </form>
  
      <h2>Refined Config</h2>
      <div id='refined-config' class='refined-box'></div>
      <span id='copy-btn' class='copy-icon'>📋 Copy</span>
    </div>
  
    <script>
      document.getElementById('config-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        const config = document.getElementById('config').value;
        const hostname = document.getElementById('hostname').value;
        const cleanIp = document.getElementById('clean-ip').value;
  
        const errorDiv = document.getElementById('error');
        const refinedConfigDiv = document.getElementById('refined-config');
        errorDiv.textContent = '';
        refinedConfigDiv.textContent = '';
  
        // Input validation
        if (!config && !hostname) {
          errorDiv.textContent = 'Please enter your Config and Hostname';
          return;
        } else if (!config) {
          errorDiv.textContent = 'Please enter your vmess, vless or trojan config';
          return;
        } else if (!hostname) {
          errorDiv.textContent = 'Please enter a hostname pointing to your Server IP Address.';
          return;
        } else if (!cleanIp) {
          errorDiv.textContent = 'Please input your Cloudflare Clean IP address.';
          return;
        }
  
        // Send POST request to the worker for refinement
        const response = await fetch('/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config,
            hostname,
            cleanIp
          })
        });
  
        const result = await response.json();
  
        if (result.error) {
          errorDiv.textContent = result.error;
        } else {
          refinedConfigDiv.textContent = result.refinedConfig;
        }
      });
  
      // Copy to clipboard functionality
      document.getElementById('copy-btn').addEventListener('click', () => {
        const refinedConfig = document.getElementById('refined-config').textContent;
        if (refinedConfig) {
          navigator.clipboard.writeText(refinedConfig).then(() => {
            alert('Config copied to clipboard!');
          }).catch(err => {
            alert('Failed to copy: ' + err);
          });
        }
      });
    </script>
  </body>
  </html>  
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

// Function to handle POST request and refine config
function refineConfig(params, url) {
  const { config, hostname, cleanIp } = params;
  const workerUrl = url.hostname;
  const workerPort = '8080'; // Default port value

  try {
    // Check if the config starts with vmess://, vless://, or trojan://
    if (config.startsWith('vmess://')) {
      return handleVmessConfig(
        config,
        hostname,
        cleanIp,
        workerUrl,
        workerPort
      );
    } else if (config.startsWith('vless://')) {
      return handleVlessConfig(
        config,
        hostname,
        cleanIp,
        workerUrl,
        workerPort
      );
    } else if (config.startsWith('trojan://')) {
      return handleTrojanConfig(
        config,
        hostname,
        cleanIp,
        workerUrl,
        workerPort
      );
    } else {
      return new Response(
        JSON.stringify({
          error: 'Please enter a valid vmess, vless or trojan config',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function handleVmessConfig(config, hostname, cleanIp, workerUrl, workerPort) {
  console.log('Original config:', config);

  const base64Part = config.split('vmess://')[1];
  console.log('Base64 part:', base64Part);

  if (!base64Part) {
    throw new Error('Invalid vmess config: No base64 part found.');
  }

  let decodedConfig;

  try {
    decodedConfig = atob(base64Part);
    console.log('Decoded config:', decodedConfig);
  } catch (e) {
    throw new Error('Invalid vmess config: Base64 decoding failed.');
  }

  let jsonConfig;
  try {
    jsonConfig = JSON.parse(decodedConfig);
    console.log('Parsed JSON config:', jsonConfig);
  } catch (e) {
    throw new Error('Invalid vmess config: JSON parsing failed.');
  }

  if (!jsonConfig.port || !jsonConfig.ps || !jsonConfig.id) {
    throw new Error(
      'Invalid vmess config: Missing required fields (port, ps, id).'
    );
  }

  const port = jsonConfig.port.toString();
  console.log('Config port:', port);

  if (port !== workerPort) {
    throw new Error(`The config port must be ${workerPort}`);
  }

  const refinedConfig = {
    v: '2',
    ps: jsonConfig.ps,
    add: cleanIp, // Use Clean IP provided by the user
    port: '443',
    id: jsonConfig.id,
    aid: '0',
    scy: 'auto',
    net: 'ws',
    type: 'none',
    host: workerUrl,
    path: `/${hostname}${jsonConfig.path || ''}`,
    tls: 'tls',
    sni: workerUrl,
    alpn: 'h2,http/1.1',
    fp: 'chrome',
  };

  console.log('Refined config object:', refinedConfig);

  let refinedConfigBase64;
  try {
    refinedConfigBase64 = btoa(JSON.stringify(refinedConfig));
    console.log('Refined config base64:', refinedConfigBase64);
  } catch (e) {
    throw new Error('Failed to encode the refined configuration to base64.');
  }
  return `vmess://${refinedConfigBase64}`;
}

function handleVlessConfig(config, hostname, cleanIp, workerUrl, workerPort) {
  const parts = config.split('vless://')[1].split('@');
  const uuid = parts[0];
  const hostAndPort = parts[1].split('#')[0]; // Get everything before the #
  const [host, portPath] = hostAndPort.split(':'); // Separate host and port
  const port = portPath.split('?')[0]; // Get port
  const path = portPath.split('path=')[1]?.split('&')[0] || ''; // Extract path if it exists
  const alias = parts[1].split('#')[1]; // Extract the alias after #

  if (port !== workerPort) {
    throw new Error(`The config port must be ${workerPort}`);
  }

  const refinedConfig = `vless://${uuid}@${cleanIp}:443?encryption=none&security=tls&sni=${workerUrl}&alpn=h2%2Chttp%2F1.1&fp=chrome&allowInsecure=1&type=ws&host=${workerUrl}&path=%2F${hostname}${path}#${alias}`;

  return refinedConfig;
}

function handleTrojanConfig(config, hostname, cleanIp, workerUrl, workerPort) {
  const parts = config.split('trojan://')[1].split('@');
  const uuid = parts[0];
  const hostAndPort = parts[1].split('#')[0]; // Get everything before the #
  const [host, portPath] = hostAndPort.split(':'); // Separate host and port
  const port = portPath.split('?')[0]; // Get port
  const path = portPath.split('path=')[1]?.split('&')[0] || ''; // Extract path if it exists
  const alias = parts[1].split('#')[1]; // Extract the alias after #

  if (port !== workerPort) {
    throw new Error(`The config port must be ${workerPort}`);
  }

  const refinedConfig = `trojan://${uuid}@${cleanIp}:443??encryption=none&security=tls&sni=${workerUrl}&alpn=h2%2Chttp%2F1.1&fp=chrome&allowInsecure=1&type=ws&host=${workerUrl}&path=%2F${hostname}${path}#${alias}`;

  return refinedConfig;
}
