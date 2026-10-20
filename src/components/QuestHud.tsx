import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { MAX_XP, QUESTS, UNLOCK_EVENT, levelOf, resetQuests, unlocked, xpOf } from '../lib/quests';
import { useRootAttr } from '../lib/useRootAttr';

interface Props {
  cvFilename: string;
}

type Toast = { key: number; title: string; detail: string; levelUp?: boolean };

const COLOURS = ['var(--violet)', 'var(--cyan)', 'var(--lime)'];
const INTRO_KEY = 'quests-intro';

function Confetti({ full = false }: { full?: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: full ? 120 : 24 }, (_, i) => ({
        '--x': full ? `${Math.random() * 100}vw` : `${(Math.random() * 2 - 1) * 140}px`,
        '--y': full ? '105vh' : `${-40 - Math.random() * 110}px`,
        '--r': `${Math.random() * 720 - 360}deg`,
        '--d': `${Math.random() * (full ? 1.2 : 0.15)}s`,
        background: COLOURS[i % COLOURS.length],
      })),
    [full],
  );
  return (
    <div
      aria-hidden="true"
      className={full ? 'pointer-events-none fixed inset-0 z-[80] overflow-hidden' : 'pointer-events-none absolute inset-0'}
    >
      {pieces.map((style, i) => (
        <span key={i} className={full ? 'confetti confetti-rain' : 'confetti confetti-pop'} style={style as CSSProperties} />
      ))}
    </div>
  );
}

const Trophy = (p: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
  </svg>
);

// ── Adventure mode extras ──

const SOUND_KEY = 'sound';
const isAdventure = () => document.documentElement.dataset.mode === 'adventure';
const soundOn = () => {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
};

let audio: AudioContext | undefined;
/** Original square-wave arpeggio, synthesised on the fly (no audio files). */
function playJingle(levelUp = false) {
  try {
    audio ??= new AudioContext();
    void audio.resume(); // stays silent if the browser hasn't seen a user gesture yet
    const notes = levelUp ? [523.25, 659.25, 783.99, 1046.5, 1318.51] : [659.25, 783.99, 987.77, 1318.51];
    const t0 = audio.currentTime + 0.02;
    notes.forEach((freq, i) => {
      const osc = audio!.createOscillator();
      const gain = audio!.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      const start = t0 + i * 0.09;
      const end = start + (i === notes.length - 1 ? 0.45 : 0.08);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.05, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(audio!.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    });
  } catch {
    // No Web Audio: stay quiet.
  }
}

// 7×6 pixel heart; `fill` is 0 (empty), 0.5 or 1.
const HEART_ROWS = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const HEART_PIXELS = HEART_ROWS.flatMap((row, y) => [...row].flatMap((c, x) => (c === '#' ? [[x, y]] : [])));
function PixelHeart({ fill, id }: { fill: number; id: string }) {
  return (
    <svg viewBox="0 0 7 6" className="h-3.5 w-4" shapeRendering="crispEdges" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect width={7 * fill} height="6" />
        </clipPath>
      </defs>
      <g fill="color-mix(in oklab, var(--fg) 18%, transparent)">
        {HEART_PIXELS.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
        ))}
      </g>
      <g fill="#ef4444" clipPath={`url(#${id})`}>
        {HEART_PIXELS.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
        ))}
      </g>
    </svg>
  );
}

const Gem = () => (
  <svg viewBox="0 0 5 6" className="h-3.5 w-3" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M2 0h1v1h1v1h1v2H4v1H3v1H2V5H1V4H0V2h1V1h1z" fill="var(--cyan)" />
    <path d="M2 1h1v1H2zM1 2h1v1H1z" fill="#fff" opacity=".7" />
  </svg>
);

