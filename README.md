# v2ray-refiner
Use Cloudflare Workers to access your v2ray Vmess, Vless and Trojan configs through Websockets.

# Usage
* Access your configs by handling websocket requests via Cloudflare.

# Deployment
* Sign up or login at https://dash.cloudflare.com/
* Create a new Cloudflare Worker, `Edit Code` and clear the content.
* Copy the content of [worker.js](./worker.js) from this repository file, paste onto your Cloudflare worker and hit `Deploy`.

# Acknowledgements
* The main idea and Handling Websockets code snippet credits to Vfarid's [v2ray-worker-merge](https://github.com/vfarid/v2ray-worker-merge/tree/main).
