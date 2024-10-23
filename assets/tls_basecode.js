export default {
  async fetch(request) {
    let url = new URL(request.url);
    let pathSegments = url.pathname.split('/').filter(segment => segment !== '');
    let realhostname = pathSegments[0] || '';
    let realpathname = pathSegments[1] || '';

      // Handle requests by proxying them
      const splitted = url.pathname.replace(/^\/*/, '').split('/');
      const address = splitted[0];
      url.pathname = splitted.slice(1).join('/');
      url.hostname = address;
      url.protocol = 'https';
      return fetch(new Request(url, request));
  },
};
