import React, { useState, useRef, useEffect } from 'react';
import { AvailablePosition, Department, UserProfile, ViewMode } from '../types/sirh';
import { DEPARTMENTS_DATA, USER_PROFILES } from '../data/mockData';

interface DepartmentPositionsDropdownProps {
  onNavigate: (view: ViewMode) => void;
  currentUser?: UserProfile;
}

export const DepartmentPositionsDropdown: React.FC<DepartmentPositionsDropdownProps> = ({
  onNavigate,
  currentUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedManagerId, setSelectedManagerId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'ouvert' | 'en_validation' | 'pourvu'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute all available positions flat list
  const allPositions: AvailablePosition[] = DEPARTMENTS_DATA.flatMap((d) => d.positions);
  const totalOpenCount = allPositions.filter((p) => p.status === 'ouvert' || p.status === 'en_validation').length;

  // Filter positions based on filters
  const filteredPositions = allPositions.filter((pos) => {
    // Dept filter
    if (selectedDeptId !== 'all' && pos.departmentId !== selectedDeptId) {
      return false;
    }
    // Manager filter
    if (selectedManagerId !== 'all' && pos.managerId !== selectedManagerId) {
      return false;
    }
    // Status filter
    if (selectedStatus !== 'all' && pos.status !== selectedStatus) {
      return false;
    }
    // Search query
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchTitle = pos.title.toLowerCase().includes(q);
      const matchDept = pos.departmentName.toLowerCase().includes(q);
      const matchManager = pos.managerName.toLowerCase().includes(q);
      const matchSkills = pos.skills?.some((s) => s.toLowerCase().includes(q)) ?? false;
      const matchLoc = pos.location.toLowerCase().includes(q);
      if (!matchTitle && !matchDept && !matchManager && !matchSkills && !matchLoc) {
        return false;
      }
    }
    return true;
  });

  // Get active department if one is specifically selected
  const activeDepartment: Department | undefined = DEPARTMENTS_DATA.find((d) => d.id === selectedDeptId);

  // Quick helper to see if manager has multiple departments
  const getManagerDepartmentCount = (managerName: string) => {
    return DEPARTMENTS_DATA.filter((d) => d.primaryManagerName.toLowerCase().includes(managerName.toLowerCase())).length;
  };

  const handleActionClick = (pos: AvailablePosition) => {
    setIsOpen(false);
    if (pos.requisitionCode === 'REQ-2026-0042') {
      onNavigate('validation-finance');
    } else if (pos.requisitionCode === 'REQ-2026-0048') {
      onNavigate('qualification-rh');
    } else if (pos.requisitionCode === 'REQ-2026-0045') {
      onNavigate('qualification-rh');
    } else if (pos.status === 'ouvert') {
      onNavigate('recrutement');
    } else {
      onNavigate('mes-demandes');
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-3 rounded-lg text-xs font-body-semibold flex items-center gap-2 border transition-all cursor-pointer shadow-xs ${
          isOpen
            ? 'bg-primary-container text-white border-primary-container shadow-md'
            : 'bg-surface-card hover:bg-slate-50 text-text-primary border-border-default'
        }`}
        title="Liste déroulante des postes disponibles dans les départements"
      >
        <span className="material-symbols-outlined text-[18px] text-primary">domain</span>
        <span className="hidden md:inline">Postes par Département</span>
        <span className="inline md:hidden">Postes</span>
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-subtle text-primary border border-primary/20">
          {totalOpenCount}
        </span>
        <span className="material-symbols-outlined text-[16px] text-text-muted">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[92vw] sm:w-[680px] md:w-[760px] max-h-[82vh] bg-surface-card rounded-2xl shadow-2xl border border-border-default z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Top Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/30 border border-primary-container/40 flex items-center justify-center text-info-sky">
                <span className="material-symbols-outlined text-[22px]">corporate_fare</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Postes Disponibles par Département</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30">
                    Gouvernance Métier
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Les managers supervisent un ou plusieurs départements opérationnels (ex: Marc Lefebvre gère 3 départements).
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Filter Bar Controls (Maximum de filtres pour faciliter la lecture) */}
          <div className="p-3.5 bg-bg-canvas border-b border-border-default grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
            {/* Search Input (5 cols) */}
            <div className="sm:col-span-5 relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[17px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher poste, techno, ville..."
                className="w-full h-8.5 pl-8 pr-2.5 bg-surface-card border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>

            {/* Department Dropdown (4 cols) */}
            <div className="sm:col-span-4">
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full h-8.5 px-2 bg-surface-card border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container font-medium cursor-pointer"
              >
                <option value="all">Tous les départements ({DEPARTMENTS_DATA.length})</option>
                {DEPARTMENTS_DATA.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.shortName} · {d.code} ({d.positions.length} postes)
                  </option>
                ))}
              </select>
            </div>

            {/* Manager Filter (3 cols) */}
            <div className="sm:col-span-3">
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full h-8.5 px-2 bg-surface-card border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container font-medium cursor-pointer"
              >
                <option value="all">Tous les managers</option>
                <option value="usr-2">★ Marc Lefebvre (3 départements)</option>
                <option value="usr-1">Claire Delorme (2 départements)</option>
                <option value="usr-3">Gilles Vaudon (Finance)</option>
                <option value="usr-5">Laurent Fabre (Data)</option>
              </select>
            </div>

            {/* Status Pills */}
            <div className="sm:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border-default/60">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-text-muted font-medium mr-1">Statut :</span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedStatus === 'all'
                      ? 'bg-primary-container text-white'
                      : 'bg-surface-card text-text-secondary hover:bg-slate-100 border border-border-default'
                  }`}
                >
                  Tous ({allPositions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('ouvert')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedStatus === 'ouvert'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-surface-card text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  Ouvert recrutement
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('en_validation')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedStatus === 'en_validation'
                      ? 'bg-amber-600 text-white'
                      : 'bg-surface-card text-amber-800 hover:bg-amber-50 border border-amber-200'
                  }`}
                >
                  En validation RH/Finance
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('pourvu')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedStatus === 'pourvu'
                      ? 'bg-slate-700 text-white'
                      : 'bg-surface-card text-text-muted hover:bg-slate-100 border border-border-default'
                  }`}
                >
                  Pourvu
                </button>
              </div>

              {/* Active Filter summary counter */}
              <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                <span><strong>{filteredPositions.length}</strong> postes filtrés</span>
                {(selectedDeptId !== 'all' || selectedManagerId !== 'all' || selectedStatus !== 'all' || searchTerm) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDeptId('all');
                      setSelectedManagerId('all');
                      setSelectedStatus('all');
                      setSearchTerm('');
                    }}
                    className="text-primary hover:underline font-semibold"
                  >
                    Effacer filtres
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Department Detail Spotlight when a single department is picked */}
          {activeDepartment && (
            <div className="px-4 py-3 bg-blue-50/70 border-b border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-700 text-[20px]">account_tree</span>
                <div>
                  <div className="font-bold text-blue-950 flex items-center gap-2">
                    <span>{activeDepartment.name} ({activeDepartment.code})</span>
                    <span className="px-2 py-0.2 rounded bg-blue-200/80 text-blue-900 font-bold text-[10px]">
                      {activeDepartment.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-800">
                    Responsable : <strong>{activeDepartment.primaryManagerName}</strong> ({activeDepartment.primaryManagerRole})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-blue-900 font-mono">
                <div>
                  Effectifs : <strong>{activeDepartment.headcountCurrent}</strong> / {activeDepartment.headcountTarget} ETP
                </div>
                <div>
                  Budget annuel : <strong>{activeDepartment.allocatedBudgetAnnual.toLocaleString('fr-FR')} €</strong>
                </div>
              </div>
            </div>
          )}

          {/* Positions List Scrollable Area */}
          <div className="overflow-y-auto max-h-[460px] p-4 divide-y divide-border-default/60">
            {filteredPositions.length === 0 ? (
              <div className="py-12 text-center text-text-muted">
                <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2">work_off</span>
                <p className="font-semibold text-xs text-text-primary">Aucun poste ne correspond à vos critères</p>
                <p className="text-[11px] mt-1">Modifiez vos filtres de département, manager ou mot-clé.</p>
              </div>
            ) : (
              filteredPositions.map((pos) => {
                const managerDeptsCount = getManagerDepartmentCount(pos.managerName);
                return (
                  <div
                    key={pos.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-xl transition-colors"
                  >
                    {/* Left Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-text-primary text-sm hover:text-primary transition-colors">
                          {pos.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-text-secondary border border-border-default">
                          Grade {pos.grade}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {pos.contractType} · {pos.fte} ETP
                        </span>
                        {pos.priority === 'urgente' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-danger-red border border-red-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-danger-red"></span>
                            Priorité Urgente
                          </span>
                        )}
                        {pos.status === 'ouvert' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Ouvert aux candidatures
                          </span>
                        )}
                        {pos.status === 'en_validation' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            En circuit de validation
                          </span>
                        )}
                        {pos.status === 'pourvu' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            Poste pourvu
                          </span>
                        )}
                      </div>

                      {/* Sub-info line */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary mt-1">
                        <span className="font-semibold text-text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-text-muted">apartment</span>
                          {pos.departmentName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-text-muted">person</span>
                          Responsable : <strong className="text-text-primary">{pos.managerName}</strong>
                          {managerDeptsCount > 1 && (
                            <span className="ml-1 px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold" title={`${pos.managerName} est responsable de ${managerDeptsCount} départements`}>
                              {managerDeptsCount} dpts gérés
                            </span>
                          )}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-text-muted">location_on</span>
                          {pos.location}
                        </span>
                      </div>

                      {/* Description and Skills */}
                      {pos.description && (
                        <p className="text-[11px] text-text-muted mt-1 line-clamp-1">
                          {pos.description}
                        </p>
                      )}

                      {pos.skills && pos.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {pos.skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-surface-container text-text-secondary text-[10px] font-mono border border-border-default/50"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Action & Financial Bracket */}
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                      <div className="text-right">
                        <div className="font-bold text-xs text-text-primary tabular-nums">
                          {pos.salaryRange}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          Cible : {pos.targetDate}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleActionClick(pos)}
                        className="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Examiner</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-slate-50 border-t border-border-default flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]">info</span>
              <span>
                Référentiel RH synchronisé avec la convention collective métallurgie & grille Cadres.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('nouvelle-demande');
              }}
              className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ Créer un nouveau besoin</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
