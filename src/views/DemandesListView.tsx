import React, { useState, useMemo, useEffect } from 'react';
import { Requisition, UserProfile, ViewMode } from '../types/sirh';
import { INITIAL_REQUISITIONS, DEPARTMENTS_DATA } from '../data/mockData';
import { DepartmentPositionsDropdown } from '../components/DepartmentPositionsDropdown';
import { apiGet } from '../services/api';

interface DemandesListViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenDocModal: () => void;
  currentUser?: UserProfile;
}

export const DemandesListView: React.FC<DemandesListViewProps> = ({
  onNavigate,
  onOpenDocModal,
  currentUser,
}) => {
  const [requisitions, setRequisitions] = useState<Requisition[]>(INITIAL_REQUISITIONS);
  useEffect(() => {
    apiGet<Requisition[]>('/requisitions').then(setRequisitions).catch(() => undefined);
  }, []);
  // Maximum Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [salaryFilter, setSalaryFilter] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');
  const [quickPreset, setQuickPreset] = useState<'all' | 'marc' | 'arbitrage' | 'urgente' | 'publiee'>('all');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards' | 'grouped'>('table');
  const [sortBy, setSortBy] = useState<'date' | 'salary' | 'code' | 'step'>('date');

  // Filter application
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      // Quick preset filter
      if (quickPreset === 'marc') {
        if (r.managerInCharge !== 'Marc Lefebvre' && r.requesterName !== 'Marc Lefebvre') return false;
      } else if (quickPreset === 'arbitrage') {
        if (r.status !== 'en_cours_finance' && r.status !== 'en_cours_rh') return false;
      } else if (quickPreset === 'urgente') {
        if (r.priority !== 'urgente') return false;
      } else if (quickPreset === 'publiee') {
        if (r.status !== 'publiee') return false;
      }

      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      // Dept filter
      if (deptFilter !== 'all') {
        if (r.departmentId && r.departmentId !== deptFilter) return false;
        if (!r.departmentId && !r.department.toLowerCase().includes(deptFilter.toLowerCase())) return false;
      }

      // Manager filter
      if (managerFilter !== 'all') {
        const matchesManager =
          (r.managerInCharge && r.managerInCharge.toLowerCase().includes(managerFilter.toLowerCase())) ||
          r.requesterName.toLowerCase().includes(managerFilter.toLowerCase());
        if (!matchesManager) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) {
        return false;
      }

      // Contract filter
      if (contractFilter !== 'all' && !r.contractType.toLowerCase().includes(contractFilter.toLowerCase())) {
        return false;
      }

      // Salary filter
      if (salaryFilter === 'low' && r.salaryMax > 3200) return false;
      if (salaryFilter === 'mid' && (r.salaryMax <= 3200 || r.salaryMax > 3700)) return false;
      if (salaryFilter === 'high' && r.salaryMax <= 3700) return false;

      // Budget variance filter
      if (budgetFilter !== 'all' && r.budgetVarianceStatus !== budgetFilter) {
        return false;
      }

      // Free text search
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchCode = r.code.toLowerCase().includes(q);
        const matchRequester = r.requesterName.toLowerCase().includes(q);
        const matchDept = r.department.toLowerCase().includes(q);
        const matchReason = r.reason.toLowerCase().includes(q);
        const matchLoc = r.location.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchRequester && !matchDept && !matchReason && !matchLoc) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'salary') return b.salaryMax - a.salaryMax;
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      if (sortBy === 'step') return b.currentStep - a.currentStep;
      return 0; // date default
    });
  }, [
    quickPreset,
    statusFilter,
    deptFilter,
    managerFilter,
    priorityFilter,
    contractFilter,
    salaryFilter,
    budgetFilter,
    searchTerm,
    sortBy,
    requisitions,
  ]);

  // Count active filters
  const activeFiltersCount = [
    statusFilter !== 'all',
    deptFilter !== 'all',
    managerFilter !== 'all',
    priorityFilter !== 'all',
    contractFilter !== 'all',
    salaryFilter !== 'all',
    budgetFilter !== 'all',
    searchTerm.trim() !== '',
    quickPreset !== 'all',
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDeptFilter('all');
    setManagerFilter('all');
    setPriorityFilter('all');
    setContractFilter('all');
    setSalaryFilter('all');
    setBudgetFilter('all');
    setQuickPreset('all');
  };

  // Grouped by department calculation
  const groupedByDept = useMemo(() => {
    const map = new Map<string, Requisition[]>();
    filteredRequisitions.forEach((req) => {
      const deptKey = req.department || 'Autres Départements';
      if (!map.has(deptKey)) {
        map.set(deptKey, []);
      }
      map.get(deptKey)!.push(req);
    });
    return Array.from(map.entries());
  }, [filteredRequisitions]);

  // Metrics for comprehension
  const totalCount = requisitions.length;
  const urgentCount = requisitions.filter((r) => r.priority === 'urgente').length;
  const financeWaitingCount = requisitions.filter((r) => r.status === 'en_cours_finance').length;
  const rhWaitingCount = requisitions.filter((r) => r.status === 'en_cours_rh').length;
  const publishedCount = requisitions.filter((r) => r.status === 'publiee').length;

  const handleNavigateRequisition = (code: string) => {
    if (code === 'REQ-2026-0042') {
      onNavigate('validation-finance');
    } else if (code === 'REQ-2026-0048' || code === 'REQ-2026-0045') {
      onNavigate('qualification-rh');
    } else if (code === 'REQ-2026-0046') {
      onNavigate('approbation-direction');
    } else if (code === 'REQ-2026-0050') {
      onNavigate('nouvelle-demande');
    } else {
      onNavigate('recrutement');
    }
  };

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="max-w-7xl mx-auto w-full px-margin py-space-lg flex flex-col gap-space-lg">
        {/* Header Bar */}
        <div className="bg-surface-card p-6 rounded-2xl shadow-sm border border-border-default flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[15px]">account_tree</span>
                Gouvernance RH & Postes
              </span>
              <span>•</span>
              <span>Contrôle Budgétaire & Séparation des Pouvoirs</span>
            </div>
            <h1 className="font-headline-lg text-2xl font-bold text-text-primary tracking-tight">
              Registre des Demandes de Recrutement
            </h1>
            <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
              Supervision consolidée des réquisitions à travers le cycle d'approbation (Manager demandeur → Visa RH → Arbitrage Finance → Signature Direction).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Embedded Postes par département Dropdown */}
            <DepartmentPositionsDropdown onNavigate={onNavigate} currentUser={currentUser} />

            <button
              onClick={() => onNavigate('nouvelle-demande')}
              className="h-9 px-3.5 bg-primary-container hover:bg-primary-hover text-white rounded-lg font-body-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Créer un poste</span>
            </button>
          </div>
        </div>

        {/* UI/UX Comprehension KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            onClick={() => { setQuickPreset('all'); }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              quickPreset === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-surface-card hover:bg-slate-50 border-border-default text-text-primary'
            }`}
          >
            <div className="text-[11px] font-semibold text-text-muted">Total Demandes</div>
            <div className="text-2xl font-bold mt-1 tabular-nums">{totalCount}</div>
            <div className="text-[10px] text-text-muted mt-0.5">Toutes entités</div>
          </div>

          <div
            onClick={() => { setQuickPreset('marc'); }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              quickPreset === 'marc'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-surface-card hover:bg-blue-50/50 border-border-default text-text-primary'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-700">Marc Lefebvre</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">3 dpts</span>
            </div>
            <div className="text-2xl font-bold mt-1 tabular-nums text-blue-950">3</div>
            <div className="text-[10px] text-text-muted mt-0.5">Infra, Cyber & Archi</div>
          </div>

          <div
            onClick={() => { setQuickPreset('arbitrage'); }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              quickPreset === 'arbitrage'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                : 'bg-surface-card hover:bg-amber-50/50 border-border-default text-text-primary'
            }`}
          >
            <div className="text-[11px] font-semibold text-warning-text">En Arbitrage</div>
            <div className="text-2xl font-bold mt-1 tabular-nums text-amber-900">{financeWaitingCount + rhWaitingCount}</div>
            <div className="text-[10px] text-text-muted mt-0.5">Visa RH & Dérogation</div>
          </div>

          <div
            onClick={() => { setQuickPreset('urgente'); }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              quickPreset === 'urgente'
                ? 'bg-red-600 text-white border-red-600 shadow-md'
                : 'bg-surface-card hover:bg-red-50/50 border-border-default text-text-primary'
            }`}
          >
            <div className="text-[11px] font-semibold text-danger-red">Besoins Urgents</div>
            <div className="text-2xl font-bold mt-1 tabular-nums text-red-950">{urgentCount}</div>
            <div className="text-[10px] text-text-muted mt-0.5">NIS2 & Infrastructure</div>
          </div>

          <div
            onClick={() => { setQuickPreset('publiee'); }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              quickPreset === 'publiee'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-surface-card hover:bg-emerald-50/50 border-border-default text-text-primary'
            }`}
          >
            <div className="text-[11px] font-semibold text-success-dark">Offres Publiées</div>
            <div className="text-2xl font-bold mt-1 tabular-nums text-emerald-950">{publishedCount}</div>
            <div className="text-[10px] text-text-muted mt-0.5">Vivier actif</div>
          </div>
        </div>

        {/* MAXIMUM FILTER BAR (Panneau de Filtrage Avancé) */}
        <div className="bg-surface-card rounded-2xl border border-border-default shadow-sm p-4 flex flex-col gap-4">
          {/* Row 1: Search + Multi-Criteria Selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 text-xs">
            {/* Search Input (4 cols) */}
            <div className="md:col-span-4 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher intitulé, code REQ, manager, ville..."
                className="w-full h-10 pl-9 pr-3 bg-bg-canvas border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Department Filter (3 cols) */}
            <div className="md:col-span-3">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full h-10 px-3 bg-bg-canvas border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container font-medium cursor-pointer"
              >
                <option value="all">Tous les départements</option>
                <option value="dept-dsi-cloud">🏢 DSI · Infra Cloud & DevOps (4100)</option>
                <option value="dept-dsi-cyber">🏢 DSI · Cyber-Sécurité NIS2 (4120)</option>
                <option value="dept-dsi-archi">🏢 DSI · Architecture Logicielle (4200)</option>
                <option value="dept-rh-recrutement">🏢 Direction RH · Recrutement (1200)</option>
                <option value="dept-fin-ctrl">🏢 Contrôle de Gestion Finance (2100)</option>
                <option value="dept-dsi-data">🏢 DSI · Data Platform & IA (4300)</option>
              </select>
            </div>

            {/* Manager Filter (2 cols) */}
            <div className="md:col-span-3">
              <select
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                className="w-full h-10 px-3 bg-bg-canvas border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container font-medium cursor-pointer"
              >
                <option value="all">Tous les managers</option>
                <option value="Marc Lefebvre">★ Marc Lefebvre (Multi-départements)</option>
                <option value="Claire Delorme">Claire Delorme (Pôle RH)</option>
                <option value="Gilles Vaudon">Gilles Vaudon (Finance)</option>
                <option value="Laurent Fabre">Laurent Fabre (Data)</option>
                <option value="Sophie Martin">Sophie Martin (DRH)</option>
              </select>
            </div>

            {/* Status / Workflow Stage Filter (2 cols) */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 bg-bg-canvas border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container font-medium cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="brouillon">1. Brouillon Manager</option>
                <option value="en_cours_rh">2. Qualification RH</option>
                <option value="en_cours_finance">3. Arbitrage Finance</option>
                <option value="en_cours_direction">4. Visa Direction</option>
                <option value="publiee">Offre Publiée</option>
              </select>
            </div>
          </div>

          {/* Row 2: Secondary Filters & Layout Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-default/60 text-xs">
            {/* Quick Filter Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Filtres fins :</span>

              {/* Priority Select */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8 px-2.5 bg-bg-canvas border border-border-default rounded-lg text-[11px] text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
              >
                <option value="all">Priorité : Toutes</option>
                <option value="urgente">🔴 Urgente</option>
                <option value="normale">⚪ Normale</option>
              </select>

              {/* Contract Select */}
              <select
                value={contractFilter}
                onChange={(e) => setContractFilter(e.target.value)}
                className="h-8 px-2.5 bg-bg-canvas border border-border-default rounded-lg text-[11px] text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
              >
                <option value="all">Contrat : Tous</option>
                <option value="CDI">CDI Cadre</option>
                <option value="CDD">CDD</option>
              </select>

              {/* Salary Bracket Select */}
              <select
                value={salaryFilter}
                onChange={(e) => setSalaryFilter(e.target.value)}
                className="h-8 px-2.5 bg-bg-canvas border border-border-default rounded-lg text-[11px] text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
              >
                <option value="all">Salaire : Toutes tranches</option>
                <option value="low">&lt; 3 200 € / mois</option>
                <option value="mid">3 200 € – 3 700 € / mois</option>
                <option value="high">&gt; 3 700 € / mois</option>
              </select>

              {/* Budget Variance */}
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="h-8 px-2.5 bg-bg-canvas border border-border-default rounded-lg text-[11px] text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
              >
                <option value="all">Budget : Tout</option>
                <option value="conforme">Conforme grille</option>
                <option value="tolerable">Tolérance 10% (Dérogation)</option>
                <option value="depassement">Dépassement</option>
              </select>

              {/* Clear filters button */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="h-8 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-danger-red font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
                  <span>Effacer les filtres ({activeFiltersCount})</span>
                </button>
              )}
            </div>

            {/* Layout Mode & Sorting Controls */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Sort by */}
              <div className="flex items-center gap-1 text-[11px] text-text-muted">
                <span>Tri :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-8 px-2 bg-bg-canvas border border-border-default rounded-lg text-[11px] text-text-primary focus:outline-none cursor-pointer"
                >
                  <option value="date">Date de création</option>
                  <option value="salary">Rémunération max</option>
                  <option value="step">Étape d'avancement</option>
                  <option value="code">Référence REQ</option>
                </select>
              </div>

              {/* Layout Switcher */}
              <div className="flex items-center bg-bg-canvas border border-border-default rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewLayout('table')}
                  title="Vue Tableau Détaillé"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewLayout === 'table' ? 'bg-white shadow-xs text-primary' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">table_rows</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('cards')}
                  title="Vue Cartes Opérationnelles"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewLayout === 'cards' ? 'bg-white shadow-xs text-primary' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('grouped')}
                  title="Vue Groupée par Département"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewLayout === 'grouped' ? 'bg-white shadow-xs text-primary' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">view_agenda</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Summary Chips Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-text-muted font-medium">
              Affichage de <strong className="text-text-primary">{filteredRequisitions.length}</strong> sur {totalCount} demandes
            </span>
            {quickPreset === 'marc' && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold flex items-center gap-1">
                ★ Vue Manager : Marc Lefebvre (Responsable de 3 départements)
                <button onClick={() => setQuickPreset('all')} className="hover:text-blue-950">✕</button>
              </span>
            )}
          </div>

          <div className="text-[11px] text-text-muted">
            Séparation des pouvoirs : Le visa RH, l'arbitrage Finance et la décision CODIR sont audités en continu.
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW MODE 1: HIGH-DENSITY ENTERPRISE TABLE                                */}
        {/* ========================================================================= */}
        {viewLayout === 'table' && (
          <div className="bg-surface-card rounded-2xl border border-border-default shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-bg-canvas text-text-secondary uppercase font-semibold border-b border-border-default text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4">Poste & Département</th>
                    <th className="py-3 px-4">Manager Responsable</th>
                    <th className="py-3 px-4">Brut & Enveloppe</th>
                    <th className="py-3 px-4">Avancement du Workflow</th>
                    <th className="py-3 px-4">Statut Actuel</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/40">
                  {filteredRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-text-muted">
                        <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1">search_off</span>
                        <div className="font-semibold text-xs text-text-primary">Aucun résultat trouvé</div>
                        <div className="text-[11px] mt-0.5">Essayez d'ajuster ou d'effacer certains filtres.</div>
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="mt-3 px-3 py-1 rounded-lg bg-primary-subtle text-primary font-semibold text-xs"
                        >
                          Réinitialiser les filtres
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredRequisitions.map((r: Requisition) => {
                      const isMultiDeptManager = r.managerInCharge === 'Marc Lefebvre' || r.requesterName === 'Marc Lefebvre';
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Code */}
                          <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{r.code}</span>
                              {r.priority === 'urgente' && (
                                <span className="w-2 h-2 rounded-full bg-danger-red shrink-0" title="Besoin urgent"></span>
                              )}
                            </div>
                            <div className="text-[10px] text-text-muted font-normal">{r.creationDate}</div>
                          </td>

                          {/* Title & Dept */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-text-primary text-sm flex items-center gap-2">
                              <span>{r.title}</span>
                              {r.priority === 'urgente' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-red-100 text-danger-red border border-red-200">
                                  Urgente
                                </span>
                              )}
                            </div>
                            <div className="text-text-muted text-[11px] mt-0.5 flex items-center gap-1">
                              <span className="font-medium text-text-secondary">{r.department}</span>
                              <span>•</span>
                              <span>{r.contractType.split('—')[0].trim()}</span>
                              <span>•</span>
                              <span>{r.location}</span>
                            </div>
                          </td>

                          {/* Manager in charge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-text-primary flex items-center gap-1.5">
                              <span>{r.managerInCharge || r.requesterName}</span>
                              {isMultiDeptManager && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800" title="Marc Lefebvre est responsable de 3 départements : Infra, Cyber, Archi">
                                  3 dpts
                                </span>
                              )}
                            </div>
                            <div className="text-text-muted text-[11px]">
                              {isMultiDeptManager ? 'Engineering Manager' : r.requesterRole}
                            </div>
                          </td>

                          {/* Salary & Budget */}
                          <td className="py-3.5 px-4 tabular-nums whitespace-nowrap">
                            <div className="font-bold text-text-primary text-xs">
                              {r.salaryMin.toLocaleString('fr-FR')} € – {r.salaryMax.toLocaleString('fr-FR')} €
                            </div>
                            <div className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                              <span>{r.grade}</span>
                              <span>•</span>
                              <span className={r.budgetVarianceStatus === 'depassement' ? 'text-danger-red font-bold' : r.budgetVarianceStatus === 'tolerable' ? 'text-amber-700 font-medium' : 'text-success-dark font-medium'}>
                                Budget: {r.annualEmployerBudget.toLocaleString('fr-FR')} €
                              </span>
                            </div>
                          </td>

                          {/* Workflow Step Progress Bar */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {[
                                { step: 1, label: 'Manager' },
                                { step: 2, label: 'RH' },
                                { step: 3, label: 'Finance' },
                                { step: 4, label: 'Direction' },
                              ].map((s) => {
                                const isPassed = r.currentStep > s.step || r.status === 'publiee';
                                const isCurrent = r.currentStep === s.step && r.status !== 'publiee';
                                return (
                                  <div
                                    key={s.step}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                      isPassed
                                        ? 'bg-emerald-600 text-white'
                                        : isCurrent
                                        ? 'bg-primary-container text-white ring-2 ring-primary-container/40'
                                        : 'bg-slate-200 text-slate-500'
                                    }`}
                                    title={`Étape ${s.step} : ${s.label}`}
                                  >
                                    {isPassed ? '✓' : s.step}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-[10px] text-text-muted mt-1">
                              {r.currentStep === 1 && 'Saisie du besoin'}
                              {r.currentStep === 2 && 'Qualification RH'}
                              {r.currentStep === 3 && 'Arbitrage Finance'}
                              {r.currentStep === 4 && (r.status === 'publiee' ? 'Publiée' : 'Visa Direction')}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {r.status === 'en_cours_finance' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-warning-text font-semibold text-[11px] border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-warning-amber"></span>
                                Étape 3 · Finance
                              </span>
                            )}
                            {r.status === 'en_cours_rh' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 font-semibold text-[11px] border border-sky-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-info-sky"></span>
                                Étape 2 · Visa RH
                              </span>
                            )}
                            {r.status === 'en_cours_direction' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 font-semibold text-[11px] border border-purple-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                                Étape 4 · Direction
                              </span>
                            )}
                            {r.status === 'brouillon' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Brouillon Manager
                              </span>
                            )}
                            {r.status === 'publiee' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-success-dark font-semibold text-[11px] border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-success-emerald"></span>
                                Publiée (Ouverte)
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleNavigateRequisition(r.code)}
                              className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-slate-100 text-primary font-bold border border-border-default shadow-xs transition-colors cursor-pointer"
                            >
                              Instruire →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 2: CARDS GRID VIEW                                              */}
        {/* ========================================================================= */}
        {viewLayout === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequisitions.map((r: Requisition) => {
              const isMultiDeptManager = r.managerInCharge === 'Marc Lefebvre' || r.requesterName === 'Marc Lefebvre';
              return (
                <div
                  key={r.id}
                  className="bg-surface-card rounded-2xl border border-border-default shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow gap-4"
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary-subtle px-2 py-0.5 rounded">
                        {r.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {r.priority === 'urgente' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-danger-red border border-red-200">
                            Urgente
                          </span>
                        )}
                        <span className="text-[11px] text-text-muted">{r.creationDate}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-text-primary line-clamp-1 hover:text-primary transition-colors">
                      {r.title}
                    </h3>

                    <div className="text-[11px] text-text-muted mt-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">apartment</span>
                      <span className="font-medium text-text-secondary truncate">{r.department}</span>
                    </div>

                    <div className="text-[11px] text-text-secondary mt-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">person</span>
                      <span>Responsable : <strong>{r.managerInCharge || r.requesterName}</strong></span>
                      {isMultiDeptManager && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                          3 dpts
                        </span>
                      )}
                    </div>

                    {/* Salary & Grade Box */}
                    <div className="mt-3 p-3 bg-bg-canvas rounded-xl border border-border-default/70 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-text-primary tabular-nums">
                          {r.salaryMin.toLocaleString('fr-FR')} € – {r.salaryMax.toLocaleString('fr-FR')} €
                        </div>
                        <div className="text-[10px] text-text-muted">{r.grade} · {r.contractType.split('—')[0]}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-text-muted">Budget charges incluses</div>
                        <div className="font-mono font-bold text-text-primary text-xs">
                          {r.annualEmployerBudget.toLocaleString('fr-FR')} €
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Progress & Action */}
                  <div className="pt-3 border-t border-border-default/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-text-muted font-medium">Étape {r.currentStep}/4</div>
                      <div className="text-[11px] font-semibold text-text-primary">
                        {r.status === 'en_cours_finance' && 'Arbitrage Finance'}
                        {r.status === 'en_cours_rh' && 'Qualification RH'}
                        {r.status === 'en_cours_direction' && 'Visa CODIR'}
                        {r.status === 'publiee' && 'Offre Publiée'}
                        {r.status === 'brouillon' && 'Brouillon Manager'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavigateRequisition(r.code)}
                      className="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-hover text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Consulter</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 3: GROUPED BY DEPARTMENT & MANAGER                              */}
        {/* ========================================================================= */}
        {viewLayout === 'grouped' && (
          <div className="space-y-6">
            {groupedByDept.map(([deptName, reqs]) => {
              const firstReq = reqs[0];
              const manager = firstReq?.managerInCharge || firstReq?.requesterName || 'Non assigné';
              const isMultiDept = manager === 'Marc Lefebvre';

              return (
                <div
                  key={deptName}
                  className="bg-surface-card rounded-2xl border border-border-default shadow-sm overflow-hidden"
                >
                  {/* Department Banner with Manager Responsibility Highlight */}
                  <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-info-sky flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">{deptName}</h3>
                          <span className="px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                            {reqs.length} demande{reqs.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                          <span>Manager responsable : <strong className="text-white">{manager}</strong></span>
                          {isMultiDept && (
                            <span className="px-2 py-0.2 rounded bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[10px] font-bold">
                              ★ Supervise 3 départements (Infra Cloud, Cyber NIS2, Archi Platform)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-xs text-slate-300">
                      Budget cumulé : <strong className="text-white">{reqs.reduce((acc, curr) => acc + curr.annualEmployerBudget, 0).toLocaleString('fr-FR')} €</strong>
                    </div>
                  </div>

                  {/* Requisitions for this Department */}
                  <div className="divide-y divide-border-default/50 p-2">
                    {reqs.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">{r.code}</span>
                            <span className="font-bold text-xs text-text-primary">{r.title}</span>
                            {r.priority === 'urgente' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-danger-red">
                                Urgente
                              </span>
                            )}
                            <span className="text-[11px] text-text-muted">· {r.grade}</span>
                          </div>
                          <div className="text-[11px] text-text-secondary mt-0.5">
                            Rémunération : <strong>{r.salaryMin} € – {r.salaryMax} €</strong> · Budget : {r.annualEmployerBudget.toLocaleString('fr-FR')} € · Cible : {r.targetStartDate}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {r.status === 'en_cours_finance' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold">
                              Arbitrage Finance
                            </span>
                          )}
                          {r.status === 'en_cours_rh' && (
                            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 text-[11px] font-semibold">
                              Visa RH
                            </span>
                          )}
                          {r.status === 'publiee' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-semibold">
                              Publiée
                            </span>
                          )}
                          <button
                            onClick={() => handleNavigateRequisition(r.code)}
                            className="px-3 py-1 rounded-lg bg-surface-card hover:bg-slate-100 text-primary font-bold border border-border-default text-xs"
                          >
                            Consulter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
