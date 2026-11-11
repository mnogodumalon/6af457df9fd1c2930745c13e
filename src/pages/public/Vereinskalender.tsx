import { useEffect, useMemo, useState } from 'react';
import {
  addDays, addMonths, endOfMonth, format, isSameDay, isSameMonth, parseISO,
  startOfDay, startOfMonth, startOfWeek,
} from 'date-fns';
import {
  IconCalendarEvent, IconChevronLeft, IconChevronRight, IconClock, IconExternalLink,
  IconMail, IconMapPin, IconUser,
} from '@tabler/icons-react';
import { PublicShell } from '@/components/PublicShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { tx, dateFnsLocale } from '@/i18n';
import {
  loadPublicPagesConfig, PageUnavailableError,
  type PublicPagesConfig, type PublicPageConfig,
} from '@/lib/publicClient';
import { createPublicPort } from '@/lib/journey/publicPort';
import { fieldDate, fieldLookup, fieldText, type JourneyRecord } from '@/lib/journey';

const SLUG = 'vereinskalender';

interface Termin {
  id: string;
  titel: string;
  kategorie: string;
  kategorieLabel: string;
  start: Date;
  end: Date;
  ganztaegig: boolean;
  ort: string;
  adresse: string;
  beschreibung: string;
  ansprechpartner: string;
  email: string;
  weblink: string;
}

