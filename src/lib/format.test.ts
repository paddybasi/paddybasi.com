import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dateRange,
  durationLabel,
  isAvailable,
  matchKeywords,
  orgName,
  projectName,
  splitNameRole,
  yearsSince,
} from './format.ts';

const now = new Date(2026, 9, 20); // Oct 2026

test('dates', () => {
  assert.equal(dateRange('2025-04', '2026-06'), 'Apr 2025 – Jun 2026');
  assert.equal(dateRange('2025-04'), 'Apr 2025 – Present');
  assert.equal(durationLabel('2025-04', '2026-06'), '1 yr 3 mos');
  assert.equal(durationLabel('2018-10', '2018-11'), '2 mos');
  assert.equal(durationLabel('2026-10', undefined, now), '1 mo');
  assert.equal(yearsSince(['2016-03', '2007-08', undefined], now), 19);
});

test('names', () => {
  assert.equal(orgName('Prices BAU Team – Office for National Statistics (ONS)'), 'Office for National Statistics (ONS)');
  assert.equal(projectName('Prices BAU Team – Office for National Statistics (ONS)'), 'Prices BAU Team');
  assert.equal(orgName('Parexel'), 'Parexel');
  assert.equal(projectName('Parexel'), undefined);
  assert.deepEqual(splitNameRole('Jane Doe – Lead'), { name: 'Jane Doe', role: 'Lead' });
});

test('availability', () => {
  assert.equal(isAvailable([{ endDate: '2026-06' }, { endDate: '2024-01' }], now), true);
  assert.equal(isAvailable([{ endDate: '2026-10' }], now), false);
  assert.equal(isAvailable([{ endDate: '2026-06' }, {}], now), false);
});

test('keyword matching', () => {
  const keys = ['Node.js', 'React', 'Angular', 'Git', 'Google Cloud Platform (GCP)', 'CI/CD', 'Docker', 'Agile / Scrum'];
  assert.deepEqual(
    matchKeywords('Built Node.js APIs on GCP with docker-compose, React/Redux and CI/CD in GitHub; AngularJS legacy.', keys),
    ['Node.js', 'React', 'Google Cloud Platform (GCP)', 'CI/CD', 'Docker'],
  );
  assert.deepEqual(matchKeywords('Scrum ceremonies', keys), ['Agile / Scrum']);
});
