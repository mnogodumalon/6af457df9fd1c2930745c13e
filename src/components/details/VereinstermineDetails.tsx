import type { Vereinstermine } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface VereinstermineDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Vereinstermine;
}

export function VereinstermineDetails({
  record,
}: VereinstermineDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('vereinstermine', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('vereinstermine', 'kategorie')} value={record.fields.kategorie} format="pill" />
        <RecordField label={fieldLabel('vereinstermine', 'beginn')} value={record.fields.beginn} format="datetime" />
        <RecordField label={fieldLabel('vereinstermine', 'ende')} value={record.fields.ende} format="datetime" />
        <RecordField label={fieldLabel('vereinstermine', 'ganztaegig')} value={record.fields.ganztaegig} format="bool" />
        <RecordField label={fieldLabel('vereinstermine', 'ort_name')} value={record.fields.ort_name} format="text" />
        <RecordField label={fieldLabel('vereinstermine', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('vereinstermine', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('vereinstermine', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('vereinstermine', 'stadt')} value={record.fields.stadt} format="text" />
        <RecordField label={fieldLabel('vereinstermine', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('vereinstermine', 'ansprechpartner_vorname')} value={record.fields.ansprechpartner_vorname} format="text" />
        <RecordField label={fieldLabel('vereinstermine', 'ansprechpartner_nachname')} value={record.fields.ansprechpartner_nachname} format="text" />
        <RecordField label={fieldLabel('vereinstermine', 'kontakt_email')} value={record.fields.kontakt_email} format="email" />
        <RecordField label={fieldLabel('vereinstermine', 'weblink')} value={record.fields.weblink} format="url" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.VEREINSTERMINE} recordId={record.record_id} readOnly={!perms.canWrite('vereinstermine')} />
    </>
  );
}
