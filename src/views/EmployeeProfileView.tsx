import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../services/api';
import { Candidate, Department, UserProfile, ViewMode } from '../types/sirh';
import { EmployeeCareerEvent, EmployeeContract, EmployeeManagerOption, EmployeeProfile, WorkRegime } from '../types/employee';

interface EmployeeProfileViewProps {
  onNavigate: (view: ViewMode) => void;
  currentUser: UserProfile;
}

interface ConversionForm {
  firstName: string; lastName: string; emailPro: string; phone: string; birthDate: string; hireDate: string;
  departmentId: string; managerId: string; contractType: string; grade: string; jobTitle: string;
  workRegime: WorkRegime; monthlySalary: string; workPercentage: string; executive: boolean;
  nationality: string; nationalId: string; addressStreet: string; addressCity: string; addressZip: string;
  emergencyContactName: string; emergencyContactPhone: string; trialPeriodEnd: string; contractEndDate: string;
}

const emptyForm: ConversionForm = {
  firstName: '', lastName: '', emailPro: '', phone: '', birthDate: '', hireDate: '', departmentId: '', managerId: '',
  contractType: 'CDI', grade: 'G5', jobTitle: '', workRegime: 'HEBDO_35H', monthlySalary: '', workPercentage: '100',
  executive: false, nationality: '', nationalId: '', addressStreet: '', addressCity: '', addressZip: '',
  emergencyContactName: '', emergencyContactPhone: '', trialPeriodEnd: '', contractEndDate: '',
};

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({ onNavigate, currentUser }) => {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [managers, setManagers] = useState<EmployeeManagerOption[]>([]);
  const [selected, setSelected] = useState<EmployeeProfile | null>(null);
  const [showNationalId, setShowNationalId] = useState(false);
  const [career, setCareer] = useState<EmployeeCareerEvent[]>([]);
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [candidateId, setCandidateId] = useState('');
  const [form, setForm] = useState<ConversionForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadEmployees = async (term = search) => {
    const query = term.trim() ? `?search=${encodeURIComponent(term.trim())}` : '';
    const rows = await apiGet<EmployeeProfile[]>(`/employees${query}`);
    setEmployees(rows);
  };

  useEffect(() => {
    const requests = [
      apiGet<EmployeeProfile[]>('/employees'),
      apiGet<Department[]>('/departments'),
      currentUser.roleType === 'RH' ? apiGet<Candidate[]>('/candidates') : Promise.resolve([] as Candidate[]),
    ] as const;
    Promise.all(requests).then(([employeeRows, departmentRows, candidateRows]) => {
      setEmployees(employeeRows);
      setDepartments(departmentRows);
      setCandidates(candidateRows.filter((candidate) => candidate.stage === 'retenu'));
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Chargement des dossiers salariés impossible.'))
      .finally(() => setLoading(false));
  }, [currentUser.roleType]);

  useEffect(() => {
    if (!form.departmentId) { setManagers([]); setForm((current) => ({ ...current, managerId: '' })); return; }
    apiGet<EmployeeManagerOption[]>(`/employees/managers?departmentId=${encodeURIComponent(form.departmentId)}`)
      .then((items) => {
        setManagers(items);
        setForm((current) => ({ ...current, managerId: items.some((manager) => manager.id === current.managerId) ? current.managerId : '' }));
      }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Chargement des managers impossible.'));
  }, [form.departmentId]);

  const selectedCandidate = useMemo(() => candidates.find((candidate) => candidate.id === candidateId), [candidates, candidateId]);
  const updateForm = <K extends keyof ConversionForm>(key: K, value: ConversionForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openProfile = async (id: number) => {
    try {
      const profile = await apiGet<EmployeeProfile>(`/employees/${id}`);
      const timeline = await apiGet<EmployeeCareerEvent[]>(`/employees/${id}/career`);
      const contractRows = await apiGet<EmployeeContract[]>(`/employees/${id}/contracts`);
      setSelected(profile);
      setShowNationalId(false);
      setCareer(timeline);
      setContracts(contractRows);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ouverture du dossier impossible.');
    }
  };

  const convertCandidate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!candidateId) { setError('Choisissez un candidat retenu.'); return; }
    setSaving(true); setError(null); setMessage(null);
    try {
      const created = await apiPost<EmployeeProfile>(`/candidates/${candidateId}/employee`, {
        ...form,
        monthlySalary: Number(form.monthlySalary),
        workPercentage: Number(form.workPercentage || 100),
        phone: form.phone || null,
        nationalId: form.nationalId || null,
        nationality: form.nationality || null,
        trialPeriodEnd: form.trialPeriodEnd || null,
        contractEndDate: form.contractEndDate || null,
      });
      setEmployees((rows) => [created, ...rows.filter((row) => row.id !== created.id)]);
      setSelected(created);
      setShowNationalId(false);
      setCareer(await apiGet<EmployeeCareerEvent[]>(`/employees/${created.id}/career`));
      setContracts(await apiGet<EmployeeContract[]>(`/employees/${created.id}/contracts`));
      setCandidates((rows) => rows.filter((row) => row.id !== candidateId));
      setCandidateId(''); setForm(emptyForm);
      setMessage(`Dossier ${created.matricule} créé à partir du candidat retenu.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Conversion du candidat impossible.');
    } finally { setSaving(false); }
  };

  const chooseCandidate = (id: string) => {
    setCandidateId(id);
    const candidate = candidates.find((item) => item.id === id);
    if (!candidate) return;
    const words = candidate.name.trim().split(/\s+/);
    setForm((current) => ({
      ...current,
      firstName: words.slice(0, -1).join(' ') || words[0] || '',
      lastName: words.length > 1 ? words.at(-1) || '' : '',
      jobTitle: candidate.roleTitle,
    }));
  };

  const field = (label: string, key: keyof ConversionForm, type = 'text', required = false) => (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      <span>{label}{required && <span className="text-red-600"> *</span>}</span>
      <input required={required} type={type} value={String(form[key] ?? '')}
        onChange={(event) => updateForm(key, event.target.value as never)}
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-500 focus:outline-none" />
    </label>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Référentiel RH · {currentUser.role}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Dossiers salariés</h1>
          <p className="mt-1 text-sm text-slate-600">Profils, contrats, rattachement hiérarchique et parcours professionnel.</p>
        </div>
        <button onClick={() => onNavigate('tableau-de-bord')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Retour au tableau de bord</button>
      </header>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Annuaire · {employees.length}</h2>
            <div className="flex gap-2">
              <input aria-label="Rechercher un salarié" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, matricule, poste" className="h-9 w-48 rounded-lg border border-slate-300 px-3 text-sm" />
              <button onClick={() => loadEmployees()} className="rounded-lg bg-slate-800 px-3 text-sm font-semibold text-white">Rechercher</button>
            </div>
          </div>
          {loading ? <p className="text-sm text-slate-500">Chargement…</p> : employees.length === 0 ? <p className="text-sm text-slate-500">Aucun salarié enregistré.</p> : (
            <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto">
              {employees.map((employee) => (
                <button key={employee.id} onClick={() => openProfile(employee.id)} className={`rounded-xl border p-3 text-left transition hover:border-blue-400 hover:bg-blue-50 ${selected?.id === employee.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{employee.firstName} {employee.lastName}</span>
                    <span className="font-mono text-xs text-slate-500">{employee.matricule}</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{employee.jobTitle || employee.contractType} · {employee.departmentName}</div>
                  <div className="mt-1 text-xs text-slate-500">Manager : {employee.managerName || 'Non renseigné'}</div>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-900">Organigramme par département</h3>
            <div className="mt-2 flex flex-col gap-2">
              {departments.map((department) => {
                const departmentManagers = managers.filter((manager) => manager.departmentId === department.id);
                return <div key={department.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-slate-700">{department.shortName}</span>
                  <span className="shrink-0 text-xs text-slate-500">{departmentManagers.map((manager) => manager.name).join(', ') || department.primaryManagerName || 'Manager à sélectionner'}</span>
                </div>;
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {selected && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-mono text-xs text-slate-500">{selected.matricule}</p><h2 className="text-xl font-bold text-slate-900">{selected.firstName} {selected.lastName}</h2><p className="text-sm text-slate-600">{selected.jobTitle} · {selected.grade} · {selected.departmentName}</p></div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{selected.status}</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">E-mail professionnel</dt><dd className="font-medium text-slate-900">{selected.emailPro}</dd></div>
                <div><dt className="text-slate-500">Manager N+1</dt><dd className="font-medium text-slate-900">{selected.managerName || '—'}</dd></div>
                <div><dt className="text-slate-500">Contrat / régime</dt><dd className="font-medium text-slate-900">{selected.contractType} · {selected.workRegime || '—'}</dd></div>
                <div><dt className="text-slate-500">Embauche</dt><dd className="font-medium text-slate-900">{selected.hireDate}</dd></div>
                {(currentUser.roleType === 'RH' || currentUser.roleType === 'Employee') && <>
                  <div><dt className="text-slate-500">Salaire mensuel brut</dt><dd className="font-medium text-slate-900">{selected.monthlySalary?.toLocaleString('fr-FR') ?? '—'} €</dd></div>
                  <div><dt className="text-slate-500">Nationalité</dt><dd className="font-medium text-slate-900">{selected.nationality || 'Non renseignée'}</dd></div>
                  <div><dt className="text-slate-500">Adresse</dt><dd className="font-medium text-slate-900">{[selected.addressStreet, selected.addressZip, selected.addressCity].filter(Boolean).join(', ') || 'Non renseignée'}</dd></div>
                  <div><dt className="text-slate-500">Contact d'urgence</dt><dd className="font-medium text-slate-900">{[selected.emergencyContactName, selected.emergencyContactPhone].filter(Boolean).join(' · ') || 'Non renseigné'}</dd></div>
                </>}
                {currentUser.roleType === 'RH' && <div><dt className="text-slate-500">NIR (accès RH audité)</dt><dd className="flex items-center gap-2 font-medium text-slate-900"><span>{selected.nationalId ? (showNationalId ? selected.nationalId : `••••••••••${selected.nationalId.slice(-4)}`) : 'Non renseigné'}</span>{selected.nationalId && <button type="button" onClick={() => setShowNationalId((shown) => !shown)} className="text-xs font-semibold text-blue-700 underline">{showNationalId ? 'Masquer' : 'Afficher'}</button>}</dd></div>}
              </dl>
              <div className="mt-5 border-t border-slate-200 pt-4"><h3 className="font-semibold text-slate-900">Historique de carrière</h3>
                <ol className="mt-2 flex flex-col gap-2">{career.map((event) => <li key={event.id} className="border-l-2 border-blue-300 pl-3"><p className="text-sm font-medium text-slate-800">{event.title}</p><p className="text-xs text-slate-500">{event.eventDate} · {event.description}</p></li>)}</ol>
              </div>
              <div className="mt-5 border-t border-slate-200 pt-4"><h3 className="font-semibold text-slate-900">Contrats successifs</h3>
                <ol className="mt-2 flex flex-col gap-2">{contracts.map((contract) => <li key={contract.id} className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-medium text-slate-800">{contract.contractType} · {contract.jobTitle} · {contract.grade}</p><p className="text-xs text-slate-500">Du {contract.startDate}{contract.endDate ? ` au ${contract.endDate}` : ' · en cours'} · {contract.workRegime} · {contract.workPercentage}%{contract.monthlyGrossSalary != null ? ` · ${contract.monthlyGrossSalary.toLocaleString('fr-FR')} € brut/mois` : ''}</p></li>)}</ol>
              </div>
            </section>
          )}

          {currentUser.roleType === 'RH' && <form onSubmit={convertCandidate} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div><h2 className="text-lg font-bold text-slate-900">Convertir un candidat retenu en salarié</h2><p className="mt-1 text-sm text-slate-600">Le dossier, le contrat initial, le rattachement et l’événement d’embauche sont enregistrés dans une transaction.</p></div>
            <label className="flex flex-col gap-1 text-sm text-slate-700"><span>Candidat retenu <span className="text-red-600">*</span></span>
              <select required value={candidateId} onChange={(event) => chooseCandidate(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3">
                <option value="">Sélectionner…</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.roleTitle}</option>)}
              </select>
            </label>
            {candidates.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Aucun candidat retenu dans le vivier.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {field('Prénom', 'firstName', 'text', true)}{field('Nom', 'lastName', 'text', true)}
              {field('E-mail professionnel', 'emailPro', 'email', true)}{field('Téléphone', 'phone', 'tel')}
              {field('Date de naissance', 'birthDate', 'date', true)}{field('Date d’embauche', 'hireDate', 'date', true)}
              <label className="flex flex-col gap-1 text-sm text-slate-700"><span>Département <span className="text-red-600">*</span></span>
                <select required value={form.departmentId} onChange={(event) => updateForm('departmentId', event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3"><option value="">Sélectionner…</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700"><span>Manager N+1 <span className="text-red-600">*</span></span>
                <select required value={form.managerId} onChange={(event) => updateForm('managerId', event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3"><option value="">Sélectionner…</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name} · {manager.role} ({manager.teamSize} salariés)</option>)}</select>
              </label>
              {field('Type de contrat', 'contractType', 'text', true)}{field('Grade conventionnel', 'grade', 'text', true)}
              {field('Intitulé du poste', 'jobTitle', 'text', true)}
              <label className="flex flex-col gap-1 text-sm text-slate-700"><span>Régime de travail <span className="text-red-600">*</span></span><select value={form.workRegime} onChange={(event) => updateForm('workRegime', event.target.value as WorkRegime)} className="h-10 rounded-lg border border-slate-300 bg-white px-3"><option value="HEBDO_35H">Hebdomadaire 35 h</option><option value="HEBDO_39H">Hebdomadaire 39 h</option><option value="FORFAIT_JOURS_218">Forfait 218 jours</option></select></label>
              {field('Salaire mensuel brut (€)', 'monthlySalary', 'number', true)}{field('Temps de travail (%)', 'workPercentage', 'number', true)}
              {field('Fin de période d’essai', 'trialPeriodEnd', 'date')}{field('Fin du contrat', 'contractEndDate', 'date')}
              {field('Nationalité', 'nationality')}{field('NIR (chiffré en base)', 'nationalId')}
              {field('Adresse', 'addressStreet')}{field('Ville', 'addressCity')}{field('Code postal', 'addressZip')}
              {field('Contact d’urgence', 'emergencyContactName')}{field('Téléphone d’urgence', 'emergencyContactPhone', 'tel')}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.executive} onChange={(event) => updateForm('executive', event.target.checked)} />Statut cadre</label>
            <button disabled={saving || !selectedCandidate} type="submit" className="self-start rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Création en cours…' : 'Créer le dossier salarié'}</button>
          </form>}
        </div>
      </section>
    </div>
  );
};
