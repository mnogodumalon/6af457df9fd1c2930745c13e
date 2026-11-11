// Auto-generated. Per-entity form-enhancements config for "Vereinstermine".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "kategorie", {"row": ["beginn", "ende"], "cols": "1fr 1fr"}, "ganztaegig", "ort_name", {"row": ["strasse", "hausnummer"], "cols": "3fr 1fr"}, {"row": ["plz", "stadt"], "cols": "1fr 2fr"}, {"row": ["ansprechpartner_vorname", "ansprechpartner_nachname"], "cols": "1fr 1fr"}, "kontakt_email", "weblink", "beschreibung"],
  defaults: {
    'beginn': { kind: 'today', withTime: true },
    'ganztaegig': { kind: 'literal', value: false },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
