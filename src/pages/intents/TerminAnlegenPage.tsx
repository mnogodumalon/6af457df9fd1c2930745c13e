/**
 * Termin anlegen — 5-Schritt-Wizard + Prüfen.
 * Steps: 1) Titel & Kategorie → 2) Beginn, Ende, ganztägig → 3) Ort → 4) Ansprechpartner & Kontakt → 5) Beschreibung → 6) Prüfen & anlegen.
 * Reads: —. Writes: vereinstermine (via useTerminAnlegenFlow).
 * Composes: IntentWizardShell, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { useTerminAnlegenFlow } from '@/lib/journey/flows/TerminAnlegen';
import { tx } from '@/i18n';

export default function TerminAnlegenPage() {
  const [step, setStep] = useState(1);
  const flow = useTerminAnlegenFlow({
    steps: {
      titel: 1, kategorie: 1,
      beginn: 2, ende: 2, ganztaegig: 2,
      ort_name: 3, strasse: 3, hausnummer: 3, plz: 3, stadt: 3,
      ansprechpartner_vorname: 4, ansprechpartner_nachname: 4, kontakt_email: 4, weblink: 4,
      beschreibung: 5,
    },
  });
  const f = flow.forms.vereinstermine;

  return (
    <IntentWizardShell
      title={tx('Termin anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Trage einen neuen Vereinstermin mit Zeit, Ort und Ansprechpartner ein.'),
        needs: [tx('Titel und Zeitpunkt'), tx('Ort und Ansprechpartner')],
      }}
    >
      <WizardStep label={tx('Titel')} description={tx('Wie heißt der Termin und um was für einen Termin handelt es sich?')}>
        <div className="space-y-4">
          <Bound form={f} name="titel" />
          <Bound form={f} name="kategorie" allowClear />
          <StepNav hideBack onNext={() => flow.validateStep(1)} nextStepLabel={tx('Zeitpunkt')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Zeitpunkt')} description={tx('Wann beginnt und endet der Termin? Bei ganztägigen Terminen kreuze das Feld an.')}>
        <div className="space-y-4">
          <Bound form={f} name="beginn" />
          <Bound form={f} name="ende" />
          <Bound form={f} name="ganztaegig" />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Ort')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Ort')} description={tx('Wo findet der Termin statt?')}>
        <div className="space-y-4">
          <Bound form={f} name="ort_name" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Bound form={f} name="strasse" />
            </div>
            <Bound form={f} name="hausnummer" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Bound form={f} name="plz" />
            <div className="sm:col-span-2">
              <Bound form={f} name="stadt" />
            </div>
          </div>
          <StepNav onBack={() => setStep(2)} onNext={() => flow.validateStep(3)} nextStepLabel={tx('Ansprechpartner')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Ansprechpartner')} description={tx('Wer ist Ansprechpartner und wie ist er oder sie erreichbar?')}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Bound form={f} name="ansprechpartner_vorname" />
            <Bound form={f} name="ansprechpartner_nachname" />
          </div>
          <Bound form={f} name="kontakt_email" />
          <Bound form={f} name="weblink" />
          <StepNav onBack={() => setStep(3)} onNext={() => flow.validateStep(4)} nextStepLabel={tx('Beschreibung')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Beschreibung')} description={tx('Ergänze, was die Mitglieder zum Termin wissen sollten.')}>
        <div className="space-y-4">
          <Bound form={f} name="beschreibung" rows={5} />
          <StepNav onBack={() => setStep(4)} onNext={() => flow.validateStep(5)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Der Termin wird gespeichert und erscheint sofort im Terminkalender des Vereins.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Weiteren Termin anlegen'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
