import React from 'react';
import { ViewMode } from '../types/sirh';

interface ReferentielsAdminViewProps {
  onNavigate: (view: ViewMode) => void;
}

export const ReferentielsAdminView: React.FC<ReferentielsAdminViewProps> = ({ onNavigate }) => {
  const grades = [
    { grade: 'Grade G3', label: 'Technicien / Développeur Junior', coef: '2.1', min: 2100, max: 2700, ceilingIT: 2600 },
    { grade: 'Grade G4', label: 'Ingénieur Confirmé / Chef de Projet RH', coef: '2.3', min: 2400, max: 3200, ceilingIT: 3100 },
    { grade: 'Grade G5', label: 'Ingénieur Senior / DevSecOps / Lead Tech', coef: '3.1', min: 2500, max: 3500, ceilingIT: 3400 },
    { grade: 'Grade G6', label: 'Architecte Solution / Principal Engineer', coef: '3.2', min: 2800, max: 4200, ceilingIT: 4000 },
    { grade: 'Grade G7', label: 'Engineering Director / Expert Référent', coef: '3.3', min: 3500, max: 5500, ceilingIT: 5200 },
  ];

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="max-w-7xl mx-auto w-full px-margin py-space-lg flex flex-col gap-space-lg">
        {/* Header */}
        <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Administration SIRH</span>
              <span>•</span>
              <span className="text-primary font-bold">Barèmes Conventionnels 2026</span>
            </div>
            <h1 className="font-headline-lg text-text-primary">Référentiels Métiers & Grilles Salariales</h1>
            <p className="text-sm text-text-secondary">
              Synchronisation avec les accords de branche SYNTEC et règles d'arbitrage budgétaire approuvées par le CODIR.
            </p>
          </div>
          <button
            onClick={() => onNavigate('nouvelle-demande')}
            className="h-9 px-4 bg-primary-container hover:bg-primary-hover text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Tester une réquisition</span>
          </button>
        </div>

        {/* Rule parameters cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          <div className="p-space-md bg-surface-card rounded-xl border border-border-default shadow-sm flex flex-col gap-1">
            <span className="text-xs text-text-muted font-bold uppercase">Taux de charges patronales</span>
            <div className="text-2xl font-bold text-text-primary tabular-nums">40,0 %</div>
            <p className="text-xs text-text-secondary">Formule appliquée : Brut mensuel × 12 mois × 1,40</p>
          </div>
          <div className="p-space-md bg-surface-card rounded-xl border border-border-default shadow-sm flex flex-col gap-1">
            <span className="text-xs text-text-muted font-bold uppercase">Tolérance Dérogation Finance</span>
            <div className="text-2xl font-bold text-warning-text tabular-nums">10,0 %</div>
            <p className="text-xs text-text-secondary">Plafond max d'arbitrage par le Contrôle de Gestion sans visa DG</p>
          </div>
          <div className="p-space-md bg-surface-card rounded-xl border border-border-default shadow-sm flex flex-col gap-1">
            <span className="text-xs text-text-muted font-bold uppercase">SLA Approbation Recrutement</span>
            <div className="text-2xl font-bold text-success-dark tabular-nums">48h / 72h</div>
            <p className="text-xs text-text-secondary">Qualification RH (48h) · Contrôle Finance & Arbitrage (72h)</p>
          </div>
        </div>

        {/* Grades Table */}
        <div className="bg-surface-card rounded-xl border border-border-default shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border-default flex items-center justify-between bg-bg-canvas">
            <h2 className="font-headline-sm text-text-primary text-base">
              Grilles SYNTEC 2026 & Plafonds Budgétaires DSI
            </h2>
            <span className="text-xs text-text-muted">Dernière mise à jour : Accord d'entreprise du 01/01/2026</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-bg-canvas/50 text-text-secondary uppercase font-semibold border-b border-border-default">
              <tr>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Exemple d'Intitulé</th>
                <th className="py-3 px-4">Coefficient Syntec</th>
                <th className="py-3 px-4">Fourchette Conventionnelle</th>
                <th className="py-3 px-4">Plafond DSI (IT)</th>
                <th className="py-3 px-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/40">
              {grades.map((g) => (
                <tr
                  key={g.grade}
                  className={`hover:bg-bg-canvas transition-colors ${
                    g.grade === 'Grade G5' ? 'bg-primary-subtle/30 font-semibold' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">
                    {g.grade}
                  </td>
                  <td className="py-3.5 px-4 text-text-primary">
                    {g.label}
                    {g.grade === 'Grade G5' && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-primary-container text-white text-[10px]">
                        Poste actif (REQ-0042)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono">{g.coef}</td>
                  <td className="py-3.5 px-4 tabular-nums text-text-primary font-medium">
                    {g.min.toLocaleString('fr-FR')} € — {g.max.toLocaleString('fr-FR')} € / mois
                  </td>
                  <td className="py-3.5 px-4 tabular-nums text-warning-text font-bold">
                    {g.ceilingIT.toLocaleString('fr-FR')} € / mois
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-success-dark font-medium">
                      Actif CODIR
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
