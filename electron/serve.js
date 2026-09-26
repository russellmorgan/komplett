const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const TYPES = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

// Maps a request path to a file inside root. Anything that isn't a real file falls back to
// index.html so client-side routes like /timer work, and anything escaping root is refused.
function resolveFile(root, url) {
  const base = path.resolve(root);
  let decoded;
  try {
    decoded = decodeURIComponent(url.split("?")[0]);
  } catch {
    return null; // malformed percent-encoding
  }
  const file = path.resolve(base, `.${path.posix.normalize(decoded)}`);
  if (file !== base && !file.startsWith(base + path.sep)) return null;
  const isFile = fs.existsSync(file) && fs.statSync(file).isFile();
  return isFile ? file : path.join(base, "index.html");
}

// Serves the Vite build over http so the bundle's absolute /assets/* URLs, BrowserRouter and
// Firebase auth (which only trusts an authorised domain, and "localhost" is one) all work.
// Loading dist/index.html as a file: URL breaks all three.
function createServer(root) {
  return http.createServer((req, res) => {
    const file = resolveFile(root, req.url || "/");
    if (!file) {
      res.writeHead(403).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  });
}

module.exports = { createServer, resolveFile };
