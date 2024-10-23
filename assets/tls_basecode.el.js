addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  let url = new URL(request.url);
  let pathSegments = url.pathname.split('/').filter(segment => segment !== '');
  let realhostname = pathSegments[0] || '';
  let realpathname = pathSegments[1] || '';

  // Handle requests by proxying them
  const splitted = url.pathname.replace(/^\/*/, '').split('/');
  const address = splitted[0];
  url.pathname = splitted.slice(1).join('/');
  url.hostname = address;
  url.protocol = 'https'; // Change to 'http' if needed
  
  // Create a new request to fetch
  let proxyRequest = new Request(url, request);
  return fetch(proxyRequest);
}
