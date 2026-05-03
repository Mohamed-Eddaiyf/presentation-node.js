const api = '/api/tasks';

const form = document.querySelector('#task-form');
const titleInput = document.querySelector('#task-title');
const priorityInput = document.querySelector('#task-priority');
const dateInput = document.querySelector('#task-date');
const searchInput = document.querySelector('#search');
const list = document.querySelector('#task-list');
const feedback = document.querySelector('#feedback');
const emptyState = document.querySelector('#empty-state');
const filters = document.querySelectorAll('.filter');

const totalCount = document.querySelector('#total-count');
const todoCount = document.querySelector('#todo-count');
const doneCount = document.querySelector('#done-count');

let tasks = [];
let currentFilter = 'all';

function showError(msg) {
  feedback.textContent = msg;

  setTimeout(() => {
    if (feedback.textContent === msg) feedback.textContent = '';
  }, 3000);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);

  if (response.status === 204) return null;

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erreur serveur');
  }

  return data;
}

async function loadTasks() {
  try {
    tasks = await apiRequest(api);
    renderTasks();
  } catch (err) {
    showError(err.message);
  }
}

function getPriorityLabel(priority) {
  if (priority === 'high') return 'Haute';
  if (priority === 'low') return 'Basse';
  return 'Moyenne';
}

function updateStats() {
  totalCount.textContent = tasks.length;
  doneCount.textContent = tasks.filter(task => task.done).length;
  todoCount.textContent = tasks.filter(task => !task.done).length;
}

function filteredTasks() {
  const word = searchInput.value.trim().toLowerCase();

  return tasks.filter(task => {
    const okFilter =
      currentFilter === 'all' ||
      (currentFilter === 'todo' && !task.done) ||
      (currentFilter === 'done' && task.done);

    const okSearch = task.title.toLowerCase().includes(word);

    return okFilter && okSearch;
  });
}

function renderTasks() {
  updateStats();
  list.innerHTML = '';

  const items = filteredTasks();
  emptyState.hidden = items.length > 0;

  for (const task of items) {
    const li = document.createElement('li');
    li.className = task.done ? 'task done' : 'task';

    li.innerHTML = `
      <input type="checkbox" ${task.done ? 'checked' : ''} data-action="toggle" data-id="${task.id}">
      <div>
        <div class="task-title">${task.title}</div>
        <div class="task-meta">
          <span class="badge ${task.priority}">${getPriorityLabel(task.priority)}</span>
          <span>${task.dueDate ? `Echeance : ${task.dueDate}` : 'Sans echeance'}</span>
        </div>
      </div>
      <button class="icon-btn" data-action="edit" data-id="${task.id}" title="Modifier">Edit</button>
      <button class="icon-btn delete" data-action="delete" data-id="${task.id}" title="Supprimer">X</button>
    `;

    list.appendChild(li);
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (!title) return showError('Le titre est obligatoire.');

  try {
    await apiRequest(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        priority: priorityInput.value,
        dueDate: dateInput.value || null
      })
    });

    form.reset();
    priorityInput.value = 'medium';
    await loadTasks();
  } catch (err) {
    showError(err.message);
  }
});

list.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const id = Number(target.dataset.id);
  const action = target.dataset.action;
  const task = tasks.find(item => item.id === id);

  try {
    if (action === 'toggle') {
      await apiRequest(`${api}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: target.checked })
      });
    }

    if (action === 'edit') {
      const newTitle = prompt('Nouveau titre :', task.title);
      if (!newTitle || !newTitle.trim()) return;

      await apiRequest(`${api}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      });
    }

    if (action === 'delete') {
      const ok = confirm(`Supprimer "${task.title}" ?`);
      if (!ok) return;

      await apiRequest(`${api}/${id}`, { method: 'DELETE' });
    }

    await loadTasks();
  } catch (err) {
    showError(err.message);
  }
});

for (const btn of filters) {
  btn.addEventListener('click', () => {
    for (const item of filters) item.classList.remove('active');

    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
}

searchInput.addEventListener('input', renderTasks);
loadTasks();
