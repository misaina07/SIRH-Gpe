import React, { useMemo, useState } from 'react';
import { TEAM_CALENDAR_EVENTS } from '../../data/employeeMockData';
import { TeamCalendarEvent, TeamCalendarEventType } from '../../types/employee';

type CalendarView = 'month' | 'week';

interface GlobalTeamCalendarProps {
  events?: TeamCalendarEvent[];
}

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const colors: Record<TeamCalendarEventType, string> = {
  office: 'border-green-200 bg-green-50 text-green-800',
  remote: 'border-blue-200 bg-blue-50 text-blue-800',
  leave: 'border-orange-200 bg-orange-50 text-orange-800',
  absence: 'border-red-200 bg-red-50 text-red-800',
  unavailable: 'border-gray-200 bg-gray-100 text-gray-700',
};

const labels: Record<TeamCalendarEventType, string> = {
  office: 'Bureau',
  remote: 'Télétravail',
  leave: 'Congé',
  absence: 'Absence',
  unavailable: 'Indisponible',
};

function dayOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function mondayOf(date: Date) {
  const monday = dayOnly(date);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  return monday;
}

function addDays(date: Date, count: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}

function displayDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function eventIsOnDay(event: TeamCalendarEvent, date: Date) {
  const day = dayOnly(date).getTime();
  const start = dayOnly(new Date(event.startsAt)).getTime();
  const end = dayOnly(new Date(event.endsAt)).getTime();
  return day >= start && day <= end;
}

export const GlobalTeamCalendar: React.FC<GlobalTeamCalendarProps> = ({
  events = TEAM_CALENDAR_EVENTS,
}) => {
  const [view, setView] = useState<CalendarView>('month');
  const [date, setDate] = useState(dayOnly(new Date()));
  const [department, setDepartment] = useState('all');
  const [employee, setEmployee] = useState('all');

  const departments = [...new Map(events.map((event) => [event.departmentId, event.departmentName]))];
  const employees = [...new Map(events.map((event) => [event.employeeId, event.employeeName]))];

  const visibleEvents = events.filter(
    (event) =>
      (department === 'all' || event.departmentId === department) &&
      (employee === 'all' || String(event.employeeId) === employee),
  );

  const days = useMemo(() => {
    if (view === 'week') {
      return Array.from({ length: 7 }, (_, index) => addDays(mondayOf(date), index));
    }

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstCell = mondayOf(firstDay);
    return Array.from({ length: 42 }, (_, index) => addDays(firstCell, index));
  }, [date, view]);

  const changeDate = (amount: number) => {
    const newDate = new Date(date);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + amount * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + amount);
    }
    setDate(newDate);
  };

  const periodTitle = view === 'week'
    ? `${displayDate(days[0])} - ${displayDate(days[6])} ${days[6].getFullYear()}`
    : new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);

  return (
    <section className="mt-6 rounded-2xl border border-border-default bg-surface-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Planning équipe</p>
          <h2 className="text-xl font-bold text-text-primary">Calendrier global</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => changeDate(-1)} className="rounded-lg border px-3 py-2">←</button>
          <button type="button" onClick={() => setDate(dayOnly(new Date()))} className="rounded-lg border px-3 py-2 text-sm">Aujourd'hui</button>
          <button type="button" onClick={() => changeDate(1)} className="rounded-lg border px-3 py-2">→</button>
          <button type="button" onClick={() => setView('month')} className={`rounded-lg px-3 py-2 text-sm ${view === 'month' ? 'bg-primary text-white' : 'border'}`}>Mois</button>
          <button type="button" onClick={() => setView('week')} className={`rounded-lg px-3 py-2 text-sm ${view === 'week' ? 'bg-primary text-white' : 'border'}`}>Semaine</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-xl border px-3 py-2 text-sm" aria-label="Filtrer par département">
          <option value="all">Tous les départements</option>
          {departments.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={employee} onChange={(event) => setEmployee(event.target.value)} className="rounded-xl border px-3 py-2 text-sm" aria-label="Filtrer par employé">
          <option value="all">Tous les employés</option>
          {employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-secondary">
        {(['office', 'remote', 'absence'] as TeamCalendarEventType[]).map((type) => (
          <span key={type}><span className={`mr-1 inline-block h-3 w-3 rounded-full ${type === 'office' ? 'bg-green-500' : type === 'remote' ? 'bg-blue-500' : 'bg-red-500'}`} />{labels[type]}</span>
        ))}
      </div>

      <h3 className="my-4 text-center font-semibold capitalize text-text-primary">{periodTitle}</h3>

      {visibleEvents.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">Aucun événement disponible.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((day) => <div key={day} className="p-2 text-center text-xs font-bold text-text-muted">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dayEvents = visibleEvents.filter((event) => eventIsOnDay(event, day));
                const outsideMonth = view === 'month' && day.getMonth() !== date.getMonth();
                return (
                  <div key={day.toISOString()} className={`min-h-28 border-b border-r p-1.5 ${outsideMonth ? 'bg-gray-50' : ''}`}>
                    <p className="mb-1 text-xs font-semibold text-text-muted">{day.getDate()}</p>
                    {dayEvents.map((event) => (
                      <div key={event.id} className={`mb-1 rounded border p-1 text-[10px] ${colors[event.type]}`} title={event.employeeName}>
                        <strong className="block truncate">{event.employeeInitials} · {event.title || labels[event.type]}</strong>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
