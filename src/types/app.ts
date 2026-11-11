import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Vereinstermine {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    kategorie?: LookupValue;
    beginn?: string; // Format: YYYY-MM-DD oder ISO String
    ende?: string; // Format: YYYY-MM-DD oder ISO String
    ganztaegig?: boolean;
    ort_name?: string;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    stadt?: string;
    beschreibung?: string;
    ansprechpartner_vorname?: string;
    ansprechpartner_nachname?: string;
    kontakt_email?: string;
    weblink?: string;
  };
}

export const APP_IDS = {
  VEREINSTERMINE: '6af457d5fb1a6d6a3528c898',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'vereinstermine': {
    kategorie: [{ key: "versammlung", get label() { return lookupLabel('vereinstermine', 'kategorie', "versammlung") ?? "Versammlung"; } }, { key: "training", get label() { return lookupLabel('vereinstermine', 'kategorie', "training") ?? "Training"; } }, { key: "fest_feier", get label() { return lookupLabel('vereinstermine', 'kategorie', "fest_feier") ?? "Fest und Feier"; } }, { key: "ausflug", get label() { return lookupLabel('vereinstermine', 'kategorie', "ausflug") ?? "Ausflug"; } }, { key: "wettkampf", get label() { return lookupLabel('vereinstermine', 'kategorie', "wettkampf") ?? "Wettkampf"; } }, { key: "sonstiges", get label() { return lookupLabel('vereinstermine', 'kategorie', "sonstiges") ?? "Sonstiges"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'vereinstermine': {
    'titel': 'string/text',
    'kategorie': 'lookup/select',
    'beginn': 'date/datetimeminute',
    'ende': 'date/datetimeminute',
    'ganztaegig': 'bool',
    'ort_name': 'string/text',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'stadt': 'string/text',
    'beschreibung': 'string/textarea',
    'ansprechpartner_vorname': 'string/text',
    'ansprechpartner_nachname': 'string/text',
    'kontakt_email': 'string/email',
    'weblink': 'string/url',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateVereinstermine = StripLookup<Vereinstermine['fields']>;