addEventListener(
  "fetch", event => {
      let url = new URL(event.request.url);
      let realhostname = url.pathname.split('/')[1];
      let realpathname = url.pathname.split('/')[2];
      url.hostname = realhostname;
      url.pathname = '/'+ realpathname;
      url.port = 80;
      url.protocol = 'http';
      let request = new Request(url, event.request);
      event.respondWith(
         fetch(request)
      )
  }
)
