/**
 * Maps any known stored health-condition string (persisted in any supported
 * locale) to a canonical key in the `onboarding` translation namespace.
 *
 * When users completed onboarding before i18n was wired up the values were
 * hardcoded in Spanish, so Spanish → key entries are required for back-compat.
 * Going forward the onboarding page stores locale-aware strings, so the
 * English → key entries handle those newer records.
 *
 * Lookup is always lower-cased + trimmed for robustness.
 */
export const HEALTH_TAG_KEY_MAP: Record<string, string> = {
  // ── Medical conditions ────────────────────────────────────────────────────
  // Spanish (legacy)
  'diabetes':             'conditionDiabetes',
  'hipertensión':         'conditionHypertension',
  'asma':                 'conditionAsthma',
  'artritis':             'conditionArthritis',
  'enfermedad cardíaca':  'conditionHeartDisease',
  // English
  'hypertension':         'conditionHypertension',
  'asthma':               'conditionAsthma',
  'arthritis':            'conditionArthritis',
  'heart disease':        'conditionHeartDisease',

  // ── Injuries ──────────────────────────────────────────────────────────────
  // Spanish (legacy)
  'rodilla':              'injuryKnee',
  'espalda baja':         'injuryLowerBack',
  'hombro':               'injuryShoulder',
  'cadera':               'injuryHip',
  'tobillo':              'injuryAnkle',
  'cuello':               'injuryNeck',
  // English
  'knee':                 'injuryKnee',
  'lower back':           'injuryLowerBack',
  'shoulder':             'injuryShoulder',
  'hip':                  'injuryHip',
  'ankle':                'injuryAnkle',
  'neck':                 'injuryNeck',

  // ── Food allergies ────────────────────────────────────────────────────────
  // Spanish (legacy)
  'lácteos':              'allergyDairy',
  'nueces':               'allergyNuts',
  'mariscos':             'allergySeafood',
  'huevos':               'allergyEggs',
  'soja':                 'allergySoy',
  // English (and bilingual — gluten/soy are the same spelling)
  'gluten':               'allergyGluten',
  'dairy':                'allergyDairy',
  'nuts':                 'allergyNuts',
  'seafood':              'allergySeafood',
  'eggs':                 'allergyEggs',
  'soy':                  'allergySoy',

  // ── Generic "Other" (any category) ───────────────────────────────────────
  'otro':                 'conditionOther',
  'other':                'conditionOther',
};

/**
 * Returns the `onboarding` namespace translation key for a stored health tag,
 * or `null` if the tag is not in the known set.
 *
 * Usage inside a component:
 *   const t = useTranslations('onboarding');
 *   const display = resolveHealthTagKey(raw);
 *   return <span>{display ? t(display) : raw}</span>;
 */
export function resolveHealthTagKey(raw: string): string | null {
  return HEALTH_TAG_KEY_MAP[raw.trim().toLowerCase()] ?? null;
}
