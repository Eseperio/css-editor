const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4343;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
};

// Live reload script to inject into HTML pages
const liveReloadScript = `
<script>
(function() {
  const source = new EventSource('/livereload');
  source.onmessage = function() {
    console.log('File changed, reloading...');
    location.reload();
  };
  source.onerror = function() {
    console.log('Live reload disconnected');
  };
})();
</script>
`;

// Store live reload clients
const clients = [];

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Live reload endpoint
  if (req.url === '/livereload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    clients.push(res);
    req.on('close', () => {
      const index = clients.indexOf(res);
      if (index !== -1) clients.splice(index, 1);
    });
    return;
  }

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './example/index.html';
  } else if (filePath.endsWith('/')) {
    filePath = filePath + 'index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      // Inject live reload script into HTML files
      if (extname === '.html') {
        content = content.toString().replace('</body>', liveReloadScript + '</body>');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Watch for file changes in dist and example directories
function watchFiles() {
  const dirsToWatch = ['./dist', './example'];
  
  dirsToWatch.forEach(dir => {
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (filename) {
        console.log(`File changed: ${filename}`);
        // Notify all connected clients
        clients.forEach(client => {
          client.write('data: reload\n\n');
        });
      }
    });
  });
  
  console.log('Watching for file changes...');
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Demo page: http://localhost:${PORT}/example/`);
  console.log(`Iframe demo: http://localhost:${PORT}/example/iframe-demo.html`);
  watchFiles();
});
