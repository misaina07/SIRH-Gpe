import React, { useState } from 'react';
import { apiPost } from '../../services/api';
import { CareerEvent, EmployeeCareerEvent } from '../../types/employee';
import { UserRole } from '../../types/sirh';

type Props =
  | { events: CareerEvent[] }
  | {
      employeeId: number;
      events: EmployeeCareerEvent[];
      role: UserRole;
      onCreated: () => Promise<void>;
    };

const colors: Record<CareerEvent['type'], string> = {
  hire: 'bg-blue-500',
  'probation-completed': 'bg-emerald-500',
  promotion: 'bg-violet-500',
  'department-change': 'bg-amber-500',
  'remote-work-amendment': 'bg-sky-500',
  'role-change': 'bg-indigo-500',
  'contract-end': 'bg-red-500',
};

function isApiTimeline(props: Props): props is Extract<Props, { employeeId: number }> {
  return 'employeeId' in props;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export const CareerTimeline: React.FC<Props> = (props) => {
  const [type, setType] = useState('PROMOTION');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const addEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isApiTimeline(props)) return;

    setBusy(true);
    setError(null);
    try {
      await apiPost(`/employees/${props.employeeId}/career`, {
        type,
        eventDate: date,
        title,
        description: description || null,
      });
      setTitle('');
      setDescription('');
      await props.onCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  };

  if (!isApiTimeline(props)) {
    const events = props.events.slice().sort((first, second) =>
      second.occurredAt.localeCompare(first.occurredAt));

    return (
      <section className="rounded-2xl border border-border-default bg-surface-card p-5 shadow-sm">
        <h2 className="mb-5 font-bold text-text-primary">Parcours professionnel</h2>
        {events.length === 0 ? (
          <p className="text-sm text-text-muted">Aucun événement de carrière enregistré.</p>
        ) : (
          <ol className="space-y-5">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3">
                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${colors[event.type]}`} />
                <div>
                  <p className="text-xs font-semibold uppercase text-text-muted">
                    {formatDate(event.occurredAt)}
                  </p>
                  <h3 className="mt-1 font-semibold text-text-primary">{event.title}</h3>
                  {event.description && (
                    <p className="mt-1 text-sm text-text-secondary">{event.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Historique de carrière</h3>
        <p className="text-sm text-slate-500">
          Les événements sont ajoutés au journal immuable du dossier.
        </p>
      </div>

      {props.role === 'RH' && (
        <form onSubmit={addEvent} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Type
            <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border p-2">
              {['PROMOTION', 'MOBILITE', 'CHANGEMENT_MANAGER', 'AVENANT', 'PERIODE_ESSAI', 'FORMATION', 'AUTRE'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Date
            <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="rounded-lg border p-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Intitulé
            <input required value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border p-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Détails
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="rounded-lg border p-2" />
          </label>
          {error && <p role="alert" className="text-sm text-red-700 md:col-span-2">{error}</p>}
          <button disabled={busy} className="justify-self-start rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            Ajouter à l’historique
          </button>
        </form>
      )}

      {props.events.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun événement de carrière enregistré.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {props.events.map((event) => (
            <li key={event.id} className="border-l-2 border-blue-200 pb-2 pl-5">
              <p className="font-semibold text-slate-900">{event.title}</p>
              <p className="text-xs uppercase tracking-wide text-blue-700">
                {event.type} · {event.eventDate}
              </p>
              {event.description && <p className="mt-1 text-sm text-slate-600">{event.description}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
