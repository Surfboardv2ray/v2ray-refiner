export default {
  async fetch(request) {
    let url = new URL(request.url);
    let realhostname = url.pathname.split('/')[1];
    let realpathname = url.pathname.split('/')[2];
    url.hostname = realhostname;
    url.pathname = '/' + realpathname;
    url.port = 80;
    url.protocol = 'http';

    // Create a new request with the updated URL
    let newRequest = new Request(url, request);

    // Forward the new request and return the response
    return fetch(newRequest);
  }
}
