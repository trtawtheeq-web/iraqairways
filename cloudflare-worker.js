// Cloudflare Worker - Full Reverse Proxy for Kuwait MOH Insurance Site
// Proxies HTML, CSS, JS, images - rewrites all URLs to go through the worker
const TARGET_ORIGIN = 'https://insonline.moh.gov.kw';

addEventListener('fetch', function(event) {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  var url = new URL(request.url);
  var workerOrigin = url.origin;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  // Determine target URL
  var targetUrl;
  var urlParam = url.searchParams.get('url');
  
  if (urlParam) {
    targetUrl = urlParam;
  } else {
    // Map the path directly: worker.dev/Insurance/... -> target/Insurance/...
    var path = url.pathname + url.search;
    if (path === '/' || path === '') {
      path = '/Insurance/logaction';
    }
    targetUrl = TARGET_ORIGIN + path;
  }

  // Security: only allow Kuwait MOH domain
  if (!targetUrl.startsWith(TARGET_ORIGIN)) {
    return new Response(JSON.stringify({ error: 'Only Kuwait MOH site is allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    var fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': request.headers.get('Accept') || '*/*',
      'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
      'Referer': TARGET_ORIGIN + '/Insurance/logaction',
    };

    var fetchOptions = {
      method: request.method,
      headers: fetchHeaders,
      redirect: 'follow',
    };

    if (request.method === 'POST') {
      fetchOptions.body = await request.arrayBuffer();
      var ct = request.headers.get('Content-Type');
      if (ct) fetchHeaders['Content-Type'] = ct;
    }

    var response = await fetch(targetUrl, fetchOptions);
    var contentType = response.headers.get('Content-Type') || '';

    // Build clean response headers
    var respHeaders = new Headers();
    respHeaders.set('Access-Control-Allow-Origin', '*');
    
    // Copy safe headers
    var safeHeaders = ['Content-Type', 'Cache-Control', 'ETag', 'Last-Modified'];
    for (var i = 0; i < safeHeaders.length; i++) {
      var val = response.headers.get(safeHeaders[i]);
      if (val) respHeaders.set(safeHeaders[i], val);
    }
    // Do NOT copy X-Frame-Options, Content-Security-Policy

    // Handle HTML - rewrite URLs
    if (contentType.includes('text/html')) {
      var html = await response.text();

      // Rewrite absolute URLs to target origin
      html = html.split(TARGET_ORIGIN + '/').join(workerOrigin + '/');
      html = html.split(TARGET_ORIGIN).join(workerOrigin);

      // Rewrite relative URLs in src, href, action attributes
      // /Insurance/... -> /Insurance/... (already works since base is worker)
      // But we need to handle src="/Content/..." etc
      
      // Remove any existing base tag
      html = html.replace(/<base[^>]*>/gi, '');
      
      // Add our base tag pointing to worker origin
      html = html.replace(/<head([^>]*)>/i, '<head$1>\n<base href="' + workerOrigin + '/">');

      // Inject script to intercept navigation
      var navScript = '<script>' +
        'document.addEventListener("click",function(e){' +
        'var a=e.target.closest("a[href]");' +
        'if(!a)return;' +
        'var h=a.getAttribute("href");' +
        'if(!h||h.startsWith("javascript:")||h.startsWith("#"))return;' +
        'if(h.startsWith("' + TARGET_ORIGIN + '")){' +
        'e.preventDefault();' +
        'window.location.href=h.replace("' + TARGET_ORIGIN + '","' + workerOrigin + '");' +
        '}' +
        '},true);' +
        'document.addEventListener("submit",function(e){' +
        'var f=e.target;if(!f)return;' +
        'var a=f.getAttribute("action")||"";' +
        'if(a.startsWith("' + TARGET_ORIGIN + '")){' +
        'f.setAttribute("action",a.replace("' + TARGET_ORIGIN + '","' + workerOrigin + '"));' +
        '}' +
        '},true);' +
        'window.parent.postMessage({type:"moh-navigation",path:window.location.pathname+window.location.search},"*");' +
        '</script>';
      html = html.replace('</body>', navScript + '</body>');

      return new Response(html, { status: response.status, headers: respHeaders });
    }
    
    // Handle CSS - rewrite url() references
    if (contentType.includes('text/css')) {
      var css = await response.text();
      // Rewrite url(/path/...) to url(workerOrigin/path/...)
      css = css.replace(/url\s*\(\s*['"]?\//g, 'url(' + workerOrigin + '/');
      css = css.replace(/url\s*\(\s*['"]?https:\/\/insonline\.moh\.gov\.kw\//g, 'url(' + workerOrigin + '/');
      return new Response(css, { status: response.status, headers: respHeaders });
    }

    // All other resources (JS, images, fonts) - pass through as-is
    var body = await response.arrayBuffer();
    return new Response(body, { status: response.status, headers: respHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch',
      message: error.message,
      url: targetUrl
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
