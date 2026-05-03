import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = dirname(fileURLToPath(import.meta.url));
const dataFile = join(folder, 'tasks.json');

export async function getTasks() {
  try {
    const content = await readFile(dataFile, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function saveTasks(tasks) {
  const data = JSON.stringify(tasks, null, 2);
  await writeFile(dataFile, data, 'utf8');
}

export function newId(tasks) {
  if (tasks.length === 0) return 1;

  const ids = tasks.map(task => task.id);
  return Math.max(...ids) + 1;
}
