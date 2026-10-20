// Site "quests": achievements visitors unlock by exploring. Progress lives in localStorage
// and unlocks are broadcast as a `quest:unlock` window event, so Astro scripts and React
// islands can all call `unlock()` without sharing state.

export const QUESTS = [
  { id: 'about', title: 'Origin story', hint: 'Read the About section', xp: 10 },
  { id: 'orb', title: 'Orb whisperer', hint: 'Click the 3D orb', xp: 20 },
  { id: 'skills', title: 'Inventory check', hint: 'Open the toolkit', xp: 10 },
  { id: 'spin', title: 'Spin doctor', hint: 'Drag the skills sphere', xp: 20 },
  { id: 'experience', title: 'Time traveller', hint: 'Reach the experience timeline', xp: 10 },
  { id: 'filter', title: 'Tech detective', hint: 'Filter roles by a technology', xp: 20 },
  { id: 'testimonials', title: 'Word of mouth', hint: 'Read what colleagues say', xp: 10 },
  { id: 'theme', title: 'Night shift', hint: 'Switch the colour theme', xp: 15 },
  { id: 'adventure', title: 'Grab your sword', hint: 'Turn on adventure mode', xp: 20 },
  { id: 'blog', title: 'Bookworm', hint: 'Finish a blog post', xp: 25 },
  { id: 'contact', title: 'Final boss', hint: 'Reach the contact section', xp: 10 },
  { id: 'cv', title: 'Loot acquired', hint: 'Download the CV', xp: 50 },
  { id: 'konami', title: 'Old-school gamer', hint: '↑ ↑ ↓ ↓ ← → ← → B A', xp: 50, secret: true },
] as const satisfies readonly { id: string; title: string; hint: string; xp: number; secret?: boolean }[];

export type QuestId = (typeof QUESTS)[number]['id'];

export const MAX_XP = QUESTS.reduce((sum, q) => sum + q.xp, 0);

const LEVELS = [
  { xp: 0, title: 'Visitor' },
  { xp: 40, title: 'Explorer' },
  { xp: 100, title: 'Scout' },
  { xp: 160, title: 'Talent hunter' },
  { xp: 220, title: 'Headhunter' },
] as const;

export function xpOf(ids: Iterable<string>): number {
  const set = new Set(ids);
  return QUESTS.reduce((sum, q) => sum + (set.has(q.id) ? q.xp : 0), 0);
}

/** Current level (1-based), its title, and progress (0–1) towards the next one. */
export function levelOf(xp: number): { level: number; title: string; progress: number; nextAt?: number } {
  const i = LEVELS.findLastIndex((l) => xp >= l.xp);
  const next = LEVELS[i + 1];
  return {
    level: i + 1,
    title: LEVELS[i].title,
    progress: next ? (xp - LEVELS[i].xp) / (next.xp - LEVELS[i].xp) : 1,
    nextAt: next?.xp,
  };
}

const KEY = 'quests';
export const UNLOCK_EVENT = 'quest:unlock';

export function unlocked(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function unlock(id: QuestId): void {
  const done = unlocked();
  if (done.has(id)) return;
  done.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...done]));
  } catch {
    // Storage blocked: the unlock still shows for this page view.
  }
  window.dispatchEvent(new CustomEvent(UNLOCK_EVENT, { detail: id }));
}

export function resetQuests(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
