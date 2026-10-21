// Single source of truth: the JSON Resume gist, fetched once at build time.
import { currentMonth, isAvailable, matchKeywords, monthsBetween, orgName, shortTag, splitNameRole, yearsSince } from './format.ts';

const RESUME_URL =
  import.meta.env.RESUME_URL ??
  'https://gist.githubusercontent.com/paddybasi/e2140aa3e8278ad9b65145f49b4f92d4/raw/resume.json';

export interface Profile { network: string; username: string; url: string }
export interface Work {
  name: string;
  position: string;
  location?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}
export interface Education {
  institution: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}
export interface Skill { name: string; level?: string; keywords?: string[] }
export interface Resume {
  basics: {
    name: string;
    label?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: { city?: string; region?: string; countryCode?: string };
    profiles?: Profile[];
  };
  work?: Work[];
  education?: Education[];
  skills?: Skill[];
  interests?: { name: string }[];
  references?: { name: string; reference: string }[];
}

async function load(): Promise<Resume> {
  const res = await fetch(RESUME_URL);
  if (!res.ok) throw new Error(`Failed to fetch resume from ${RESUME_URL}: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as Resume;
  if (!data?.basics?.name) throw new Error(`Resume at ${RESUME_URL} has no basics.name`);
  return data;
}

export const resume = await load();
export const cvFilename = 'Pardeep-Singh-Basi-CV.pdf'; // also set in netlify.toml (Content-Disposition)

const work = resume.work ?? [];
const keywords = (resume.skills ?? []).flatMap((s) => s.keywords ?? []);
const workText = (w: Work) => [w.position, w.summary, ...(w.highlights ?? [])].join(' ');

export const derived = {
  work: work.map((w) => ({ ...w, org: orgName(w.name), tags: matchKeywords(workText(w), keywords) })),
  years: yearsSince(work.map((w) => w.startDate)),
  available: isAvailable(work),
  publicSector: new Set(work.filter((w) => w.url?.includes('gov.uk')).map((w) => orgName(w.name))).size,
  clients: [...new Set(work.map((w) => orgName(w.name)))],
  // Real quotes only: "Available upon request." isn't a testimonial.
  testimonials: (resume.references ?? [])
    .filter((r) => r.reference.length > 40)
    .map((r) => ({ ...splitNameRole(r.name), quote: r.reference })),
  location: [resume.basics.location?.city, resume.basics.location?.region].filter(Boolean).join(', '),
  profile: (network: string) => resume.basics.profiles?.find((p) => p.network.toLowerCase() === network.toLowerCase()),
};

/** Keywords ranked by how many roles mention them; drives the experience filter. */
export const topTags = Object.entries(
  derived.work.flatMap((w) => w.tags).reduce<Record<string, number>>((acc, t) => ((acc[t] = (acc[t] ?? 0) + 1), acc), {}),
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)
  .map(([t]) => t);

export type WorkItem = (typeof derived.work)[number];

/** "Character stats": total months of roles that mention each top skill, most-used first. */
export const skillStats = topTags
  .map((tag) => ({
    label: shortTag(tag),
    months: derived.work
      .filter((w) => w.startDate && w.tags.includes(tag))
      .reduce((sum, w) => sum + monthsBetween(w.startDate!, w.endDate ?? currentMonth()), 0),
  }))
  .sort((a, b) => b.months - a.months)
  .slice(0, 8);
