import { useMemo, useState } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { IconCalendarEvent, IconCalendarWeek, IconMapPinOff, IconPlus } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatCard, StatCardRow } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { Button } from '@/components/ui/button';
import { CalendarWidget, useCalendar, type CalendarEvent, type CalendarTone } from '@/components/widgets/CalendarWidget';
import { ChartWidget, type ChartRow } from '@/components/widgets/ChartWidget';
import type { Vereinstermine } from '@/types/app';
import { formatDateTime } from '@/lib/formatters';
import { useClock, gruss, namen } from '@/lib/polish';
import { dateFnsLocale, tx, appLabel } from '@/i18n';

const TONES: Record<string, CalendarTone> = {
  versammlung: 'primary',
  training: 'success',
  fest_feier: 'warning',
  ausflug: 'default',
  wettkampf: 'destructive',
};

type Filter = 'all' | 'week' | 'month' | 'noplace';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { vereinstermine } = data;
  const crud = useEntityCrud(data);
  const clock = useClock();
  const cal = useCalendar({ initialView: 'month' });
  const [filter, setFilter] = useState<Filter>('all');

  const nowKey = format(clock, "yyyy-MM-dd'T'HH:mm");
  const monthKey = format(clock, 'yyyy-MM');
  const weekEndKey = format(addDays(clock, 7), "yyyy-MM-dd'T'HH:mm");

  const sorted = useMemo(
    () => vereinstermine
      .filter(r => !!r.fields.beginn)
      .slice()
      .sort((a, b) => (a.fields.beginn ?? '').localeCompare(b.fields.beginn ?? '')),
    [vereinstermine],
  );

  const upcoming = useMemo(() => sorted.filter(r => (r.fields.ende ?? r.fields.beginn ?? '') >= nowKey), [sorted, nowKey]);
  const inWeek = upcoming.filter(r => (r.fields.beginn ?? '') <= weekEndKey);
  const inMonth = sorted.filter(r => (r.fields.beginn ?? '').startsWith(monthKey));
  const noPlace = upcoming.filter(r => !r.fields.ort_name && !r.fields.stadt);

  const listItems = filter === 'week' ? inWeek : filter === 'month' ? inMonth : filter === 'noplace' ? noPlace : upcoming;

  const events = useMemo<CalendarEvent[]>(
    () => sorted.map(r => ({
      id: `vereinstermine:${r.record_id}`,
      start: r.fields.beginn!,
      end: r.fields.ende,
      allDay: !!r.fields.ganztaegig,
      title: r.fields.titel ?? tx('Ohne Titel'),
      subtitle: r.fields.ort_name,
      tone: TONES[r.fields.kategorie?.key ?? ''] ?? 'default',
    })),
    [sorted],
  );

  const rows = useMemo<ChartRow<Vereinstermine>[]>(
    () => vereinstermine.map(r => ({ id: `vereinstermine:${r.record_id}`, data: r })),
    [vereinstermine],
  );

  const openById = (id: string) => {
    const rec = vereinstermine.find(r => r.record_id === id);
    if (rec) crud.vereinstermine.openDetail(rec);
  };

  const toggle = (f: Filter) => setFilter(cur => (cur === f ? 'all' : f));

  const next = upcoming[0];
  const dayLabel = (r: Vereinstermine) => {
    try { return format(parseISO(r.fields.beginn!), 'EE d. MMM', { locale: dateFnsLocale() }); } catch { return ''; }
  };
  const context = next
    ? upcoming.length > 1
      ? tx`Als Nächstes: ${next.fields.titel ?? ''} (${dayLabel(next)}) – danach ${namen(upcoming.slice(1, 3).map(r => r.fields.titel ?? ''))}.`
      : tx`Als Nächstes: ${next.fields.titel ?? ''} (${dayLabel(next)}).`
    : tx('Aktuell sind keine Termine geplant.');

  const listTitle = filter === 'week' ? tx('Nächste 7 Tage')
    : filter === 'month' ? tx('Termine im aktuellen Monat')
    : filter === 'noplace' ? tx('Ohne Ortsangabe')
    : tx('Anstehende Termine');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.vereinstermine.canWrite && (
          <Button onClick={() => crud.vereinstermine.openCreate({})}>
            <IconPlus size={16} className="shrink-0" />
            <span>{tx('Neuer Termin')}</span>
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="split"
        kpis={
          <StatCardRow>
            <StatCard
              title={tx('Nächste 7 Tage')}
              value={inWeek.length}
              description={inWeek.length > 0 ? tx`Zuerst: ${inWeek[0].fields.titel ?? ''}` : tx('Nichts geplant')}
              icon={<IconCalendarWeek size={18} className="text-muted-foreground" />}
              onClick={() => toggle('week')}
              active={filter === 'week'}
            />
            <StatCard
              title={tx('Im aktuellen Monat')}
              value={inMonth.length}
              description={format(clock, 'LLLL yyyy', { locale: dateFnsLocale() })}
              icon={<IconCalendarEvent size={18} className="text-muted-foreground" />}
              onClick={() => toggle('month')}
              active={filter === 'month'}
            />
            <StatCard
              title={tx('Ohne Ortsangabe')}
              value={noPlace.length}
              description={noPlace.length > 0 ? tx('Ort ergänzen') : tx('Alles vollständig')}
              icon={<IconMapPinOff size={18} className="text-muted-foreground" />}
              tone={noPlace.length > 0 ? 'warning' : 'default'}
              onClick={() => toggle('noplace')}
              active={filter === 'noplace'}
            />
          </StatCardRow>
        }
        aside={
          <>
            <WorkList
              title={listTitle}
              max={6}
              items={listItems.map(r => ({
                id: r.record_id,
                title: r.fields.titel ?? tx('Ohne Titel'),
                secondLine: (
                  <>
                    <span className="font-medium">{formatDateTime(r.fields.beginn)}</span>
                    {r.fields.ort_name && <span className="text-muted-foreground"> · {r.fields.ort_name}</span>}
                  </>
                ),
              }))}
              onItemClick={openById}
              empty={{
                text: tx('Keine passenden Termine.'),
                ...(crud.vereinstermine.canWrite
                  ? { action: { label: tx('Termin anlegen'), onClick: () => crud.vereinstermine.openCreate({}) } }
                  : {}),
              }}
            />
            <ChartWidget<Vereinstermine>
              title={tx('Termine nach Kategorie')}
              rows={rows}
              dimension={{ kind: 'category', accessor: r => r.data.fields.kategorie, label: tx('Kategorie') }}
            />
          </>
        }
        primary={
          <CalendarWidget
            events={events}
            view={cal.view}
            referenceDate={cal.cursor}
            locale={dateFnsLocale()}
            onViewChange={cal.setView}
            onCursorChange={cal.setCursor}
            onEventClick={ev => openById(ev.id.split(':')[1] ?? '')}
            onEmptyClick={crud.vereinstermine.canWrite
              ? date => crud.vereinstermine.openCreate({ beginn: format(date, "yyyy-MM-dd'T'HH:mm") })
              : undefined}
          />
        }
      />
      {crud.surfaces}
    </div>
  );
}
