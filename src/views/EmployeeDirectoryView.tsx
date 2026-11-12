import React, { useMemo, useState } from 'react';
import { EMPLOYEE } from '../data/employeeMockData';
import { Employee } from '../types/employee';
import { ViewMode, UserProfile } from '../types/sirh';
import { DocumentUploadCard } from './DocumentUploadCard';
import { CareerTimeline } from '../components/employee/CareerTimeline';
import { GlobalTeamCalendar } from '../components/planning/GlobalTeamCalendar';

interface EmployeeDirectoryViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenDocModal: () => void;
  currentUser?: UserProfile;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Employee['status'] | 'all'>('all');
  const [department, setDepartment] = useState('all');
  const [contract, setContract] = useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const departments = useMemo(
    () => [...new Set(EMPLOYEE.map((employee) => employee.departmentId))],
    [],
  );
  const contracts = useMemo(
    () => [...new Set(EMPLOYEE.map((employee) => employee.contractType))],
    [],
  );

  const employees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return EMPLOYEE.filter((employee) => {
      const searchableText = [
        employee.firstName,
        employee.lastName,
        employee.matricule,
        employee.emailPro,
        employee.jobTitle,
      ].join(' ').toLocaleLowerCase();

      return (
        (!query || searchableText.includes(query)) &&
        (status === 'all' || employee.status === status) &&
        (department === 'all' || employee.departmentId === department) &&
        (contract === 'all' || employee.contractType === contract)
      );
    });
  }, [contract, department, search, status]);

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setDepartment('all');
    setContract('all');
  };

  const selectedEmployee = EMPLOYEE.find((employee) => employee.id === selectedEmployeeId);

  return (
    <section className="min-h-full bg-bg-canvas px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Référentiel RH
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Liste des employés
          </h1>
        </div>

        <div className="mb-5 grid gap-3 rounded-2xl border border-border-default bg-surface-card p-4 shadow-sm md:grid-cols-4">
          <input
            className="rounded-xl border border-border-default px-3 py-2 text-sm md:col-span-2"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par nom, matricule, e-mail ou poste"
            aria-label="Rechercher un employé"
          />
          <select
            className="rounded-xl border border-border-default px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as Employee['status'] | 'all')}
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
            <option value="sorti">Sorti</option>
          </select>
          <select
            className="rounded-xl border border-border-default px-3 py-2 text-sm"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            aria-label="Filtrer par département"
          >
            <option value="all">Tous les départements</option>
            {departments.map((departmentId) => (
              <option key={departmentId} value={departmentId}>{departmentId}</option>
            ))}
          </select>
          <select
            className="rounded-xl border border-border-default px-3 py-2 text-sm"
            value={contract}
            onChange={(event) => setContract(event.target.value)}
            aria-label="Filtrer par contrat"
          >
            <option value="all">Tous les contrats</option>
            {contracts.map((contractType) => (
              <option key={contractType} value={contractType}>{contractType}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-slate-100"
          >
            Réinitialiser
          </button>
          <span className="self-center text-sm text-text-muted">
            {employees.length} résultat{employees.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card shadow-sm">
          {employees.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-text-secondary">
              Aucun employé ne correspond aux filtres.
            </p>
          ) : (
            <ul className="divide-y divide-border-default">
              {employees.map((employee) => (
                <li key={employee.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeId(employee.id)}
                    className="min-w-0 text-left"
                  >
                    <p className="font-semibold text-text-primary">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-sm text-text-secondary">{employee.jobTitle}</p>
                    <p className="text-xs text-text-muted">
                      {employee.emailPro} · {employee.contractType} · {employee.status}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedEmployee && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <DocumentUploadCard
              employeeId={selectedEmployee.id}
              documents={selectedEmployee.documents}
            />
            <CareerTimeline events={selectedEmployee.careerEvents} />
          </div>
        )}

        <GlobalTeamCalendar />
      </div>
    </section>
  );
};
