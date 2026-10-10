import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDesignBoard } from './src/designrun.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const board = createDesignBoard([
  {
    id: 'task-1',
    title: 'Define kickoff brief',
    status: 'done',
    priority: 'high',
    estimateHours: 3,
    assignee: 'Dana',
    tags: ['brief', 'research'],
  },
  {
    id: 'task-2',
    title: 'Create hero exploration',
    status: 'in-progress',
    priority: 'high',
    estimateHours: 5,
    assignee: 'Milo',
    tags: ['ui', 'landing'],
  },
  {
    id: 'task-3',
    title: 'Prepare motion system',
    status: 'todo',
    priority: 'medium',
    estimateHours: 4,
    assignee: 'Nia',
    tags: ['animation'],
  },
]);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

async function serveStaticFile(requestUrl) {
  const normalizedPath = requestUrl === '/' ? 'index.html' : requestUrl.replace(/^\/+/, '');
  const filePath = path.join(publicDir, normalizedPath);

  if (!filePath.startsWith(publicDir)) {
    return null;
  }

  try {
    const file = await readFile(filePath);
    return file;
  } catch {
    return null;
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');

  if (url.pathname === '/api/tasks') {
    if (request.method === 'GET') {
      sendJson(response, 200, board.tasks);
      return;
    }

    if (request.method === 'POST') {
      try {
        const body = await new Promise((resolve, reject) => {
          let data = '';
          request.on('data', (chunk) => {
            data += chunk;
          });
          request.on('end', () => {
            try {
              resolve(data ? JSON.parse(data) : {});
            } catch (error) {
              reject(new Error('Invalid JSON payload.'));
            }
          });
          request.on('error', () => reject(new Error('Unable to read request body.')));
        });

        const task = board.addTask(body);
        sendJson(response, 201, task);
      } catch (error) {
        sendJson(response, 400, { error: error.message });
      }
      return;
    }
  }

  if (url.pathname.startsWith('/api/tasks/')) {
    const taskId = decodeURIComponent(url.pathname.replace('/api/tasks/', ''));

    if (request.method === 'PUT') {
      try {
        const body = await new Promise((resolve, reject) => {
          let data = '';
          request.on('data', (chunk) => {
            data += chunk;
          });
          request.on('end', () => {
            try {
              resolve(data ? JSON.parse(data) : {});
            } catch (error) {
              reject(new Error('Invalid JSON payload.'));
            }
          });
          request.on('error', () => reject(new Error('Unable to read request body.')));
        });

        const task = board.updateTask(taskId, body);
        sendJson(response, 200, task);
      } catch (error) {
        sendJson(response, 400, { error: error.message });
      }
      return;
    }

    if (request.method === 'DELETE') {
      const removed = board.removeTask(taskId);
      sendJson(response, removed ? 200 : 404, { removed });
      return;
    }
  }

  if (url.pathname === '/api/summary') {
    if (request.method === 'GET') {
      sendJson(response, 200, board.getSummary());
      return;
    }
  }

  const staticFile = await serveStaticFile(url.pathname);

  if (!staticFile) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const extension = path.extname(url.pathname) || '.html';
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  }[extension] || 'application/octet-stream';

  response.writeHead(200, { 'Content-Type': contentType });
  response.end(staticFile);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Designrun is running on http://localhost:${port}`);
});
