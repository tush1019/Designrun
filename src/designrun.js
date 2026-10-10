const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

export function normalizeTask(task, fallbackIndex = 0) {
  const title = String(task?.title ?? '').trim();

  if (!title) {
    throw new Error('Task title is required.');
  }

  const status = VALID_STATUSES.includes(task?.status) ? task.status : 'todo';
  const priority = VALID_PRIORITIES.includes(task?.priority) ? task.priority : 'medium';
  const estimateHours = Number(task?.estimateHours ?? 1);
  const assignee = String(task?.assignee ?? 'Unassigned').trim() || 'Unassigned';
  const tags = Array.isArray(task?.tags) ? task.tags.map(String).filter(Boolean) : [];

  return {
    id: String(task?.id ?? `task-${fallbackIndex + 1}`),
    title,
    status,
    priority,
    estimateHours: Number.isFinite(estimateHours) ? Math.max(1, Math.round(estimateHours)) : 1,
    assignee,
    tags,
    createdAt: task?.createdAt ?? new Date().toISOString(),
  };
}

export function createDesignBoard(initialTasks = []) {
  const board = {
    tasks: initialTasks.map((task, index) => normalizeTask(task, index)),
  };

  board.addTask = function addTask(taskData) {
    const newTask = normalizeTask(taskData, this.tasks.length);
    this.tasks.push(newTask);
    return newTask;
  };

  board.updateTask = function updateTask(id, updates = {}) {
    const task = this.tasks.find((candidate) => candidate.id === String(id));

    if (!task) {
      throw new Error(`Task ${id} was not found.`);
    }

    Object.assign(task, normalizeTask({ ...task, ...updates }, this.tasks.indexOf(task)));
    return task;
  };

  board.removeTask = function removeTask(id) {
    const taskIndex = this.tasks.findIndex((task) => task.id === String(id));

    if (taskIndex === -1) {
      return false;
    }

    this.tasks.splice(taskIndex, 1);
    return true;
  };

  board.archiveDoneTasks = function archiveDoneTasks() {
    const remainingTasks = this.tasks.filter((task) => task.status !== 'done');
    const archivedCount = this.tasks.length - remainingTasks.length;
    this.tasks = remainingTasks;
    return archivedCount;
  };

  board.getSummary = function getSummary() {
    const counts = {
      total: this.tasks.length,
      todo: 0,
      inProgress: 0,
      done: 0,
      highPriority: 0,
    };

    for (const task of this.tasks) {
      if (task.status === 'todo') counts.todo += 1;
      if (task.status === 'in-progress') counts.inProgress += 1;
      if (task.status === 'done') counts.done += 1;
      if (task.priority === 'high') counts.highPriority += 1;
    }

    return counts;
  };

  return board;
}

export function addTask(board, taskData) {
  return board.addTask(taskData);
}

export function updateTask(board, id, updates) {
  return board.updateTask(id, updates);
}

export function removeTask(board, id) {
  return board.removeTask(id);
}

export function archiveDoneTasks(board) {
  return board.archiveDoneTasks();
}
