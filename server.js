const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, 'public');
const users = new Map();

function createId() {
  return crypto.randomBytes(12).toString('hex');
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    // INDISPENSABLE pour freeCodeCamp
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
  });
  response.end(body);
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      const type = request.headers['content-type'] || '';
      if (type.includes('application/json')) {
        try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); }
        return;
      }
      resolve(Object.fromEntries(new URLSearchParams(body)));
    });
    request.on('error', reject);
  });
}

function publicUser(user) {
  return { username: user.username, _id: user._id };
}

function exerciseResponse(user, exercise) {
  return { ...publicUser(user), ...exercise };
}

function getLog(user, query) {
  let log = [...user.exercises];
  if (query.get('from')) {
    const from = new Date(query.get('from')).getTime();
    log = log.filter((exercise) => exercise.rawDate >= from);
  }
  if (query.get('to')) {
    const to = new Date(query.get('to')).setHours(23, 59, 59, 999);
    log = log.filter((exercise) => exercise.rawDate <= to);
  }
  if (query.get('limit')) {
    const limit = Number.parseInt(query.get('limit'), 10);
    if (!Number.isNaN(limit)) log = log.slice(0, Math.max(0, limit));
  }
  
  // On retire rawDate de l'objet renvoyé pour respecter strictement le format freeCodeCamp
  const cleanLog = log.map(({ description, duration, date }) => ({ description, duration, date }));
  return { ...publicUser(user), count: cleanLog.length, log: cleanLog };
}

async function handleApi(request, response, url) {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'api') return false;

  if (request.method === 'POST' && parts.length === 2 && parts[1] === 'users') {
    const body = await readBody(request);
    const username = String(body.username || '').trim();
    if (!username) return sendError(response, 400, 'Username is required.');
    const user = { username, _id: createId(), exercises: [] };
    users.set(user._id, user);
    return sendJson(response, 200, publicUser(user));
  }

  if (request.method === 'GET' && parts.length === 2 && parts[1] === 'users') {
    return sendJson(response, 200, [...users.values()].map(publicUser));
  }

  const user = users.get(parts[2]);
  if (!user) return sendError(response, 404, 'User not found.');

  if (request.method === 'POST' && parts.length === 4 && parts[3] === 'exercises') {
    const body = await readBody(request);
    const duration = Number(body.duration);
    const description = String(body.description || '').trim();
    if (!description || !Number.isFinite(duration) || duration <= 0) {
      return sendError(response, 400, 'Description and a positive duration are required.');
    }
    const parsedDate = body.date ? new Date(body.date) : new Date();
    if (Number.isNaN(parsedDate.getTime())) return sendError(response, 400, 'Invalid date.');
    
    const exercise = {
      description,
      duration,
      date: parsedDate.toDateString(),
      rawDate: parsedDate.getTime() // Stocké en interne pour des filtres fiables
    };
    user.exercises.push(exercise);
    return sendJson(response, 200, exerciseResponse(user, { description, duration, date: exercise.date }));
  }

  if (request.method === 'GET' && parts.length === 4 && parts[3] === 'logs') {
    return sendJson(response, 200, getLog(user, url.searchParams));
  }

  return sendError(response, 404, 'Route not found.');
}

function serveStatic(request, response, url) {
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.normalize(path.join(publicDir, requested));
  if (!filePath.startsWith(publicDir)) return sendError(response, 403, 'Forbidden.');
  fs.readFile(filePath, (error, file) => {
    if (error) return sendError(response, 404, 'Not found.');
    const contentTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
    response.writeHead(200, { 
      'Content-Type': `${contentTypes[path.extname(filePath)] || 'application/octet-stream'}; charset=utf-8`,
      'Access-Control-Allow-Origin': '*'
    });
    response.end(file);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    });
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(request, response, url);
    else serveStatic(request, response, url);
  } catch (error) {
    sendError(response, 500, error.message || 'Internal server error.');
  }
});

server.listen(PORT, () => console.log(`Exercise tracker running at http://localhost:${PORT}`));