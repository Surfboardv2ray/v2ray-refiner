<h1 align="center">
  V2ray Refiner
</h1>

<h2 align="center">
Access your configs by handling websocket requests via Cloudflare.
  <h3>
    English 🇬🇧 | <a href="README_FA.md">🇮🇷 فارسی</a>
  </h3> 
</h2>


## Introduction
🟢 In an environment where direct connection to v2ray configs is not available, this alternative way can route the traffic to the destination server via Cloudflare.

## Presequites
1. Login or Signup at https://dash.cloudflare.com and verify your email address.
2. Head to `Workers and Pages` to create and name a worker.
3. Click `Edit Code` code to enter the editing environment.

## TLS Version (Cloudflare-registered domain with PROXY switched to ON)
🟡 This method only works if your v2ray panel has a domain registered on Cloudflare with a TLS certificate, and Cloudflare proxy status switch to ON. 

🟡 In your VPS v2ray panel, create a config with these specifications:
* Type: Vmess, Vless or Trojan
* Transporation: Websocket (WS)
* Security: TLS
* Host: Cloudflare-registered TLS-Certified Domain/Subdomain
* Port: 443

🟡 Get the latest version of the TLS V2ray Refiner Worker Script, copy and paste/upload the entire content to your Cloudflare worker and hit deploy.

🟡 Open the deployed version of the worker and enter the TLS config you created on your VPS, and hit `Refine`.

## Non-TLS Version (No Cloudflare-registered domains, or domain with no TLS Certification)
🟠 This method only works if your v2ray panel is not bound to a Cloudflare-registered domain, or the domain doesn't have a TLS Certificate. 

🟠 First create a hostname with Type A poiting to your server IPv4 address, in any free DNS websites like https://noip.com/

🟠 In your VPS v2ray panel, create a config with these specifications:
* Type: Vmess, Vless or Trojan
* Transporation: Websocket (WS)
* Security: None
* Host: Hostname pointing to your server's IP Address (If on Cloudflare, switch the PROXY to OFF)
* Port: 80

🟠 Get the latest version of the Non-TLS V2ray Refiner Worker Script, copy and paste/upload the entire content to your Cloudflare worker and hit deploy.

🟠 Open the deployed version of the worker and enter the Non-TLS config you created on your VPS. Set the hostname to the one you created in step 2. Enter a clean Cloudflare IP address that works on your network, and finally, hit `Refine`.

## Editing the Non-TLS Script
🟠 The default port is 80 `url.port = 80`. If your VPS config uses another port, edit the port in the script accordingly.

## Additional Notes
🟡 You could get Clean IPs via [IRCF Space Repo](https://github.com/ircfspace/cf2dns/blob/master/list/ipv4.json), but it's recommended to use [Scanners](https://ircf.space/scanner.html).

## Acknowledgements
* Handling Websockets code snippet credits and the idea of Rewriting Configs UI tribute to Vfarid's [v2ray-worker-merge](https://github.com/vfarid/v2ray-worker-merge/tree/main).
* Handling Non-TLS configs code snippet tribute to [GetAFreeNode](https://getafreenode.com/blog/index.php/tutorial/31.html).
