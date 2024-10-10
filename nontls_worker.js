// Developed by Surfboardv2ray
// https://github.com/Surfboardv2ray/v2ray-refiner
// Change url.port if your config uses another port. Only one port will work at a time.

addEventListener("fetch", event => {
  let url = new URL(event.request.url);
  if (url.pathname === '/' && event.request.method === "GET") {
    // Serve the HTML page at the root URL for GET request
    return event.respondWith(handleRequest());
  } else if (url.pathname === '/' && event.request.method === "POST") {
    // Handle POST request to process the config refinement
    return event.respondWith(handleConfigRefinement(event.request));
  } else {
    // Proceed with the existing fetch logic for other paths
    let realhostname = url.pathname.split('/')[1];
    let realpathname = url.pathname.split('/')[2];
    url.hostname = realhostname;
    url.pathname = '/' + realpathname;
    url.port = 80;
    url.protocol = 'http';
    let request = new Request(url, event.request);
    event.respondWith(fetch(request));
  }
});

async function handleRequest() {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Non-TLS Config Refiner</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h1 {
        font-size: 24px;
        margin-bottom: 20px;
      }
      label {
        display: block;
        font-weight: bold;
        margin-bottom: 5px;
      }
      input[type="text"], textarea {
        width: 100%;
        padding: 10px;
        margin-bottom: 20px;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
      }
      button {
        padding: 10px 20px;
        background-color: #28a745;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      button:hover {
        background-color: #218838;
      }
      .error {
        color: red;
        font-size: 14px;
        margin-bottom: 20px;
      }
      .refined-box {
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        padding: 10px;
        word-wrap: break-word;
      }
      .copy-icon {
        cursor: pointer;
        color: #007bff;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Non-TLS Config Refiner</h1>
      <form id="config-form">
        <label for="config">Config (vless, vmess, or trojan):</label>
        <textarea id="config" rows="4"></textarea>
        
        <label for="hostname">Hostname pointing to Server IP:</label>
        <input type="text" id="hostname">

        <label for="clean-ip">Clean IP:</label>
        <input type="text" id="clean-ip" value="162.159.141.134">

        <button type="submit">Refine Config</button>
        <div class="error" id="error"></div>
      </form>

      <h2>Refined Config</h2>
      <div id="refined-config" class="refined-box"></div>
      <span id="copy-btn" class="copy-icon">📋 Copy</span>
    </div>

    <script>
      document.getElementById("config-form").addEventListener("submit", async function(event) {
        event.preventDefault();
        const config = document.getElementById("config").value;
        const hostname = document.getElementById("hostname").value;
        const cleanIp = document.getElementById("clean-ip").value;

        const errorDiv = document.getElementById("error");
        const refinedConfigDiv = document.getElementById("refined-config");
        errorDiv.textContent = "";
        refinedConfigDiv.textContent = "";

        // Input validation
        if (!config && !hostname) {
          errorDiv.textContent = "Please enter your Config and Hostname";
          return;
        } else if (!config) {
          errorDiv.textContent = "Please enter your vmess, vless or trojan config";
          return;
        } else if (!hostname) {
          errorDiv.textContent = "Please enter a hostname pointing to your Server IP Address.";
          return;
        } else if (!cleanIp) {
          errorDiv.textContent = "Please input your Cloudflare Clean IP address.";
          return;
        }

        // Send POST request to the worker for refinement
        const response = await fetch("/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
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
      document.getElementById("copy-btn").addEventListener("click", () => {
        const refinedConfig = document.getElementById("refined-config").textContent;
        if (refinedConfig) {
          navigator.clipboard.writeText(refinedConfig).then(() => {
            alert("Config copied to clipboard!");
          }).catch(err => {
            alert("Failed to copy: " + err);
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
async function handleConfigRefinement(request) {
  const { config, hostname, cleanIp } = await request.json();
  const url = new URL(request.url);
  const workerUrl = url.hostname;
  const workerPort = '80'; // Default port value

  try {
    // Check if the config starts with vmess://, vless://, or trojan://
    if (config.startsWith('vmess://')) {
      return handleVmessConfig(config, hostname, cleanIp, workerUrl, workerPort);
    } else if (config.startsWith('vless://')) {
      return handleVlessConfig(config, hostname, cleanIp, workerUrl, workerPort);
    } else if (config.startsWith('trojan://')) {
      return handleTrojanConfig(config, hostname, cleanIp, workerUrl, workerPort);
    } else {
      return new Response(JSON.stringify({ error: "Please enter a valid vmess, vless or trojan config" }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle vmess:// config refinement
function handleVmessConfig(config, hostname, cleanIp, workerUrl, workerPort) {
  console.log("Original config:", config);
  
  // Extract the base64 part after 'vmess://'
  const base64Part = config.split('vmess://')[1]; 
  console.log("Base64 part:", base64Part);

  // Check if the base64 part is present
  if (!base64Part) {
    throw new Error("Invalid vmess config: No base64 part found.");
  }

  let decodedConfig;

  try {
    // Decode the base64 part
    decodedConfig = atob(base64Part); 
    console.log("Decoded config:", decodedConfig);
  } catch (e) {
    throw new Error("Invalid vmess config: Base64 decoding failed.");
  }

  // Parse the decoded JSON config
  let jsonConfig;
  try {
    jsonConfig = JSON.parse(decodedConfig);
    console.log("Parsed JSON config:", jsonConfig);
  } catch (e) {
    throw new Error("Invalid vmess config: JSON parsing failed.");
  }

  // Validate required fields
  if (!jsonConfig.port || !jsonConfig.ps || !jsonConfig.id) {
    throw new Error("Invalid vmess config: Missing required fields (port, ps, id).");
  }

  const port = jsonConfig.port.toString();
  console.log("Config port:", port);
  
  // Check if the port matches the worker port
  if (port !== workerPort) {
    throw new Error(`The config port must be ${workerPort}`);
  }

  // Construct the refined config
  const refinedConfig = {
    v: "2", 
    ps: jsonConfig.ps, 
    add: cleanIp, // Use Clean IP provided by the user
    port: "443", 
    id: jsonConfig.id,
    aid: "0", 
    scy: "auto", 
    net: "ws", 
    type: "none", 
    host: workerUrl, // Set host to the Worker URL
    path: `/${hostname}${jsonConfig.path || ''}`, // Ensure path is appended correctly
    tls: "tls", 
    sni: workerUrl, // Set SNI to the Worker URL
    alpn: "h2,http/1.1", 
    fp: "chrome" 
  };

  console.log("Refined config object:", refinedConfig);

  // Convert refined config to base64
  let refinedConfigBase64;
  try {
    refinedConfigBase64 = btoa(JSON.stringify(refinedConfig));
    console.log("Refined config base64:", refinedConfigBase64);
  } catch (e) {
    throw new Error("Failed to encode the refined configuration to base64.");
  }

  // Return the refined configuration as a JSON response
  return new Response(JSON.stringify({ refinedConfig: `vmess://${refinedConfigBase64}` }), {
    headers: { 'Content-Type': 'application/json' },
  });
}


// Handle vless:// config refinement
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
  
  return new Response(JSON.stringify({ refinedConfig }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Handle trojan:// config refinement
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

  return new Response(JSON.stringify({ refinedConfig }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

