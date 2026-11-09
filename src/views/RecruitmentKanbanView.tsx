import React, { useState } from 'react';
import { Candidate, CandidateStage, ViewMode } from '../types/sirh';
import { CANDIDATES_DATA } from '../data/mockData';

interface RecruitmentKanbanViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenScheduleModal: () => void;
  onOpenDocModal: () => void;
}

export const RecruitmentKanbanView: React.FC<RecruitmentKanbanViewProps> = ({
  onNavigate,
  onOpenScheduleModal,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>(CANDIDATES_DATA);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExpFilter, setSelectedExpFilter] = useState<string>('all');
  const [selectedScoreFilter, setSelectedScoreFilter] = useState<string>('all');
  const [selectedCandidateForDetails, setSelectedCandidateForDetails] = useState<Candidate | null>(null);

  const moveCandidate = (id: string, newStage: CandidateStage) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: newStage } : c))
    );
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesExp =
      selectedExpFilter === 'all'
        ? true
        : selectedExpFilter === 'junior'
        ? c.experienceYears <= 3
        : selectedExpFilter === 'mid'
        ? c.experienceYears > 3 && c.experienceYears <= 7
        : c.experienceYears > 7;

    const matchesScore =
      selectedScoreFilter === 'all'
        ? true
        : selectedScoreFilter === 'high'
        ? c.score >= 4.5
        : c.score >= 3.5;

    return matchesSearch && matchesExp && matchesScore;
  });

  const getColCandidates = (stage: CandidateStage) =>
    filteredCandidates.filter((c) => c.stage === stage);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Sub-Header & Metadata Strip */}
      <div className="px-margin pt-space-lg pb-space-md flex flex-col gap-space-md">
        {/* Breadcrumb & Posting Identity */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs text-text-secondary font-caption-medium text-caption-medium">
              <button onClick={() => onNavigate('recrutement')} className="hover:text-text-primary transition-colors">
                Recrutement
              </button>
              <span className="material-symbols-outlined text-[14px] text-text-muted">chevron_right</span>
              <span>Campagnes Actives</span>
              <span className="material-symbols-outlined text-[14px] text-text-muted">chevron_right</span>
              <span className="text-text-primary font-body-semibold">OFF-2026-0012</span>
            </div>
            <div className="flex items-center flex-wrap gap-space-sm pt-space-xs">
              <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                Ingénieur DevSecOps Senior · DSI
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-success-dark font-caption-medium text-caption-medium">
                <span className="w-2 h-2 rounded-full bg-success-emerald animate-pulse"></span>
                Publiée
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-text-secondary font-caption-medium text-caption-medium">
                Réf. OFF-2026-0012
              </span>
            </div>
          </div>

          {/* Quick Posting Metrics Banner */}
          <div className="flex items-center gap-space-sm bg-surface-card p-space-xs rounded-xl shadow-sm border border-border-default">
            <div className="flex items-center gap-space-sm px-space-md py-space-xs bg-bg-canvas rounded-lg">
              <span className="material-symbols-outlined text-primary-container text-[20px]">groups</span>
              <div className="flex flex-col">
                <span className="font-body-semibold text-body-semibold text-text-primary">{candidates.length + 10}</span>
                <span className="font-caption text-caption text-text-muted leading-none">candidatures</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm px-space-md py-space-xs bg-bg-canvas rounded-lg">
              <span className="material-symbols-outlined text-warning-amber text-[20px]">calendar_month</span>
              <div className="flex flex-col">
                <span className="font-body-semibold text-body-semibold text-text-primary">7</span>
                <span className="font-caption text-caption text-text-muted leading-none">entretiens prévus</span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm px-space-md py-space-xs bg-emerald-50 rounded-lg">
              <span className="material-symbols-outlined text-success-emerald text-[20px]">verified</span>
              <div className="flex flex-col">
                <span className="font-body-semibold text-body-semibold text-success-dark">3</span>
                <span className="font-caption text-caption text-success-dark leading-none">retenus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls and Functional Action Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md pt-space-xs">
          <div className="flex flex-wrap items-center gap-space-sm">
            {/* View Switcher */}
            <div className="inline-flex p-1 bg-surface-container-high rounded-lg gap-1 border border-border-default/50">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-primary-container text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">view_kanban</span>
                Vue Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-primary-container text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">table_rows</span>
                Vue Tableau
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-72 md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, mot-clé, compétence..."
                className="w-full h-9 pl-9 pr-space-md bg-surface-card border border-border-default rounded-lg font-body-default text-body-default text-text-primary placeholder:text-text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filters Group */}
            <div className="flex items-center gap-space-xs">
              <select
                value={selectedExpFilter}
                onChange={(e) => setSelectedExpFilter(e.target.value)}
                className="h-9 px-3 bg-surface-card border border-border-default rounded-lg font-caption-medium text-caption-medium text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
              >
                <option value="all">Expérience (Toutes)</option>
                <option value="senior">Senior (+7 ans)</option>
                <option value="mid">Confirmé (4-7 ans)</option>
                <option value="junior">Junior (1-3 ans)</option>
              </select>

              <select
                value={selectedScoreFilter}
                onChange={(e) => setSelectedScoreFilter(e.target.value)}
                className="h-9 px-3 bg-surface-card border border-border-default rounded-lg font-caption-medium text-caption-medium text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
              >
                <option value="all">Score (Tous)</option>
                <option value="high">Score &gt;= 4.5/5</option>
                <option value="mid">Score &gt;= 3.5/5</option>
              </select>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-space-sm self-end xl:self-auto">
            <button
              type="button"
              onClick={() => alert('Actions groupées : 3 candidats sélectionnés pour export ATS.')}
              className="inline-flex items-center gap-2 h-9 px-space-md bg-surface-card hover:bg-surface-container-high rounded-lg font-label-default text-label-default text-text-secondary border border-border-default shadow-sm transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              Actions groupées (3 sélectionnés)
              <span className="material-symbols-outlined text-[16px] text-text-muted">more_vert</span>
            </button>
            <button
              type="button"
              onClick={onOpenScheduleModal}
              className="inline-flex items-center gap-2 h-9 px-space-md bg-primary-container hover:bg-primary-hover text-white rounded-lg shadow-sm font-label-default text-label-default transition-all shadow-[0_2px_8px_rgba(79,70,229,0.25)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Planifier un entretien
            </button>
          </div>
        </div>
      </div>

      {/* Board or Table View */}
      {viewMode === 'kanban' ? (
        <div className="px-margin pb-space-lg overflow-x-auto">
          <div className="min-w-[1240px] grid grid-cols-5 gap-space-md items-start">
            {/* COLUMN 1: Candidature reçue */}
            <div className="flex flex-col gap-space-sm bg-surface-container-low/70 p-space-sm rounded-xl border border-border-default/40">
              <div className="flex items-center justify-between px-space-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-text-muted"></span>
                  <span className="font-body-semibold text-body-semibold text-text-primary">Candidature reçue</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-card text-text-secondary font-caption-medium text-caption-medium shadow-xs border border-border-default/50">
                    {getColCandidates('recue').length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Ajout manuel de candidature.')}
                  className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>

              <div className="flex flex-col gap-space-sm">
                {getColCandidates('recue').map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidateForDetails(c)}
                    className="bg-surface-card p-space-md rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative border border-border-default/60"
                  >
                    <div className="flex items-start justify-between gap-space-xs mb-space-xs">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded-full bg-primary-subtle text-primary-container font-body-semibold text-body-semibold flex items-center justify-center">
                          {c.initials}
                        </div>
                        <div>
                          <h4 className="font-body-semibold text-body-semibold text-text-primary group-hover:text-primary-container transition-colors">
                            {c.name}
                          </h4>
                          <p className="font-caption text-caption text-text-secondary">{c.roleTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCandidate(c.id, 'preselectionne');
                          }}
                          title="Déplacer vers Présélectionné"
                          className="text-primary hover:bg-primary-subtle p-1 rounded"
                        >
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-space-xs text-text-secondary font-caption text-caption">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-text-muted">work_outline</span>
                        {c.experienceYears} ans exp.
                      </span>
                      <span className="inline-flex items-center gap-1 font-caption-medium text-caption-medium text-warning-amber">
                        <span className="material-symbols-outlined text-[15px] text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        {c.score}<span className="text-text-muted font-caption text-caption">/5</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 my-space-xs">
                      {c.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded bg-surface-container font-caption text-caption text-text-secondary">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-space-sm pt-space-xs flex items-center justify-between text-text-muted font-caption text-caption border-t border-border-default/40">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        Reçu il y a {c.receivedDaysAgo}j
                      </span>
                      <span className="w-2 h-2 rounded-full bg-info-sky" title="CV téléchargé"></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: Présélectionné */}
            <div className="flex flex-col gap-space-sm bg-surface-container-low/70 p-space-sm rounded-xl border border-border-default/40">
              <div className="flex items-center justify-between px-space-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-info-sky"></span>
                  <span className="font-body-semibold text-body-semibold text-text-primary">Présélectionné</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-card text-text-secondary font-caption-medium text-caption-medium shadow-xs border border-border-default/50">
                    {getColCandidates('preselectionne').length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm">
                {getColCandidates('preselectionne').map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidateForDetails(c)}
                    className="bg-surface-card p-space-md rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group border border-border-default/60"
                  >
                    <div className="flex items-start justify-between gap-space-xs mb-space-xs">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded-full bg-secondary-fixed text-primary font-body-semibold text-body-semibold flex items-center justify-center">
                          {c.initials}
                        </div>
                        <div>
                          <h4 className="font-body-semibold text-body-semibold text-text-primary group-hover:text-primary-container transition-colors">
                            {c.name}
                          </h4>
                          <p className="font-caption text-caption text-text-secondary">{c.roleTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCandidate(c.id, 'entretien');
                          }}
                          title="Déplacer vers En entretien"
                          className="text-primary hover:bg-primary-subtle p-1 rounded"
                        >
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-space-xs text-text-secondary font-caption text-caption">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-text-muted">work_outline</span>
                        {c.experienceYears} ans exp.
                      </span>
                      <span className="inline-flex items-center gap-1 font-caption-medium text-caption-medium text-warning-amber">
                        <span className="material-symbols-outlined text-[15px] text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        {c.score}<span className="text-text-muted font-caption text-caption">/5</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 my-space-xs">
                      {c.skills.map((skill) => (
                        <span
                          key={skill}
                          className={`px-2 py-0.5 rounded font-caption text-caption ${
                            skill === 'DevSecOps'
                              ? 'bg-primary-subtle text-primary-container font-semibold'
                              : 'bg-surface-container text-text-secondary'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-space-sm pt-space-xs flex items-center justify-between text-text-muted font-caption text-caption border-t border-border-default/40">
                      <span className="inline-flex items-center gap-1 text-info-sky font-caption-medium text-caption-medium">
                        <span className="material-symbols-outlined text-[14px]">timelapse</span>
                        En stage depuis {c.receivedDaysAgo}j
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-success-emerald" title="Profil validé RH">
                        how_to_reg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 3: En entretien */}
            <div className="flex flex-col gap-space-sm bg-surface-container-low/70 p-space-sm rounded-xl border border-border-default/40">
              <div className="flex items-center justify-between px-space-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning-amber"></span>
                  <span className="font-body-semibold text-body-semibold text-text-primary">En entretien</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-card text-text-secondary font-caption-medium text-caption-medium shadow-xs border border-border-default/50">
                    {getColCandidates('entretien').length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm">
                {getColCandidates('entretien').map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidateForDetails(c)}
                    className="bg-surface-card p-space-md rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden border border-border-default/60"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning-amber"></div>
                    <div className="flex items-start justify-between gap-space-xs mb-space-xs pl-1">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-primary-container font-body-semibold text-body-semibold flex items-center justify-center">
                          {c.initials}
                        </div>
                        <div>
                          <h4 className="font-body-semibold text-body-semibold text-text-primary group-hover:text-primary-container transition-colors">
                            {c.name}
                          </h4>
                          <p className="font-caption text-caption text-text-secondary">{c.roleTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCandidate(c.id, 'retenu');
                          }}
                          title="Déplacer vers Retenu"
                          className="text-success-emerald hover:bg-emerald-50 p-1 rounded"
                        >
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    {/* Milestone Status Pill */}
                    {c.milestone && (
                      <div className="my-space-xs pl-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-success-dark font-caption-medium text-caption-medium">
                          <span className="material-symbols-outlined text-[14px] text-success-emerald">check_circle</span>
                          {c.milestone}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 py-space-xs pl-1 text-text-secondary font-caption text-caption">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-text-muted">work_outline</span>
                        {c.experienceYears} ans exp.
                      </span>
                      <span className="inline-flex items-center gap-1 font-caption-medium text-caption-medium text-warning-amber">
                        <span className="material-symbols-outlined text-[15px] text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        {c.score}<span className="text-text-muted font-caption text-caption">/5</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 my-space-xs pl-1">
                      {c.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded bg-surface-container font-caption text-caption text-text-secondary">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-space-sm pt-space-xs pl-1 flex items-center justify-between font-caption text-caption border-t border-border-default/40">
                      <span className="inline-flex items-center gap-1 text-text-muted">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        Debrief Manager demain
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-warning-text font-caption-medium text-caption-medium font-semibold">
                        {c.sla || 'SLA: J-1'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 4: Retenu */}
            <div className="flex flex-col gap-space-sm bg-surface-container-low/70 p-space-sm rounded-xl border border-border-default/40">
              <div className="flex items-center justify-between px-space-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success-emerald"></span>
                  <span className="font-body-semibold text-body-semibold text-text-primary">Retenu</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-card text-text-secondary font-caption-medium text-caption-medium shadow-xs border border-border-default/50">
                    {getColCandidates('retenu').length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm">
                {getColCandidates('retenu').map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidateForDetails(c)}
                    className="bg-surface-card p-space-md rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden border border-border-default/60"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-success-emerald"></div>
                    <div className="flex items-start justify-between gap-space-xs mb-space-xs pl-1">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-success-dark font-body-semibold text-body-semibold flex items-center justify-center">
                          {c.initials}
                        </div>
                        <div>
                          <h4 className="font-body-semibold text-body-semibold text-text-primary group-hover:text-primary-container transition-colors">
                            {c.name}
                          </h4>
                          <p className="font-caption text-caption text-text-secondary">{c.roleTitle}</p>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Status Pill */}
                    {c.milestone && (
                      <div className="my-space-xs pl-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-primary-container font-caption-medium text-caption-medium">
                          <span className="material-symbols-outlined text-[14px]">contract_edit</span>
                          {c.milestone}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 py-space-xs pl-1 text-text-secondary font-caption text-caption">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-text-muted">work_outline</span>
                        {c.experienceYears} ans exp.
                      </span>
                      <span className="inline-flex items-center gap-1 font-caption-medium text-caption-medium text-warning-amber">
                        <span className="material-symbols-outlined text-[15px] text-warning-amber" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        {c.score}<span className="text-text-muted font-caption text-caption">/5</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 my-space-xs pl-1">
                      {c.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded bg-surface-container font-caption text-caption text-text-secondary">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-space-sm pt-space-xs pl-1 flex items-center justify-between text-text-muted font-caption text-caption border-t border-border-default/40">
                      <span className="inline-flex items-center gap-1 text-success-dark font-caption-medium text-caption-medium font-semibold">
                        <span className="material-symbols-outlined text-[15px]">send_time_extension</span>
                        Package validé RH
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Génération de la promesse d'embauche pour ${c.name} (${c.salaryExpectation}).`);
                        }}
                        className="text-primary-container font-caption-medium text-caption-medium cursor-pointer hover:underline"
                      >
                        Offre →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 5: Refusé */}
            <div className="flex flex-col gap-space-sm bg-surface-container-low/70 p-space-sm rounded-xl border border-border-default/40">
              <div className="flex items-center justify-between px-space-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger-red"></span>
                  <span className="font-body-semibold text-body-semibold text-text-primary">Refusé</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-card text-text-secondary font-caption-medium text-caption-medium shadow-xs border border-border-default/50">
                    {getColCandidates('refuse').length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm">
                {getColCandidates('refuse').map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidateForDetails(c)}
                    className="bg-surface-card/60 p-space-md rounded-lg opacity-75 hover:opacity-100 transition-opacity cursor-pointer border border-border-default/50"
                  >
                    <div className="flex items-start justify-between gap-space-xs mb-space-xs">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high text-text-muted font-body-semibold text-body-semibold flex items-center justify-center">
                          {c.initials}
                        </div>
                        <div>
                          <h4 className="font-body-semibold text-body-semibold text-text-secondary line-through">
                            {c.name}
                          </h4>
                          <p className="font-caption text-caption text-text-muted">{c.roleTitle}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-danger-red text-[18px]">cancel</span>
                    </div>

                    {c.rejectionReason && (
                      <div className="mt-space-sm p-space-xs rounded bg-surface-container text-text-secondary font-caption text-caption flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-text-muted shrink-0">info</span>
                        <span>Motif: {c.rejectionReason}</span>
                      </div>
                    )}

                    <div className="mt-space-sm pt-space-xs flex items-center justify-between text-text-muted font-caption text-caption border-t border-border-default/40">
                      <span>Classé sans suite</span>
                      <span className="text-caption text-text-muted">Archivé il y a {c.receivedDaysAgo}j</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="px-margin pb-space-lg">
          <div className="bg-surface-card rounded-xl border border-border-default overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-bg-canvas text-text-secondary font-caption-medium uppercase tracking-wider border-b border-border-default">
                <tr>
                  <th className="py-3 px-4">Candidat</th>
                  <th className="py-3 px-4">Poste actuel / Exp.</th>
                  <th className="py-3 px-4">Compétences clés</th>
                  <th className="py-3 px-4">Score ATS</th>
                  <th className="py-3 px-4">Statut / Étape</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/50">
                {filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-bg-canvas transition-colors">
                    <td className="py-3 px-4 font-body-semibold text-text-primary flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-subtle text-primary font-bold flex items-center justify-center text-xs">
                        {c.initials}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {c.roleTitle} · {c.experienceYears} ans
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {c.skills.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-warning-amber">
                      ★ {c.score}/5
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          c.stage === 'retenu'
                            ? 'bg-emerald-100 text-success-dark'
                            : c.stage === 'entretien'
                            ? 'bg-amber-100 text-warning-text'
                            : c.stage === 'refuse'
                            ? 'bg-red-100 text-danger-red'
                            : 'bg-slate-100 text-text-secondary'
                        }`}
                      >
                        {c.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCandidateForDetails(c)}
                        className="px-3 py-1 rounded bg-bg-canvas hover:bg-slate-200 text-text-primary border border-border-default"
                      >
                        Consulter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Details Drawer Modal */}
      {selectedCandidateForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-card rounded-2xl shadow-xl max-w-lg w-full border border-border-default overflow-hidden">
            <div className="p-6 border-b border-border-default flex items-center justify-between bg-bg-canvas">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-subtle text-primary font-bold flex items-center justify-center text-lg">
                  {selectedCandidateForDetails.initials}
                </div>
                <div>
                  <h3 className="font-headline-sm text-text-primary">{selectedCandidateForDetails.name}</h3>
                  <p className="text-xs text-text-secondary">{selectedCandidateForDetails.roleTitle} · {selectedCandidateForDetails.experienceYears} ans d'expérience</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidateForDetails(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs font-body-default">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-text-muted">Score Évaluation :</span>
                  <div className="text-sm font-bold text-warning-amber">★ {selectedCandidateForDetails.score} / 5</div>
                </div>
                <div>
                  <span className="text-text-muted">Prétention salariale :</span>
                  <div className="text-sm font-bold text-text-primary">{selectedCandidateForDetails.salaryExpectation || '42 000 €'}</div>
                </div>
              </div>
              <div>
                <span className="font-semibold text-text-primary block mb-1">Compétences validées :</span>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedCandidateForDetails.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-semibold text-text-primary block mb-1">Notes d'entretien / Évaluation :</span>
                <p className="p-3 bg-bg-canvas rounded-lg text-text-secondary border border-border-default leading-relaxed">
                  {selectedCandidateForDetails.notes || 'Candidat évalué avec succès par l\'équipe de recrutement.'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-text-primary block mb-1">Changer d'étape :</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      moveCandidate(selectedCandidateForDetails.id, 'preselectionne');
                      setSelectedCandidateForDetails({ ...selectedCandidateForDetails, stage: 'preselectionne' });
                    }}
                    className="p-1.5 rounded border border-border-default hover:bg-slate-100 text-center text-xs"
                  >
                    Présélectionner
                  </button>
                  <button
                    onClick={() => {
                      moveCandidate(selectedCandidateForDetails.id, 'entretien');
                      setSelectedCandidateForDetails({ ...selectedCandidateForDetails, stage: 'entretien' });
                    }}
                    className="p-1.5 rounded bg-amber-50 text-warning-text border border-amber-200 text-center text-xs font-medium"
                  >
                    En entretien
                  </button>
                  <button
                    onClick={() => {
                      moveCandidate(selectedCandidateForDetails.id, 'retenu');
                      setSelectedCandidateForDetails({ ...selectedCandidateForDetails, stage: 'retenu' });
                    }}
                    className="p-1.5 rounded bg-emerald-50 text-success-dark border border-emerald-200 text-center text-xs font-medium"
                  >
                    Retenir pour offre
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border-default bg-bg-canvas flex justify-end gap-2">
              <button
                onClick={() => {
                  onOpenScheduleModal();
                  setSelectedCandidateForDetails(null);
                }}
                className="h-8 px-4 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">video_call</span>
                Planifier un entretien
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Quick Stats Strip */}
      <div className="mx-margin mb-space-lg p-space-md bg-surface-card rounded-xl shadow-sm border border-border-default flex flex-col md:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md flex-wrap">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-info-sky text-[20px]">speed</span>
            <span className="font-body-default text-body-default text-text-secondary">Délai moyen de qualification :</span>
            <span className="font-body-semibold text-body-semibold text-text-primary">2,4 jours</span>
          </div>
          <span className="hidden md:inline text-text-muted">·</span>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-warning-amber text-[20px]">workspace_premium</span>
            <span className="font-body-default text-body-default text-text-secondary">Score moyen des candidats retenus :</span>
            <span className="font-body-semibold text-body-semibold text-text-primary">4.85 / 5</span>
          </div>
        </div>

        {/* Quick Insights Actions */}
        <div className="flex items-center gap-space-sm">
          <span className="font-caption text-caption text-text-muted">Synchronisé avec Workday ATS</span>
          <button
            type="button"
            onClick={() => onNavigate('approbation-direction')}
            className="inline-flex items-center gap-1 text-primary-container hover:text-primary-hover font-caption-medium text-caption-medium transition-colors cursor-pointer"
          >
            <span>Rapport complet de campagne</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
