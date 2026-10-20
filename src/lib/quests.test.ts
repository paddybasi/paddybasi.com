import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelOf, MAX_XP, xpOf } from './quests.ts';

test('xp and levels', () => {
  assert.equal(xpOf([]), 0);
  assert.equal(xpOf(['about', 'cv', 'unknown']), 60);
  assert.deepEqual(levelOf(0), { level: 1, title: 'Visitor', progress: 0, nextAt: 40 });
  assert.deepEqual(levelOf(70), { level: 2, title: 'Explorer', progress: 0.5, nextAt: 100 });
  // Finishing every quest reaches the top level.
  assert.equal(levelOf(MAX_XP).title, 'Headhunter');
  assert.equal(levelOf(MAX_XP).progress, 1);
});
