import React from 'react';
import { UserProfile, ViewMode } from '../types/sirh';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  currentUser: UserProfile;
  onLogout: () => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  pendingCount = 5,
}) => {
  const isAllowed = (view: ViewMode) => {
    return currentUser.allowedViews?.includes(view) ?? true;
  };

  const handleNavClick = (view: ViewMode) => {
    onNavigate(view);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar-surface z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-space-lg flex items-center justify-between border-b border-slate-700/60">
          <button 
            onClick={() => onNavigate('tableau-de-bord')}
            className="flex items-center gap-space-sm text-left focus:outline-none cursor-pointer"
          >
            <img 
              alt="Logo SIRH" 
              className="h-8 w-auto object-contain" 
              src="https://lh3.googleusercontent.com/aida/AEtjO1WGo5K86fGA261TLWE2cszuh0E5VQNByaEplC_7oIXgWjsz0TcQH1ZRe3c929_HaeIpBACBqXsxkNhguMLMIpQGshT0U3McPeMvNxAeJsLhKPharNCMxE878ce9JKczrz0csLE4jRJkKKM3tWDUcgjHB3aB9OO06v-85SNt1ZD82DNuVf9y62gozmsJthRe7GbyxeF5CTKrQ2RZjMlStX7Dn1weDnEPQ5aO4Yyh6yLQ3dmboX0UuPg7Z6Q"
            />
            <span className="font-headline-sm text-headline-sm text-white tracking-wide">SIRH</span>
          </button>
          <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
            {currentUser.roleType}
          </div>
        </div>

        {/* Section Label */}
        <div className="px-space-md py-space-sm flex items-center justify-between">
          <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted px-space-sm">
            Navigation ({currentUser.roleType})
          </span>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-space-xs px-space-md overflow-y-auto max-h-[calc(100vh-220px)]">
          {/* Tableau de bord */}
          <button
            onClick={() => handleNavClick('tableau-de-bord')}
            className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors text-left w-full cursor-pointer ${
              currentView === 'tableau-de-bord'
                ? 'bg-primary-container text-white font-body-semibold shadow-sm'
                : 'text-text-muted hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="font-body-medium text-body-medium">Tableau de bord</span>
          </button>

          {/* Mes demandes */}
          <button
            onClick={() => handleNavClick('mes-demandes')}
            className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors text-left w-full cursor-pointer ${
              currentView === 'mes-demandes'
                ? 'bg-primary-container text-white font-body-semibold shadow-sm'
                : 'text-text-muted hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">assignment</span>
            <span className="font-body-medium text-body-medium">Mes demandes</span>
          </button>

          {/* Nouvelle demande */}
          <button
            onClick={() => handleNavClick('nouvelle-demande')}
            className={`flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors text-left w-full cursor-pointer ${
              currentView === 'nouvelle-demande'
                ? 'bg-primary-container text-white font-body-semibold shadow-sm'
                : isAllowed('nouvelle-demande')
                ? 'text-text-muted hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span className="font-body-medium text-body-medium">Nouvelle demande</span>
            </div>
            {!isAllowed('nouvelle-demande') && (
              <span className="material-symbols-outlined text-[16px] text-slate-500" title="Réservé aux Managers et RH">
                lock
              </span>
            )}
          </button>

          {/* Recrutement */}
          <button
            onClick={() => handleNavClick('recrutement')}
            className={`flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors text-left w-full cursor-pointer ${
              currentView === 'recrutement'
                ? 'bg-primary-container text-white font-body-semibold shadow-sm'
                : isAllowed('recrutement')
                ? 'text-text-muted hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">person_search</span>
              <span className="font-body-medium text-body-medium">Recrutement</span>
            </div>
            {!isAllowed('recrutement') && (
              <span className="material-symbols-outlined text-[16px] text-slate-500" title="Accès restreint">
                lock
              </span>
            )}
          </button>

          {/* Validation & Finance */}
          <button
            onClick={() => handleNavClick('validation-finance')}
            className={`flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors text-left w-full cursor-pointer ${
              currentView === 'validation-finance'
                ? 'bg-primary-container text-white font-body-semibold shadow-sm'
                : isAllowed('validation-finance')
                ? 'text-text-muted hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
              <span className="font-body-medium text-body-medium">Validation & Finance</span>
            </div>
            <div className="flex items-center gap-1.5">
              {!isAllowed('validation-finance') ? (
                <span className="material-symbols-outlined text-[16px] text-slate-500" title="Réservé à la Finance / Direction">
                  lock
                </span>
              ) : (
                <span className="bg-warning-amber text-warning-text px-space-xs py-0.5 rounded-full font-caption-medium text-caption-medium text-[11px] font-semibold">
                  {pendingCount}
                </span>
              )}
            </div>
          </button>

          {/* Évaluation RH REQ-0042 */}
          <button
            onClick={() => handleNavClick('qualification-rh')}
            className={`flex items-center justify-between px-space-md py-2 rounded-lg transition-colors text-left w-full text-xs cursor-pointer ${
              currentView === 'qualification-rh'
                ? 'bg-indigo-900/60 text-indigo-200 font-semibold'
                : isAllowed('qualification-rh')
                ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-space-sm truncate">
              <span className="material-symbols-outlined text-[16px] text-sky-400">verified</span>
              <span className="truncate">Éval. RH (REQ-0042)</span>
            </div>
            {!isAllowed('qualification-rh') && (
              <span className="material-symbols-outlined text-[14px] text-slate-500" title="Non habilité RH">
                lock
              </span>
            )}
          </button>

          {/* Visa Direction REQ-0042 */}
          <button
            onClick={() => handleNavClick('approbation-direction')}
            className={`flex items-center justify-between px-space-md py-2 rounded-lg transition-colors text-left w-full text-xs cursor-pointer ${
              currentView === 'approbation-direction'
                ? 'bg-indigo-900/60 text-indigo-200 font-semibold'
                : isAllowed('approbation-direction')
                ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-space-sm truncate">
              <span className="material-symbols-outlined text-[16px] text-amber-400">gavel</span>
              <span className="truncate">Visa Direction (REQ-0042)</span>
            </div>
            {!isAllowed('approbation-direction') && (
              <span className="material-symbols-outlined text-[14px] text-slate-500" title="Réservé à la Direction Générale">
                lock
              </span>
            )}
          </button>

          {/* Employés & Contrats */}
          <button
            onClick={() => handleNavClick('employes-contrats')}
            className={`flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors text-left w-full cursor-pointer ${
              currentView === 'employes-contrats'
                ? 'bg-primary-container text-white font-body-semibold shadow-sm'
                : isAllowed('employes-contrats')
                ? 'text-text-muted hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">badge</span>
              <span className="font-body-medium text-body-medium">Employés & Contrats</span>
            </div>
            {!isAllowed('employes-contrats') && (
              <span className="material-symbols-outlined text-[16px] text-slate-500" title="Réservé RH">
                lock
              </span>
            )}
          </button>

          {/* Onboarding */}
          <button
            onClick={() => handleNavClick('onboarding')}
            className={`flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors text-left w-full cursor-pointer ${
              currentView === 'onboarding'
                ? 'bg-primary-container text-white font-body-semibold shadow-sm'
                : isAllowed('onboarding')
                ? 'text-text-muted hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              <span className="font-body-medium text-body-medium">Onboarding</span>
            </div>
            {!isAllowed('onboarding') && (
              <span className="material-symbols-outlined text-[16px] text-slate-500" title="Réservé RH">
                lock
              </span>
            )}
          </button>

          <button
            onClick={() => handleNavClick('pointage')}
            className={`flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors text-left w-full cursor-pointer ${currentView === 'pointage' ? 'bg-primary-container text-white font-body-semibold shadow-sm' : 'text-text-muted hover:bg-slate-800 hover:text-white'}`}
          >
            <span className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-[20px]">schedule</span><span className="font-body-medium text-body-medium">Pointage</span></span>
          </button>

          {/* Référentiels & Admin */}
          <button
            onClick={() => handleNavClick('referentiels-admin')}
            className={`flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors text-left w-full cursor-pointer ${
              currentView === 'referentiels-admin'
                ? 'bg-primary-container text-white font-body-semibold shadow-sm'
                : isAllowed('referentiels-admin')
                ? 'text-text-muted hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="font-body-medium text-body-medium">Référentiels & Admin</span>
            </div>
            {!isAllowed('referentiels-admin') && (
              <span className="material-symbols-outlined text-[16px] text-slate-500" title="Réservé Admin">
                lock
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Footer User & Compliance Badge */}
      <div className="p-space-md border-t border-slate-700/60 space-y-2">
        {currentUser.managedDepartmentNames && currentUser.managedDepartmentNames.length > 1 && (
          <div className="p-2.5 rounded-lg bg-blue-950/70 border border-blue-800/70 text-blue-200 text-[11px]">
            <div className="font-bold flex items-center justify-between text-blue-300">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-blue-400">domain</span>
                <span>Responsable de {currentUser.managedDepartmentNames.length} dpts</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            </div>
            <div className="text-[10px] text-blue-300/80 mt-1 space-y-0.5">
              {currentUser.managedDepartmentNames.map((d, i) => (
                <div key={i} className="truncate">• {d.split('(')[0].trim()}</div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          type="button"
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-red-950/40 text-slate-300 hover:text-danger-red transition-colors text-xs cursor-pointer border border-slate-700/60"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Se déconnecter</span>
          </div>
          <span className="text-[10px] text-slate-400">Session active</span>
        </button>

        <div className="bg-slate-800/80 rounded-lg p-space-sm flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-info-sky text-[18px]">verified_user</span>
            <div className="flex flex-col">
              <span className="font-caption-medium text-caption-medium text-white">Portail Conforme</span>
              <span className="font-caption text-caption text-text-muted">RGPD & CSE</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-text-muted text-[16px]">info</span>
        </div>
      </div>
    </aside>
  );
};
