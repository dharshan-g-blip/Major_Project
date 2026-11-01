/**
 * Formats doctor names into elegant monogram card metadata
 * e.g. "Dr. Ananya Sharma" -> { initials: 'AS', shortName: 'Dr. Sharma', subtitle: 'CLINICAL PSYCH' }
 *      "Dr. Rajesh Menon"  -> { initials: 'RM', shortName: 'Dr. Menon', subtitle: 'CLINICAL PSYCH' }
 *      "Dr. Priya Nair"    -> { initials: 'PN', shortName: 'Dr. Nair', subtitle: 'CLINICAL PSYCH' }
 */
export const getDoctorCardMeta = (fullName = '') => {
  const clean = (fullName || '').trim();
  const withoutDr = clean.replace(/^Dr\.?\s*/i, '');
  const parts = withoutDr.split(' ').filter(Boolean);

  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0]
      ? parts[0].slice(0, 2).toUpperCase()
      : 'DR';

  const lastName = parts.length >= 2 ? parts[parts.length - 1] : parts[0] || 'Clinician';
  const shortName = `Dr. ${lastName}`;

  return { initials, shortName, subtitle: 'CLINICAL PSYCH' };
};

export default getDoctorCardMeta;
