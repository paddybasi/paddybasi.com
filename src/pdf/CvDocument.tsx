import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { dateRange, orgName, projectName, splitNameRole } from '../lib/format';
import type { Resume } from '../lib/resume';

// Built-in Helvetica keeps the build offline-safe and ATS parsers happy.
const accent = '#6d28d9';
const muted = '#5b5b6b';

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 44, paddingHorizontal: 44, fontFamily: 'Helvetica', fontSize: 9.5, lineHeight: 1.45, color: '#16161d' },
  name: { fontFamily: 'Helvetica-Bold', fontSize: 24, letterSpacing: -0.5, lineHeight: 1.2 },
  label: { fontSize: 12, color: accent, marginTop: 4, lineHeight: 1.2 },
  contact: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, color: muted, fontSize: 8.5 },
  contactItem: { marginRight: 12 },
  link: { color: muted, textDecoration: 'none' },
  rule: { height: 2, backgroundColor: accent, marginTop: 12, marginBottom: 4, width: 48 },
  h2: { fontFamily: 'Helvetica-Bold', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: accent, marginTop: 14, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  bold: { fontFamily: 'Helvetica-Bold' },
  small: { fontSize: 8.5, color: muted },
  role: { marginBottom: 9 },
  bullet: { flexDirection: 'row', marginTop: 1.5, paddingRight: 8 },
  dot: { width: 10, color: accent },
  skillRow: { flexDirection: 'row', marginBottom: 3 },
  skillName: { width: 104, fontFamily: 'Helvetica-Bold' },
  quote: { fontFamily: 'Helvetica-Oblique', marginBottom: 2 },
  footer: { position: 'absolute', bottom: 20, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: muted },
});

/** Roles shown with full highlights; older ones are condensed to one line to keep the CV tight. */
const DETAILED_ROLES = 10;

export default function CvDocument({ resume }: { resume: Resume }) {
  const { basics, work = [], skills = [], education = [], references = [], interests = [] } = resume;
  const loc = [basics.location?.city, basics.location?.region].filter(Boolean).join(', ');
  const site = basics.url?.replace(/^https?:\/\//, '');
  const quotes = references.filter((r) => r.reference.length > 40).slice(0, 3);

  return (
    <Document title={`${basics.name} – CV`} author={basics.name} subject={basics.label} creator={site}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{basics.name}</Text>
        <Text style={s.label}>{basics.label}</Text>
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
            ?.filter((p) => ['linkedin', 'github'].includes(p.network.toLowerCase()))
            .map((p) => (
              <Link key={p.url} style={[s.link, s.contactItem]} src={p.url}>
                {p.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </Link>
            ))}
        </View>
        <View style={s.rule} />

        {basics.summary && (
          <>
            <Text style={s.h2}>Profile</Text>
            <Text>{basics.summary}</Text>
          </>
        )}

        <Text style={s.h2}>Skills</Text>
        {skills.map((sk) => (
          <View key={sk.name} style={s.skillRow} wrap={false}>
            <Text style={s.skillName}>{sk.name}</Text>
            <Text style={{ flex: 1 }}>{sk.keywords?.join(' · ')}</Text>
          </View>
        ))}

        <Text style={s.h2}>Experience</Text>
        {work.slice(0, DETAILED_ROLES).map((w) => {
          const project = projectName(w.name);
          return (
            <View key={`${w.name}${w.startDate}`} style={s.role}>
              <View wrap={false}>
                <View style={s.row}>
                  <Text style={s.bold}>{w.position}</Text>
                  <Text style={s.small}>{dateRange(w.startDate, w.endDate)}</Text>
                </View>
                <Text style={s.small}>
                  {orgName(w.name)}
                  {project ? ` · ${project}` : ''}
                  {w.location ? ` · ${w.location}` : ''}
                </Text>
                {w.summary && <Text style={{ marginTop: 2 }}>{w.summary}</Text>}
              </View>
              {w.highlights?.map((h) => (
                <View key={h} style={s.bullet} wrap={false}>
                  <Text style={s.dot}>•</Text>
                  <Text style={{ flex: 1 }}>{h}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {work.length > DETAILED_ROLES && (
          <>
            <Text style={s.h2}>Earlier career</Text>
            {work.slice(DETAILED_ROLES).map((w) => (
              <View key={`${w.name}${w.startDate}`} style={[s.row, { marginBottom: 2.5 }]} wrap={false}>
                <Text style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={s.bold}>{w.position}</Text>, {orgName(w.name)}
                </Text>
                <Text style={s.small}>{dateRange(w.startDate, w.endDate)}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={s.h2}>Education</Text>
        {education.map((e) => (
          <View key={e.institution} style={{ marginBottom: 5 }} wrap={false}>
            <View style={s.row}>
              <Text>
                <Text style={s.bold}>{[e.studyType, e.area].filter(Boolean).join(', ')}</Text>
                {e.score ? ` (${e.score})` : ''}
              </Text>
              <Text style={s.small}>{dateRange(e.startDate, e.endDate)}</Text>
            </View>
            <Text style={s.small}>{e.institution}</Text>
            {e.courses?.length ? <Text style={s.small}>{e.courses.join(' · ')}</Text> : null}
          </View>
        ))}

        {quotes.length > 0 && (
          <View wrap={false}>
            <Text style={s.h2}>What colleagues say</Text>
            {quotes.map((r) => {
              const { name, role } = splitNameRole(r.name);
              return (
                <View key={r.name} style={{ marginBottom: 6 }}>
                  <Text style={s.quote}>“{r.reference}”</Text>
                  <Text style={s.small}>
                    {name}
                    {role ? `, ${role}` : ''}
                  </Text>
                </View>
              );
            })}
            <Text style={s.small}>Further references available upon request.</Text>
          </View>
        )}

        {interests.length > 0 && (
          <View wrap={false}>
            <Text style={s.h2}>Interests</Text>
            <Text>{interests.map((i) => i.name).join(' · ')}</Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>{basics.name}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
