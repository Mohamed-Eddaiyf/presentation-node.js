import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getTasks, saveTasks, newId } from './storage.mjs';
import { getType, readBody, sendJson, sendError, noContent } from './http-helpers.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const publicFolder = join(root, 'public');
const port = 3000;

function getId(pathname) {
  const parts = pathname.split('/');
  return Number(parts[3]);
}

function isTaskRoute(pathname) {
  return pathname === '/api/tasks' || pathname.startsWith('/api/tasks/');
}

function cleanInput(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';

  let priority = 'medium';
  if (body.priority === 'low' || body.priority === 'high' || body.priority === 'medium') {
    priority = body.priority;
  }

  return {
    title,
    priority,
    dueDate: body.dueDate || null
  };
}

async function handleApi(req, res, pathname) {
  const tasks = await getTasks();
  const isList = pathname === '/api/tasks';
  const id = getId(pathname);

  if (req.method === 'GET' && isList) {
    return sendJson(res, 200, tasks);
  }

  if (req.method === 'GET' && !isList) {
    const task = tasks.find(item => item.id === id);

    if (!task) return sendError(res, 404, 'Tache introuvable');
    return sendJson(res, 200, task);
  }

  if (req.method === 'POST' && isList) {
    const body = await readBody(req);
    const input = cleanInput(body);

    if (!input.title) {
      return sendError(res, 400, 'Le titre est obligatoire');
    }

    const task = {
      id: newId(tasks),
      title: input.title,
      priority: input.priority,
      dueDate: input.dueDate,
      done: false,
      createdAt: new Date().toISOString()
    };

    tasks.push(task);
    await saveTasks(tasks);

    return sendJson(res, 201, task);
  }

  if (req.method === 'PATCH' && !isList) {
    const task = tasks.find(item => item.id === id);

    if (!task) return sendError(res, 404, 'Tache introuvable');

    const body = await readBody(req);

    if (typeof body.title === 'string' && body.title.trim() !== '') {
      task.title = body.title.trim();
    }

    if (typeof body.done === 'boolean') {
      task.done = body.done;
    }

    if (body.priority === 'low' || body.priority === 'medium' || body.priority === 'high') {
      task.priority = body.priority;
    }

    if ('dueDate' in body) {
      task.dueDate = body.dueDate || null;
    }

    await saveTasks(tasks);
    return sendJson(res, 200, task);
  }

  if (req.method === 'DELETE' && !isList) {
    const index = tasks.findIndex(item => item.id === id);

    if (index === -1) return sendError(res, 404, 'Tache introuvable');

    tasks.splice(index, 1);
    await saveTasks(tasks);

    return noContent(res);
  }

  return sendError(res, 405, 'Methode non autorisee');
}

async function serveFile(req, res, pathname) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Methode non autorisee');
  }

  const page = pathname === '/' ? '/index.html' : pathname;
  const cleanPath = normalize(page).replace(/^([/\\]?\.\.[/\\])+/, '');
  const filePath = join(publicFolder, cleanPath);

  if (!filePath.startsWith(publicFolder)) {
    return sendError(res, 403, 'Acces interdit');
  }

  try {
    const file = await readFile(filePath);

    res.writeHead(200, { 'Content-Type': getType(filePath) });
    return res.end(file);
  } catch (err) {
    if (err.code === 'ENOENT') return sendError(res, 404, 'Fichier introuvable');
    return sendError(res, 500, 'Erreur serveur');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (isTaskRoute(pathname)) {
      return await handleApi(req, res, pathname);
    }

    return await serveFile(req, res, pathname);
  } catch (err) {
    const status = err.message === 'JSON invalide' ? 400 : 500;
    return sendError(res, status, err.message);
  }
});

server.listen(port, () => {
  console.log(`TaskFlow lance sur http://localhost:${port}`);
});
