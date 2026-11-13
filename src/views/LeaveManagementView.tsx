import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../services/api';
import { UserProfile } from '../types/sirh';
import { LeaveBalance, LeaveRequest, LeaveType } from '../types/leaves';

interface Props {
  currentUser: UserProfile;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(`${value}T00:00:00`));
}

export const LeaveManagementView: React.FC<Props> = ({ currentUser }) => {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [justificationFileUrl, setJustificationFileUrl] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const managerView = currentUser.roleType === 'RH' || currentUser.roleType === 'Manager';
  const selectedType = useMemo(() => types.find((type) => type.id === leaveTypeId), [types, leaveTypeId]);

  const refresh = async () => {
    const [loadedTypes, loadedBalances, loadedRequests] = await Promise.all([
      apiGet<LeaveType[]>('/leaves/types'),
      apiGet<LeaveBalance[]>('/leaves/balances'),
      apiGet<LeaveRequest[]>(`/leaves/requests?managerView=${managerView}`),
    ]);
    setTypes(loadedTypes);
    setBalances(loadedBalances);
    setRequests(loadedRequests);
    if (!leaveTypeId && loadedTypes.length > 0) setLeaveTypeId(loadedTypes[0].id);
  };

  useEffect(() => {
    refresh().catch((cause: Error) => setError(cause.message));
  }, [managerView]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await apiPost('/leaves/requests', {
        leaveTypeId,
        startDate,
        endDate,
        justificationFileUrl: justificationFileUrl || null,
      });
      setStartDate('');
      setEndDate('');
      setJustificationFileUrl('');
      setMessage('Votre demande a été envoyée pour validation.');
      await refresh();
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  const decide = async (id: number, approved: boolean) => {
    setError(null);
    try {
      await apiPatch(`/leaves/requests/${id}/decision`, {
        approved,
        rejectionReason: approved ? null : rejectionReason,
      });
      setRejectionReason('');
      setMessage(approved ? 'Demande approuvée.' : 'Demande refusée.');
      await refresh();
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  return (
    <section className="p-8 max-w-7xl mx-auto w-full space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">Congés & absences</h1>
        <p className="text-slate-600 mt-1">Consultez vos soldes et suivez le circuit de validation.</p>
      </header>

      {error && <div className="rounded-lg bg-red-50 text-red-700 p-3">{error}</div>}
      {message && <div className="rounded-lg bg-emerald-50 text-emerald-700 p-3">{message}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        {balances.map((balance) => (
          <article key={balance.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">{balance.leaveTypeName}</h2>
            <p className="text-3xl font-bold text-indigo-700 mt-2">{balance.remainingDays} j</p>
            <p className="text-sm text-slate-500">{balance.takenDays} j pris sur {balance.acquiredDays} j acquis</p>
          </article>
        ))}
      </div>

      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Nouvelle demande</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm text-slate-700">Type
            <select value={leaveTypeId} onChange={(event) => setLeaveTypeId(event.target.value)} className="mt-1 w-full rounded border p-2" required>
              {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-700">Du
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded border p-2" required />
          </label>
          <label className="text-sm text-slate-700">Au
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded border p-2" required />
          </label>
          <label className="text-sm text-slate-700">Justificatif {selectedType?.requiresJustification ? '(obligatoire)' : '(facultatif)'}
            <input value={justificationFileUrl} onChange={(event) => setJustificationFileUrl(event.target.value)} placeholder="URL du document" className="mt-1 w-full rounded border p-2" />
          </label>
        </div>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Envoyer la demande</button>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-5 border-b"><h2 className="text-lg font-semibold">{managerView ? 'Demandes à traiter' : 'Mes demandes'}</h2></div>
        {managerView && (
          <div className="px-5 pt-4">
            <label className="text-sm text-slate-700">Motif de refus
              <input value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Obligatoire uniquement en cas de refus" className="mt-1 w-full rounded border p-2" />
            </label>
          </div>
        )}
        <div className="divide-y">
          {requests.map((request) => (
            <article key={request.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{request.leaveTypeName} · {request.totalBusinessDays} jour(s)</p>
                <p className="text-sm text-slate-600">{request.employeeName && `${request.employeeName} · `}{formatDate(request.startDate)} au {formatDate(request.endDate)}</p>
                {request.rejectionReason && <p className="text-sm text-red-600 mt-1">Motif : {request.rejectionReason}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{request.status}</span>
                {managerView && request.status === 'en_attente' && (
                  <>
                    <button onClick={() => decide(request.id, true)} className="rounded bg-emerald-600 px-3 py-2 text-white">Approuver</button>
                    <button onClick={() => decide(request.id, false)} className="rounded bg-red-600 px-3 py-2 text-white">Refuser</button>
                  </>
                )}
              </div>
            </article>
          ))}
          {requests.length === 0 && <p className="p-5 text-slate-500">Aucune demande pour le moment.</p>}
        </div>
      </section>
    </section>
  );
};
