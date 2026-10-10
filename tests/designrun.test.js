import test from 'node:test';
import assert from 'node:assert/strict';

import { createDesignBoard } from '../src/designrun.js';

test('createDesignBoard tracks task totals and priorities', () => {
  const board = createDesignBoard([
    { id: 'a', title: 'Define concept', status: 'done', priority: 'high', estimateHours: 3, assignee: 'Ava' },
    { id: 'b', title: 'Wire the landing page', status: 'in-progress', priority: 'medium', estimateHours: 5, assignee: 'Milo' },
    { id: 'c', title: 'Review sprint notes', status: 'todo', priority: 'low', estimateHours: 2, assignee: 'Nia' },
  ]);

  assert.equal(board.tasks.length, 3);
  assert.deepEqual(board.getSummary(), {
    total: 3,
    todo: 1,
    inProgress: 1,
    done: 1,
    highPriority: 1,
  });
});

test('addTask and archiveDoneTasks behave as expected', () => {
  const board = createDesignBoard([
    { id: 'one', title: 'Ship first draft', status: 'done', priority: 'high', estimateHours: 4, assignee: 'Dana' },
    { id: 'two', title: 'Prototype interactions', status: 'todo', priority: 'medium', estimateHours: 6, assignee: 'Milo' },
  ]);

  const newTask = board.addTask({ title: 'Create style tile', status: 'todo', priority: 'high', assignee: 'Nia' });
  assert.equal(newTask.id, 'task-3');
  assert.equal(board.tasks.length, 3);

  const archived = board.archiveDoneTasks();
  assert.equal(archived, 1);
  assert.equal(board.tasks.length, 2);
  assert.equal(board.tasks.some((task) => task.id === 'one'), false);
});
