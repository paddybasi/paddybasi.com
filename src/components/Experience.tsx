import { useState } from 'react';
import { dateRange, durationLabel, projectName, shortTag } from '../lib/format';
import { unlock } from '../lib/quests';
import type { WorkItem } from '../lib/resume';

interface Props {
  work: WorkItem[];
  tags: string[];
}

// Every role is shown in full: a contractor's history is the point, so nothing hides behind a toggle.
export default function Experience({ work, tags }: Props) {
  const [tag, setTag] = useState<string | null>(null);

  const visible = tag ? work.filter((w) => w.tags.includes(tag)) : work;

  return (
    <div>
      <div role="group" aria-label="Filter roles by technology" className="mb-12 flex flex-wrap gap-2">
        {[null, ...tags].map((t) => {
          const active = t === tag;
          return (
            <button
              key={t ?? 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setTag(active ? null : t);
                if (t) unlock('filter');
              }}
              className={`rounded-full border px-4 py-1.5 font-mono text-xs transition ${
                active
                  ? 'border-transparent bg-fg text-ink'
                  : 'border-line bg-fg/[0.03] text-muted hover:border-fg/30 hover:text-fg'
              }`}
            >
              {t ? shortTag(t) : 'All roles'}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="sr-only">
        Showing {visible.length} of {work.length} roles{tag ? ` using ${tag}` : ''}
      </p>

      <ol className="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-gradient-to-b before:from-cyan/60 before:to-transparent sm:space-y-8">
        {visible.map((w) => {
          const project = projectName(w.name);
          return (
            <li key={`${w.name}-${w.startDate}`} className="relative pl-10">
              <span
                aria-hidden="true"
                className="absolute top-8 left-0 size-[15px] rounded-full border-2 border-ink bg-cyan"
              />
              <article className="card p-6 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-xs text-muted">
                  <span className="text-cyan">{dateRange(w.startDate, w.endDate)}</span>
                  <span>
                    {durationLabel(w.startDate, w.endDate)}
                    {w.location && ` · ${w.location}`}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">{w.position}</h3>
                <p className="mt-1 text-fg/80">
                  {w.url ? (
                    <a href={w.url} target="_blank" rel="noopener" className="underline decoration-line underline-offset-4 transition hover:decoration-cyan">
                      {w.org}
                    </a>
                  ) : (
                    w.org
                  )}
                  {project && <span className="text-muted"> · {project}</span>}
                </p>
                {w.summary && <p className="mt-4 leading-relaxed text-muted">{w.summary}</p>}

                {!!w.highlights?.length && (
                  <ul aria-label="Key contributions" className="mt-5 space-y-2.5 text-base leading-relaxed text-fg/80">
                    {w.highlights.map((h) => (
                      <li key={h} className="flex gap-3">
                        <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-cyan" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}

                {!!w.tags.length && (
                  <ul aria-label="Technologies" className="mt-6 flex flex-wrap gap-1.5">
                    {w.tags.map((t) => (
                      <li
                        key={t}
                        className={t === tag ? 'tag bg-cyan/20 text-cyan' : 'tag'}
                      >
                        {shortTag(t)}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
