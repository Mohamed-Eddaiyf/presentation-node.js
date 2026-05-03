import { extname } from 'node:path';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

export function getType(filePath) {
  return types[extname(filePath)] || 'application/octet-stream';
}

export function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8'
  });

  res.end(JSON.stringify(data));
}

export function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

export function noContent(res) {
  res.writeHead(204);
  res.end();
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;

      if (body.length > 1000000) {
        reject(new Error('Body trop grand'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (body.trim() === '') return resolve({});

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('JSON invalide'));
      }
    });

    req.on('error', reject);
  });
}