const TONES: Record<string, { chip: string; dot: string }> = {
  versammlung: { chip: 'bg-blue-100 text-blue-900', dot: 'bg-blue-500' },
  training: { chip: 'bg-emerald-100 text-emerald-900', dot: 'bg-emerald-500' },
  fest_feier: { chip: 'bg-pink-100 text-pink-900', dot: 'bg-pink-500' },
  ausflug: { chip: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
  wettkampf: { chip: 'bg-red-100 text-red-900', dot: 'bg-red-500' },
  sonstiges: { chip: 'bg-slate-200 text-slate-900', dot: 'bg-slate-500' },
};
const toneOf = (k: string) => TONES[k] ?? TONES.sonstiges;

function toTermin(r: JourneyRecord): Termin | null {
  const b = fieldDate(r, 'beginn');
  if (!b) return null;
  const start = parseISO(b);
  if (isNaN(start.getTime())) return null;
  const e = fieldDate(r, 'ende');
  let end = e ? parseISO(e) : start;
  if (isNaN(end.getTime()) || end < start) end = start;
  const kat = fieldLookup(r, 'kategorie');
  const strasse = [fieldText(r, 'strasse'), fieldText(r, 'hausnummer')].filter(Boolean).join(' ');
  const stadt = [fieldText(r, 'plz'), fieldText(r, 'stadt')].filter(Boolean).join(' ');
  return {
    id: r.id,
    titel: fieldText(r, 'titel'),
    kategorie: kat?.key ?? 'sonstiges',
    kategorieLabel: kat?.label ?? '',
    start,
    end,
    ganztaegig: r.fields.ganztaegig === true,
    ort: fieldText(r, 'ort_name'),
    adresse: [strasse, stadt].filter(Boolean).join(', '),
    beschreibung: fieldText(r, 'beschreibung'),
    ansprechpartner: [fieldText(r, 'ansprechpartner_vorname'), fieldText(r, 'ansprechpartner_nachname')].filter(Boolean).join(' '),
    email: fieldText(r, 'kontakt_email'),
    weblink: fieldText(r, 'weblink'),
  };
}

function timeLabel(t: Termin): string {
  if (t.ganztaegig) return tx('Ganztägig');
  const s = format(t.start, 'HH:mm');
  return isSameDay(t.start, t.end) && t.end.getTime() === t.start.getTime() ? s : `${s}`;
}

function whenLabel(t: Termin): string {
  const d = (x: Date) => format(x, 'EEEE, d. MMMM yyyy', { locale: dateFnsLocale() });
  if (t.ganztaegig) {
    return isSameDay(t.start, t.end) ? `${d(t.start)} · ${tx('Ganztägig')}` : `${d(t.start)} – ${d(t.end)}`;
  }
  if (isSameDay(t.start, t.end)) {
    const same = t.end.getTime() === t.start.getTime();
    return `${d(t.start)}, ${format(t.start, 'HH:mm')}${same ? '' : ` – ${format(t.end, 'HH:mm')}`}`;
  }
  return `${d(t.start)}, ${format(t.start, 'HH:mm')} – ${d(t.end)}, ${format(t.end, 'HH:mm')}`;
}

export default function Vereinskalender() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [termine, setTermine] = useState<Termin[]>([]);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [open, setOpen] = useState<Termin | null>(null);

  useEffect(() => {
    loadPublicPagesConfig(SLUG)
      .then(c => {
        setCfg(c);
        setPage(c?.pages[SLUG] ?? null);
        setLoading(false);
      })
      .catch(e => {
        if (e instanceof PageUnavailableError) setUnavailable(true);
        setLoading(false);
      });
  }, []);

  const port = useMemo(() => (cfg && page ? createPublicPort(cfg, page) : null), [cfg, page]);

  useEffect(() => {
    if (!port) return;
    port.list('vereinstermine', { limit: 500 })
      .then(rs => {
        const list = rs.map(toTermin).filter((t): t is Termin => t !== null);
        list.sort((a, b) => a.start.getTime() - b.start.getTime());
        setTermine(list);
      })
      .catch(() => setUnavailable(true));
  }, [port]);

  const days = useMemo(() => {
    const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const last = endOfMonth(month);
    const out: Date[] = [];
    for (let d = first; d <= last || out.length % 7 !== 0; d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);

  const eventsOn = (day: Date) =>
    termine.filter(t => startOfDay(t.start) <= day && startOfDay(t.end) >= day);

  const monthEvents = useMemo(() => {
    const ms = startOfMonth(month);
    const me = endOfMonth(month);
    return termine.filter(t => t.start <= me && t.end >= ms);
  }, [termine, month]);

  if (loading || !cfg || !page || unavailable) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }

  const today = startOfDay(new Date());
  const weekdays = Array.from({ length: 7 }, (_, i) => format(addDays(startOfWeek(today, { weekStartsOn: 1 }), i), 'EEEEEE', { locale: dateFnsLocale() }));

  return (
    <PublicShell fullBleed>
      <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-4">
        <header className="mb-4 flex items-center gap-3">
          <IconCalendarEvent size={28} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight">{page.title || tx('Vereinskalender')}</h1>
            <p className="text-sm text-muted-foreground">{tx('Alle Termine unseres Vereins auf einen Blick')}</p>
          </div>
        </header>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label={tx('Vorheriger Monat')} onClick={() => setMonth(m => addMonths(m, -1))}>
              <IconChevronLeft size={18} />
            </Button>
            <Button variant="outline" size="icon" aria-label={tx('Nächster Monat')} onClick={() => setMonth(m => addMonths(m, 1))}>
              <IconChevronRight size={18} />
            </Button>
            <Button variant="outline" onClick={() => setMonth(startOfMonth(new Date()))}>{tx('Heute')}</Button>
          </div>
          <h2 className="text-lg font-semibold capitalize">{format(month, 'LLLL yyyy', { locale: dateFnsLocale() })}</h2>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-medium text-muted-foreground">
            {weekdays.map(w => <div key={w} className="py-2">{w}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map(day => {
              const evs = eventsOn(day);
              const inMonth = isSameMonth(day, month);
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={format(day, 'yyyy-MM-dd')}
                  className={`min-h-[3.5rem] min-w-0 border-b border-r p-1 sm:min-h-[6.5rem] ${inMonth ? '' : 'bg-muted/30 text-muted-foreground'}`}
                >
                  <div className="mb-1 flex justify-center sm:justify-start">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? 'bg-primary font-semibold text-primary-foreground' : ''}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  {/* Mobile: Punkte, ab sm: Titel-Chips */}
                  <div className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                    {evs.slice(0, 4).map(t => (
                      <button key={t.id} type="button" aria-label={t.titel} onClick={() => setOpen(t)} className={`h-2 w-2 rounded-full ${toneOf(t.kategorie).dot}`} />
                    ))}
                  </div>
                  <div className="hidden space-y-0.5 sm:block">
                    {evs.slice(0, 3).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setOpen(t)}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs ${toneOf(t.kategorie).chip}`}
                      >
                        {t.titel}
                      </button>
                    ))}
                    {evs.length > 3 && <div className="px-1 text-xs text-muted-foreground">{tx`+${evs.length - 3} weitere`}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <section className="mt-6">
          <h3 className="mb-2 text-base font-semibold">{tx('Termine in diesem Monat')}</h3>
          {monthEvents.length === 0 ? (
            <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{tx('In diesem Monat stehen keine Termine an.')}</p>
          ) : (
            <ul className="space-y-2">
              {monthEvents.map(t => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(t)}
                    className="flex w-full min-w-0 items-center gap-3 rounded-xl border bg-card p-3 text-left hover:bg-muted/50"
                  >
                    <div className="w-12 shrink-0 text-center">
                      <div className="text-lg font-bold leading-none">{format(t.start, 'd')}</div>
                      <div className="text-xs uppercase text-muted-foreground">{format(t.start, 'MMM', { locale: dateFnsLocale() })}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{t.titel}</div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span>{timeLabel(t)}</span>
                        {t.ort && <span>· {t.ort}</span>}
                      </div>
                    </div>
                    {t.kategorieLabel && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${toneOf(t.kategorie).chip}`}>{t.kategorieLabel}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Dialog open={!!open} onOpenChange={o => { if (!o) setOpen(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.titel}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2">
                  {open.kategorieLabel && (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${toneOf(open.kategorie).chip}`}>{open.kategorieLabel}</span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <IconClock size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{whenLabel(open)}</span>
                </div>
                {(open.ort || open.adresse) && (
                  <div className="flex gap-2">
                    <IconMapPin size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      {open.ort && <div className="font-medium">{open.ort}</div>}
                      {open.adresse && <div className="text-muted-foreground">{open.adresse}</div>}
                    </div>
                  </div>
                )}
                {open.beschreibung && <p className="whitespace-pre-line">{open.beschreibung}</p>}
                {open.ansprechpartner && (
                  <div className="flex gap-2">
                    <IconUser size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{tx('Ansprechpartner')}: {open.ansprechpartner}</span>
                  </div>
                )}
                {open.email && (
                  <div className="flex gap-2">
                    <IconMail size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <a className="min-w-0 break-all text-primary underline" href={`mailto:${open.email}`}>{open.email}</a>
                  </div>
                )}
                {open.weblink && (
                  <div className="flex gap-2">
                    <IconExternalLink size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <a className="min-w-0 break-all text-primary underline" href={open.weblink} target="_blank" rel="noopener noreferrer">{open.weblink}</a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
}
