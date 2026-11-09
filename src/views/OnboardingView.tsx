import React, { useState } from 'react';
import { ViewMode } from '../types/sirh';
import { ONBOARDING_LIST } from '../data/mockData';

interface OnboardingViewProps {
  onNavigate: (view: ViewMode) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onNavigate }) => {
  const [onboardings, setOnboardings] = useState(ONBOARDING_LIST);
  const [selectedOnboarding, setSelectedOnboarding] = useState(ONBOARDING_LIST[0]);

  const [tasks, setTasks] = useState([
    { id: 1, title: 'Création des accès SSO, e-mail et compte Slack', done: true, category: 'IT' },
    { id: 2, title: 'Attribution du badge d\'accès physique et parking', done: true, category: 'Moyens Généraux' },
    { id: 3, title: 'Préparation du poste de travail sécurisé (MacBook Pro M3 + YubiKey)', done: true, category: 'IT' },
    { id: 4, title: 'Signature du contrat et adhésion mutuelle Alan', done: true, category: 'RH' },
    { id: 5, title: 'Désignation du Buddy / Parrain d\'intégration', done: true, category: 'Équipe' },
    { id: 6, title: 'Planification du point d\'accueil RH Jour J à 09:30', done: true, category: 'RH' },
    { id: 7, title: 'Session de formation sensibilisation cybersécurité NIS2', done: true, category: 'Sécurité' },
    { id: 8, title: 'Transmission de la convention d\'objectifs des 90 jours', done: true, category: 'Manager' },
    { id: 9, title: 'Validation des accès aux clusters Kubernetes de staging', done: false, category: 'IT' },
    { id: 10, title: 'Déjeuner d\'équipe au restaurant d\'entreprise', done: false, category: 'Équipe' },
    { id: 11, title: 'Bilan de première semaine (Rapport d\'étonnement)', done: false, category: 'RH' },
    { id: 12, title: 'Clôture de la période d\'essai initiale (Mois 3)', done: false, category: 'RH' },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const progressPct = Math.round((doneCount / tasks.length) * 100);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="max-w-7xl mx-auto w-full px-margin py-space-lg flex flex-col gap-space-lg">
        {/* Header */}
        <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Gestion des talents</span>
              <span>•</span>
              <span className="text-purple-600 font-bold">Parcours d'intégration</span>
            </div>
            <h1 className="font-headline-lg text-text-primary">Arrivées & Onboarding</h1>
            <p className="text-sm text-text-secondary">
              Checklists opérationnelles, préparation du matériel IT et suivi des 90 premiers jours.
            </p>
          </div>
          <button
            onClick={() => onNavigate('tableau-de-bord')}
            className="h-9 px-4 bg-bg-canvas hover:bg-slate-200 text-text-primary rounded-lg font-semibold text-xs border border-border-default shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Retour au tableau de bord</span>
          </button>
        </div>

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Left Column: List of new hires */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1">
              Collaborateurs en cours d'intégration ({onboardings.length})
            </h3>
            {onboardings.map((p) => {
              const isSelected = selectedOnboarding.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedOnboarding(p)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-surface-card border-primary-container shadow-md ring-2 ring-primary-subtle'
                      : 'bg-surface-card border-border-default hover:bg-bg-canvas'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-sm ${p.colorScheme.includes('text') ? p.colorScheme : 'bg-primary-container text-white'}`}>
                        {p.initials}
                      </div>
                      <div>
                        <div className="font-body-semibold text-text-primary text-sm">{p.name}</div>
                        <div className="text-xs text-text-secondary">{p.department} • {p.roleTitle}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-warning-text font-bold text-xs tabular-nums border border-amber-200">
                      J-{p.daysRemaining}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Arrivée : {p.arrivalDate}
                    </span>
                    <span className="font-semibold text-text-primary tabular-nums">
                      {isSelected ? `${doneCount}/12 (${progressPct}%)` : `${p.tasksDone}/${p.tasksTotal}`}
                    </span>
                  </div>

                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-primary-container h-full rounded-full transition-all duration-300"
                      style={{ width: `${isSelected ? progressPct : (p.tasksDone / p.tasksTotal) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Checklist */}
          <div className="lg:col-span-7 bg-surface-card p-space-lg rounded-xl border border-border-default shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <div>
                <h2 className="font-headline-sm text-text-primary">
                  Checklist d'intégration · {selectedOnboarding.name}
                </h2>
                <p className="text-xs text-text-muted">
                  Poste : {selectedOnboarding.roleTitle} ({selectedOnboarding.department}) · Arrivée prévue le {selectedOnboarding.arrivalDate}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary-subtle text-primary font-bold text-xs">
                {progressPct}% complété
              </span>
            </div>

            {/* Task list with interactive toggles */}
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    task.done ? 'bg-bg-canvas border-border-default/60 opacity-80' : 'bg-white border-border-default hover:border-primary-container'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-primary-container focus:ring-primary cursor-pointer"
                    />
                    <span className={`text-xs ${task.done ? 'line-through text-text-muted' : 'font-medium text-text-primary'}`}>
                      {task.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-text-secondary font-medium">
                    {task.category}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border-default flex items-center justify-between">
              <span className="text-xs text-text-muted">
                Dernière mise à jour par Claire Delorme (RH)
              </span>
              <button
                onClick={() => alert(`Rappel d'onboarding envoyé à l'équipe IT pour ${selectedOnboarding.name}.`)}
                className="h-8 px-3 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                Notifier les intervenants
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
