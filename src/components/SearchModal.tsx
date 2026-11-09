import React, { useState, useEffect } from 'react';
import { ViewMode } from '../types/sirh';
import { CANDIDATES_DATA, INITIAL_REQUISITIONS } from '../data/mockData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewMode) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle or open
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredRequisitions = INITIAL_REQUISITIONS.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.code.toLowerCase().includes(query.toLowerCase()) ||
      r.department.toLowerCase().includes(query.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCandidates = CANDIDATES_DATA.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.roleTitle.toLowerCase().includes(query.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface-card rounded-2xl shadow-2xl max-w-xl w-full border border-border-default overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-border-default flex items-center gap-3 bg-white">
          <span className="material-symbols-outlined text-primary-container text-[24px]">search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une demande, un candidat, un grade... (ex: DevSecOps, G5, Julien)"
            className="w-full text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
          />
          <button
            onClick={onClose}
            className="px-2 py-0.5 rounded text-[11px] font-mono text-text-muted bg-slate-100 hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Quick Views */}
          <div>
            <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted px-2 block mb-1">
              Accès Rapide aux Vues
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => { onNavigate('tableau-de-bord'); onClose(); }}
                className="p-2 rounded-lg bg-bg-canvas hover:bg-primary-subtle hover:text-primary transition-colors text-left flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Tableau de bord RH</span>
              </button>
              <button
                onClick={() => { onNavigate('nouvelle-demande'); onClose(); }}
                className="p-2 rounded-lg bg-bg-canvas hover:bg-primary-subtle hover:text-primary transition-colors text-left flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Nouvelle demande de poste</span>
              </button>
              <button
                onClick={() => { onNavigate('validation-finance'); onClose(); }}
                className="p-2 rounded-lg bg-bg-canvas hover:bg-primary-subtle hover:text-primary transition-colors text-left flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                <span>Validation Finance & Arbitrage</span>
              </button>
              <button
                onClick={() => { onNavigate('recrutement'); onClose(); }}
                className="p-2 rounded-lg bg-bg-canvas hover:bg-primary-subtle hover:text-primary transition-colors text-left flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">person_search</span>
                <span>Campagne Recrutement Kanban</span>
              </button>
            </div>
          </div>

          {/* Requisitions */}
          {filteredRequisitions.length > 0 && (
            <div>
              <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted px-2 block mb-1">
                Demandes de recrutement ({filteredRequisitions.length})
              </span>
              <div className="space-y-1">
                {filteredRequisitions.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (r.code === 'REQ-2026-0042') {
                        onNavigate('validation-finance');
                      } else {
                        onNavigate('mes-demandes');
                      }
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-bg-canvas cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-border-default"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-primary font-semibold">{r.code}</span>
                      <div>
                        <div className="font-body-semibold text-text-primary">{r.title}</div>
                        <div className="text-[11px] text-text-muted">{r.department} · Demandeur: {r.requesterName}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-text-secondary">
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidates */}
          {filteredCandidates.length > 0 && (
            <div>
              <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted px-2 block mb-1">
                Candidats correspondants ({filteredCandidates.length})
              </span>
              <div className="space-y-1">
                {filteredCandidates.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('recrutement');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-bg-canvas cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-border-default"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary-subtle text-primary font-bold flex items-center justify-center text-xs">
                        {c.initials}
                      </div>
                      <div>
                        <div className="font-body-semibold text-text-primary">{c.name}</div>
                        <div className="text-[11px] text-text-muted">{c.roleTitle} · {c.skills.join(', ')}</div>
                      </div>
                    </div>
                    <span className="font-semibold text-warning-amber">★ {c.score}/5</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
