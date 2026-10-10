const totalCount = document.querySelector('#totalCount');
const inProgressCount = document.querySelector('#inProgressCount');
const todoCount = document.querySelector('#todoCount');
const highPriorityCount = document.querySelector('#highPriorityCount');
const taskMeta = document.querySelector('#taskMeta');
const taskList = document.querySelector('#taskList');
const archiveButton = document.querySelector('#archiveButton');
const taskForm = document.querySelector('#taskForm');

async function loadSummary() {
  const response = await fetch('/api/summary');
  if (!response.ok) {
    throw new Error('Unable to fetch summary');
  }

  const summary = await response.json();
  totalCount.textContent = summary.total;
  inProgressCount.textContent = summary.inProgress;
  todoCount.textContent = summary.todo;
  highPriorityCount.textContent = summary.highPriority;
}

async function loadTasks() {
  const response = await fetch('/api/tasks');
  if (!response.ok) {
    throw new Error('Unable to load tasks');
  }

  const tasks = await response.json();
  taskMeta.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;

  taskList.innerHTML = tasks
    .map(
      (task) => `
        <li class="task-item">
          <div class="task-main">
            <strong>${task.title}</strong>
            <div class="task-meta">
              <span class="badge ${task.status}">${task.status === 'in-progress' ? 'in progress' : task.status}</span>
              <span class="badge ${task.priority}">${task.priority}</span>
              <span>${task.assignee}</span>
              <span>•</span>
              <span>${task.estimateHours}h</span>
            </div>
          </div>
          <div class="task-actions">
            <button type="button" data-action="toggle" data-id="${task.id}">${task.status === 'done' ? 'Reopen' : 'Complete'}</button>
            <button class="delete" type="button" data-action="delete" data-id="${task.id}">Delete</button>
          </div>
        </li>
      `,
    )
    .join('');

  await loadSummary();
}

async function handleTaskAction(event) {
  const target = event.target.closest('button');
  if (!target) {
    return;
  }

  const { action, id } = target.dataset;

  if (!action || !id) {
    return;
  }

  if (action === 'delete') {
    await fetch(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadTasks();
    return;
  }

  if (action === 'toggle') {
    const task = (await fetch('/api/tasks').then((response) => response.json())).find((entry) => entry.id === id);
    if (!task) {
      return;
    }

    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadTasks();
  }
}

async function handleCreateTask(event) {
  event.preventDefault();

  const formData = new FormData(taskForm);
  const payload = {
    title: formData.get('title').trim(),
    assignee: formData.get('assignee').trim() || 'Unassigned',
    estimateHours: Number(formData.get('estimateHours')) || 1,
    priority: formData.get('priority'),
    status: formData.get('status'),
    tags: [formData.get('priority')],
  };

  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  taskForm.reset();
  await loadTasks();
}

archiveButton.addEventListener('click', async () => {
  const response = await fetch('/api/tasks');
  const tasks = await response.json();
  const doneTasks = tasks.filter((task) => task.status === 'done');

  if (doneTasks.length === 0) {
    return;
  }

  for (const task of doneTasks) {
    await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, { method: 'DELETE' });
  }

  await loadTasks();
});

taskList.addEventListener('click', handleTaskAction);
taskForm.addEventListener('submit', handleCreateTask);

loadTasks().catch((error) => {
  console.error(error);
});
