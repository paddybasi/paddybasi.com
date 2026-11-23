import { resolve } from 'node:path';
import { Document, Font, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { dateRange, durationLabel, projectName, shortTag, splitNameRole } from '../lib/format';
import type { Resume, WorkItem } from '../lib/resume';

// The site's fonts (DESIGN.md), as static files: react-pdf can't pick weights from the variable ones the site uses.
// Read from node_modules at build time, so nothing is downloaded and the text stays selectable for ATS parsers.
const font = (pkg: string, file: string) => resolve('node_modules/@fontsource', pkg, 'files', file);
Font.register({
  family: 'Bricolage',
  fonts: [700, 800].map((w) => ({ src: font('bricolage-grotesque', `bricolage-grotesque-latin-${w}-normal.woff`), fontWeight: w })),
});
Font.register({
  family: 'Inter',
  fonts: [
    ...[400, 600].map((w) => ({ src: font('inter', `inter-latin-${w}-normal.woff`), fontWeight: w })),
    { src: font('inter', 'inter-latin-400-italic.woff'), fontStyle: 'italic' },
  ],
});
Font.register({ family: 'Mono', fonts: [400, 500].map((w) => ({ src: font('jetbrains-mono', `jetbrains-mono-latin-${w}-normal.woff`), fontWeight: w })) });
// No mid-word hyphenation: keeps tech names (TypeScript, Kubernetes) whole for readers and keyword parsers.
Font.registerHyphenationCallback((word) => [word]);

// Light palette from global.css. PDFs have no alpha tints, so `line` and the tints are pre-mixed onto white.
const c = {
  fg: '#15141d',
  fg80: '#44434a',
  muted: '#5a596c',
  violet: '#7c3aed',
  cyan: '#0e7490',
  lime: '#4d7c0f',
  line: '#e8e8e8', // fg at 10%
  tint: '#f3f3f4', // fg at 5%
  limeTint: '#edf2e7', // lime at 10%
  limeLine: '#cad8b7', // lime at 30%
};

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 48, paddingHorizontal: 44, fontFamily: 'Inter', fontSize: 9, lineHeight: 1.5, color: c.fg },
  name: { fontFamily: 'Bricolage', fontWeight: 800, fontSize: 28, letterSpacing: -0.8, lineHeight: 1 },
  label: { fontWeight: 600, fontSize: 12, marginTop: 6, lineHeight: 1.2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 9999,
    borderWidth: 0.75,
    borderColor: c.limeLine,
    backgroundColor: c.limeTint,
    color: c.lime,
    fontSize: 8,
  },
  badgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.lime, marginRight: 5 },
  contact: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, fontFamily: 'Mono', fontSize: 7.5, color: c.muted },
  contactItem: { marginRight: 14 },
  link: { color: c.muted, textDecoration: 'none' },
  rule: { height: 0.75, backgroundColor: c.line, marginTop: 14 },
  // `eyebrow` utility: mono, uppercase, 0.25em tracking, cyan.
  eyebrow: { fontFamily: 'Mono', fontWeight: 500, fontSize: 7.5, letterSpacing: 1.9, textTransform: 'uppercase', color: c.cyan, marginTop: 18, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  meta: { fontFamily: 'Mono', fontSize: 7.5, color: c.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  // `tag` utility: mono micro chip on an fg/5 tint.
  tag: { fontFamily: 'Mono', fontSize: 6.75, color: c.muted, backgroundColor: c.tint, borderRadius: 3, paddingVertical: 1, paddingHorizontal: 4, marginRight: 3, marginBottom: 3 },
  skillRow: { flexDirection: 'row', marginBottom: 4 },
  skillName: { width: 96, fontWeight: 600, paddingTop: 1 },
  role: { paddingTop: 10, marginTop: 10, borderTopWidth: 0.75, borderTopColor: c.line },
  position: { fontFamily: 'Bricolage', fontWeight: 700, fontSize: 12, lineHeight: 1.2, marginTop: 4, letterSpacing: -0.2 },
  bullet: { flexDirection: 'row', marginTop: 2.5, paddingRight: 8 },
  // Short cyan dash, as on the site's highlights.
  dash: { width: 7, height: 0.75, backgroundColor: c.cyan, marginTop: 6, marginRight: 7 },
  score: { fontFamily: 'Mono', fontSize: 7, color: c.lime, borderWidth: 0.75, borderColor: c.limeLine, borderRadius: 3, paddingVertical: 0.5, paddingHorizontal: 4, marginLeft: 6 },
  quote: { borderLeftWidth: 1.5, borderLeftColor: c.violet, paddingLeft: 10, marginBottom: 8 },
  footer: { position: 'absolute', bottom: 22, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', fontFamily: 'Mono', fontSize: 7, color: c.muted },
});

const Tags = ({ items }: { items: string[] }) => (
  <View style={s.tags}>
    {items.map((t) => (
      <Text key={t} style={s.tag}>
        {t}
      </Text>
    ))}
  </View>
);

interface Props {
  resume: Resume;
  /** `derived.work`: every role, with the technology tags the site shows. */
  work: WorkItem[];
  available: boolean;
}

export default function CvDocument({ resume, work, available }: Props) {
  const { basics, skills = [], education = [], references = [], interests = [] } = resume;
  const loc = [basics.location?.city, basics.location?.region].filter(Boolean).join(', ');
  const site = basics.url?.replace(/^https?:\/\//, '');
  const quotes = references.filter((r) => r.reference.length > 40).slice(0, 3);
  const [first, ...rest] = basics.name.split(' ');

  return (
    <Document title={`${basics.name} – CV`} author={basics.name} subject={basics.label} creator={site}>
      <Page size="A4" style={s.page}>
        {/* The site's gradient surname, as flat brand violet. */}
        <Text style={s.name}>
          {first} <Text style={{ color: c.violet }}>{rest.join(' ')}</Text>
        </Text>
        <Text style={s.label}>{basics.label}</Text>
        {(available || basics.clearance) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
            {available && (
              <View style={[s.badge, { marginRight: 5 }]}>
                <View style={s.badgeDot} />
                <Text>Available for new contracts</Text>
              </View>
            )}
            {/* Neutral, not lime: lime means a current status, and this may describe a lapsed one. */}
            {basics.clearance && <Text style={[s.badge, { borderColor: c.line, backgroundColor: c.tint, color: c.muted }]}>{basics.clearance}</Text>}
          </View>
        )}
        <View style={s.contact}>
          {basics.email && (
            <Link style={[s.link, s.contactItem]} src={`mailto:${basics.email}`}>
              {basics.email}
            </Link>
          )}
          {basics.phone && <Text style={s.contactItem}>{basics.phone}</Text>}
          {loc && <Text style={s.contactItem}>{loc}</Text>}
          {basics.url && (
            <Link style={[s.link, s.contactItem]} src={basics.url}>
              {site}
            </Link>
          )}
          {basics.profiles
            ?.filter((p) => ['linkedin', 'github', 'company'].includes(p.network.toLowerCase()))
            .map((p) => (
              <Link key={p.url} style={[s.link, s.contactItem]} src={p.url}>
                {p.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </Link>
            ))}
        </View>
        <View style={s.rule} />

        {basics.summary && (
          <>
            <Text minPresenceAhead={48} style={s.eyebrow}>Profile</Text>
            <Text style={{ fontSize: 9.5, color: c.fg80 }}>{basics.summary}</Text>
          </>
        )}

        <Text minPresenceAhead={48} style={s.eyebrow}>Skills</Text>
        {skills.map((sk) => (
          <View key={sk.name} style={s.skillRow} wrap={false}>
            <Text style={s.skillName}>{sk.name}</Text>
            <View style={{ flex: 1, marginTop: -5 }}>
              <Tags items={sk.keywords ?? []} />
            </View>
          </View>
        ))}

        <Text minPresenceAhead={48} style={[s.eyebrow, { marginBottom: 0 }]}>Experience</Text>
        {/* Every role in full: contract history is the point for a contractor's CV. */}
        {work.map((w, i) => {
          const project = projectName(w.name);
          return (
            <View key={`${w.name}${w.startDate}`} style={[s.role, i === 0 ? { borderTopWidth: 0, marginTop: 0 } : {}]}>
              <View wrap={false}>
                <View style={s.row}>
                  <Text style={[s.meta, { color: c.cyan }]}>{dateRange(w.startDate, w.endDate)}</Text>
                  <Text style={s.meta}>
                    {durationLabel(w.startDate, w.endDate)}
                    {w.location ? ` · ${w.location}` : ''}
                  </Text>
                </View>
                <Text style={s.position}>{w.position}</Text>
                <Text style={{ marginTop: 1, color: c.fg80 }}>
                  {w.org}
                  {project ? <Text style={{ color: c.muted }}> · {project}</Text> : ''}
                </Text>
                {w.summary && <Text style={{ marginTop: 3, color: c.muted }}>{w.summary}</Text>}
              </View>
              {w.highlights?.map((h) => (
                <View key={h} style={s.bullet} wrap={false}>
                  <View style={s.dash} />
                  <Text style={{ flex: 1, color: c.fg80 }}>{h}</Text>
                </View>
              ))}
              {w.tags.length > 0 && (
                <View wrap={false} style={{ marginTop: 2 }}>
                  <Tags items={w.tags.map(shortTag)} />
                </View>
              )}
            </View>
          );
        })}

        <Text minPresenceAhead={48} style={s.eyebrow}>Education</Text>
        {education.map((e) => (
          <View key={e.institution} style={{ marginBottom: 6 }} wrap={false}>
            <View style={s.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontWeight: 600 }}>{[e.studyType, e.area].filter(Boolean).join(', ')}</Text>
                {e.score && <Text style={s.score}>{e.score}</Text>}
              </View>
              <Text style={s.meta}>{dateRange(e.startDate, e.endDate)}</Text>
            </View>
            <Text style={{ color: c.muted }}>{e.institution}</Text>
            {e.courses?.length ? <Tags items={e.courses} /> : null}
          </View>
        ))}

        {quotes.length > 0 && (
          <View wrap={false}>
            <Text minPresenceAhead={48} style={s.eyebrow}>What colleagues say</Text>
            {quotes.map((r) => {
              const { name, role } = splitNameRole(r.name);
              return (
                <View key={r.name} style={s.quote}>
                  <Text style={{ fontStyle: 'italic', color: c.fg80 }}>“{r.reference}”</Text>
                  <Text style={[s.meta, { marginTop: 3 }]}>
                    {name}
                    {role ? ` · ${role}` : ''}
                  </Text>
                </View>
              );
            })}
            <Text style={s.meta}>Further references available upon request.</Text>
          </View>
        )}

        {interests.length > 0 && (
          <View wrap={false}>
            <Text minPresenceAhead={48} style={[s.eyebrow, { marginBottom: 3 }]}>Interests</Text>
            <Tags items={interests.map((i) => i.name)} />
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>
            {basics.name}
            {site ? ` · ${site}` : ''}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
