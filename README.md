# Usage
* Access your configs by handling websocket requests via Cloudflare..
* Create a Vmess/Vless/Trojan config on WS network, TLS Security (Cloudflare-registered domain recommended, proxy on) and port 443.
* Follow the Deployment instructions.

# Deployment
* Sign up or login at https://dash.cloudflare.com/
* Create a new Cloudflare Worker, `Edit Code` and clear the content.
* Copy the content of [worker.js](./worker.js) from this repository file, paste onto your Cloudflare worker and hit `Deploy`.

# Acknowledgements
* Handling Websockets code snippet credits and the idea of Eewriting Configs UI tribute to Vfarid's [v2ray-worker-merge](https://github.com/vfarid/v2ray-worker-merge/tree/main).
