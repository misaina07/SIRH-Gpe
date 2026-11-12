import React, { useMemo } from 'react';
import { CareerEvent } from '../../types/employee';

interface CareerTimelineProps {
  events: CareerEvent[];
}

const eventColors: Record<CareerEvent['type'], string> = {
  hire: 'bg-blue-500',
  'probation-completed': 'bg-emerald-500',
  promotion: 'bg-violet-500',
  'department-change': 'bg-amber-500',
  'remote-work-amendment': 'bg-sky-500',
  'role-change': 'bg-indigo-500',
  'contract-end': 'bg-red-500',
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export const CareerTimeline: React.FC<CareerTimelineProps> = ({ events }) => {
  const sortedEvents = useMemo(
    () => events.slice().sort((first, second) => second.occurredAt.localeCompare(first.occurredAt)),
    [events],
  );

  return (
    <section className="rounded-2xl border border-border-default bg-surface-card p-5 shadow-sm">
      <h2 className="mb-5 font-bold text-text-primary">Parcours professionnel</h2>

      {sortedEvents.length === 0 ? (
        <p className="text-sm text-text-muted">Aucun événement de carrière enregistré.</p>
      ) : (
        <ol className="space-y-5">
          {sortedEvents.map((event) => (
            <li key={event.id} className="relative flex gap-3">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${eventColors[event.type]}`} />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {formatDate(event.occurredAt)}
                </p>
                <h3 className="mt-1 font-semibold text-text-primary">{event.title}</h3>
                {event.description && (
                  <p className="mt-1 text-sm leading-5 text-text-secondary">
                    {event.description}
                  </p>
                )}
                {event.authorName && (
                  <p className="mt-1 text-xs text-text-muted">Par {event.authorName}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