/** Floating level badge, quest log, unlock toasts and confetti. */
export default function QuestHud({ cvFilename }: Props) {
  const [done, setDone] = useState(unlocked);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [party, setParty] = useState(0);
  const [sound, setSound] = useState(soundOn);
  const adventure = useRootAttr('mode') === 'adventure';
  const shell = useRef<HTMLDivElement>(null);
  const doneRef = useRef(done);
  doneRef.current = done;

  const xp = xpOf(done);
  const { level, title, progress, nextAt } = levelOf(xp);
  const complete = done.size >= QUESTS.length;

  const toast = (t: Omit<Toast, 'key'>) => {
    const key = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-2), { ...t, key }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.key !== key)), 4200);
  };

  useEffect(() => {
    const onUnlock = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const quest = QUESTS.find((q) => q.id === id);
      if (!quest) return;
      const before = levelOf(xpOf(doneRef.current));
      const next = unlocked();
      const after = levelOf(xpOf(next));
      setDone(next);
      toast({ title: quest.title, detail: `+${quest.xp} XP · Achievement unlocked` });
      if (after.level > before.level) toast({ title: `Level ${after.level}: ${after.title}`, detail: 'Level up!', levelUp: true });
      if (isAdventure() && soundOn()) playJingle(after.level > before.level);
      if (id === 'konami' || next.size === QUESTS.length) {
        setParty(Date.now());
        document.documentElement.classList.add('party');
        setTimeout(() => document.documentElement.classList.remove('party'), 6000);
      }
    };
    window.addEventListener(UNLOCK_EVENT, onUnlock);

    // One-time nudge for first-time visitors.
    let intro: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!localStorage.getItem(INTRO_KEY) && doneRef.current.size === 0) {
        intro = setTimeout(() => {
          toast({ title: 'Explore to level up', detail: `${QUESTS.length} achievements hidden around the site` });
          localStorage.setItem(INTRO_KEY, '1');
        }, 2500);
      }
    } catch {}

    return () => {
      window.removeEventListener(UNLOCK_EVENT, onUnlock);
      clearTimeout(intro);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => !shell.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [open]);

  const ring = 2 * Math.PI * 18;

  return (
    <>
      {party > 0 && <Confetti key={party} full />}

      {/* Toasts */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-24 z-[45] flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) =>
          adventure ? (
            // RPG dialogue box
            <div key={t.key} className="quest-toast adv-frame relative m-1 p-4 font-display">
              <Confetti />
              <p className="text-xs text-muted">{t.levelUp ? 'Level up!' : 'You found an achievement!'}</p>
              <p className="adv-type mt-1 text-lg leading-snug">
                {t.levelUp ? (
                  t.title
                ) : (
                  <>
                    {t.title} <span className="text-violet">{t.detail.split(' · ')[0]}</span>
                  </>
                )}
              </p>
              <span aria-hidden="true" className="adv-caret absolute right-3 bottom-2 text-xs text-violet">
                ▼
              </span>
            </div>
          ) : (
            <div
              key={t.key}
              className="quest-toast relative flex items-center gap-3 rounded-2xl border border-line bg-ink-2/95 p-3 pr-4 shadow-2xl shadow-violet/20 backdrop-blur-xl"
            >
              <Confetti />
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${t.levelUp ? 'bg-gradient-to-br from-violet via-cyan to-lime text-ink' : 'bg-lime/15 text-lime'}`}
              >
                <Trophy className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] tracking-widest text-muted uppercase">{t.detail}</span>
                <span className="block truncate font-display font-bold">{t.title}</span>
              </span>
            </div>
          ),
        )}
      </div>

      {/* Badge + quest log */}
      <div ref={shell} className="fixed right-4 bottom-4 z-40">
        {open && (
          <div
            id="quest-log"
            role="dialog"
            aria-label="Quest log"
            className={`quest-panel absolute right-0 bottom-full mb-3 w-[min(22rem,calc(100vw-2rem))] p-5 ${
              adventure ? 'adv-frame mb-4' : 'rounded-3xl border border-line bg-ink-2/95 shadow-2xl shadow-violet/20 backdrop-blur-xl'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <p className="font-display text-xl font-bold">Quest log</p>
              <p className="font-mono text-xs text-muted">
                {done.size}/{QUESTS.length} · {xp}/{MAX_XP} XP
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-fg/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet via-cyan to-lime transition-[width] duration-700"
                style={{ width: `${(xp / MAX_XP) * 100}%` }}
              />
            </div>

            <ul className="mt-4 max-h-[50vh] space-y-1 overflow-y-auto pr-1">
              {QUESTS.map((q) => {
                const got = done.has(q.id);
                const hidden = 'secret' in q && q.secret && !got;
                return (
                  <li key={q.id} className={`flex items-center gap-3 rounded-xl px-2 py-2 ${got ? '' : 'opacity-60'}`}>
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs ${got ? 'bg-lime/15 text-lime' : 'bg-fg/5 text-muted'}`}
                      aria-hidden="true"
                    >
                      {got ? '✓' : hidden ? '?' : '·'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{hidden ? 'Secret quest' : q.title}</span>
                      <span className="block truncate text-xs text-muted">{hidden ? 'Some codes never go out of style…' : q.hint}</span>
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {got && <span className="sr-only">Completed, </span>}+{q.xp}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 border-t border-line pt-4 text-sm">
              {complete ? (
                <p>
                  <span className="font-semibold text-lime">100% complete.</span> You found everything. Fancy talking about a role?{' '}
                  <a href="/#contact" onClick={() => setOpen(false)} className="font-semibold underline decoration-cyan underline-offset-4">
                    Get in touch
                  </a>
                </p>
              ) : !done.has('cv') ? (
                <p className="text-muted">
                  Tip: the{' '}
                  <a href="/cv.pdf" download={cvFilename} className="font-semibold text-fg underline decoration-cyan underline-offset-4">
                    CV
                  </a>{' '}
                  is worth 50 XP.
                </p>
              ) : (
                <p className="text-muted">Keep exploring: {QUESTS.length - done.size} to go.</p>
              )}
              <div className="mt-3 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    resetQuests();
                    setDone(new Set());
                  }}
                  className="font-mono text-[11px] text-muted underline-offset-4 hover:text-fg hover:underline"
                >
                  Reset progress
                </button>
                {adventure && (
                  <button
                    type="button"
                    aria-pressed={sound}
                    onClick={() => {
                      const next = !sound;
                      setSound(next);
                      try {
                        localStorage.setItem(SOUND_KEY, next ? 'on' : 'off');
                      } catch {}
                      if (next) playJingle();
                    }}
                    className="font-mono text-[11px] text-muted underline-offset-4 hover:text-fg hover:underline"
                  >
                    Sound: {sound ? 'on' : 'off'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          aria-expanded={open}
          aria-controls="quest-log"
          aria-label={`Quest log: level ${level}, ${title}, ${xp} XP`}
          onClick={() => setOpen((o) => !o)}
          className={
            adventure
              ? 'adv-frame m-1 flex flex-col items-end gap-1.5 px-3 py-2 transition hover:scale-105'
              : `group flex items-center gap-3 rounded-full border border-line bg-ink-2/90 p-1.5 shadow-xl shadow-violet/20 backdrop-blur-xl transition hover:scale-105 sm:pr-5 ${done.size === 0 ? 'quest-pulse' : ''}`
          }
        >
          {adventure ? (
            <>
              {/* Life meter: every quest fills half a heart. */}
              <span className="flex gap-0.5">
                {Array.from({ length: Math.ceil(QUESTS.length / 2) }, (_, i) => (
                  <PixelHeart key={i} id={`heart-${i}`} fill={Math.min(1, Math.max(0, (done.size - i * 2) / 2))} />
                ))}
              </span>
              <span className="flex items-center gap-1.5 font-display text-sm">
                <Gem /> {String(xp).padStart(3, '0')} <span className="text-xs text-muted">· Lv {level}</span>
              </span>
            </>
          ) : (
            <>
              <span className="relative grid size-11 place-items-center">
                <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden="true">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-fg/10" />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="url(#quest-grad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={ring}
                    strokeDashoffset={ring * (1 - progress)}
                    className="transition-[stroke-dashoffset] duration-700"
                  />
                  <defs>
                    <linearGradient id="quest-grad">
                      <stop offset="0" stopColor="var(--violet)" />
                      <stop offset=".5" stopColor="var(--cyan)" />
                      <stop offset="1" stopColor="var(--lime)" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="font-display text-sm font-extrabold">{level}</span>
              </span>
              <span className="hidden text-left sm:block">
                <span className="block font-display text-sm leading-tight font-bold">{title}</span>
                <span className="block font-mono text-[10px] text-muted">{nextAt ? `${xp}/${nextAt} XP` : `${xp} XP · max level`}</span>
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
