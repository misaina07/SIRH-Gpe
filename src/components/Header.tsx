import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ViewMode } from '../types/sirh';
import { USER_PROFILES } from '../data/mockData';
import { DepartmentPositionsDropdown } from './DepartmentPositionsDropdown';

interface HeaderProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onOpenSearch: () => void;
  onLogout: () => void;
  notificationCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onSelectUser,
  onOpenSearch,
  onLogout,
  notificationCount,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'tableau-de-bord':
        return 'Tableau de bord RH';
      case 'mes-demandes':
        return 'Registre des demandes';
      case 'nouvelle-demande':
        return 'Nouvelle demande de poste';
      case 'recrutement':
        return 'Campagne DevSecOps (OFF-2026-0012)';
      case 'validation-finance':
        return 'Évaluation Financière & Arbitrage';
      case 'qualification-rh':
        return 'Qualification RH (REQ-2026-0042)';
      case 'approbation-direction':
        return 'Approbation finale Direction Générale';
      case 'employes-contrats':
        return 'Gestion Employés & Contrats';
      case 'onboarding':
        return 'Parcours d\'intégration & Onboarding';
      case 'referentiels-admin':
        return 'Référentiels Métiers & Barèmes';
      default:
        return 'Vue opérationnelle';
    }
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-card/90 backdrop-blur-xl z-40 border-b border-border-default shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-gutter flex items-center justify-between gap-space-md">
        {/* Left: Breadcrumbs & Quick Search */}
        <div className="flex items-center gap-space-md min-w-0">
          <div className="hidden lg:flex items-center gap-space-xs text-text-secondary font-caption-medium text-caption-medium whitespace-nowrap">
            <button 
              onClick={() => onNavigate('tableau-de-bord')}
              className="hover:text-text-primary cursor-pointer transition-colors"
            >
              Portail SIRH
            </button>
            <span className="material-symbols-outlined text-[14px] text-text-muted">chevron_right</span>
            <span className="text-text-primary font-body-semibold">{getBreadcrumbTitle()}</span>
          </div>

          {/* Search Bar */}
          <div className="relative w-64 md:w-80 lg:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
              search
            </span>
            <input
              type="text"
              readOnly
              onClick={onOpenSearch}
              className="w-full h-9 pl-9 pr-space-md bg-bg-canvas border border-border-default rounded-lg font-body-default text-body-default text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all cursor-pointer"
              placeholder="Rechercher une demande, un candidat, un employé… (Cmd+K)"
            />
            <span className="hidden sm:inline absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-muted px-1.5 py-0.5 rounded border border-border-default bg-white">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: SLA, Department positions dropdown, Notifications & Profile */}
        <div className="flex items-center gap-space-sm sm:gap-space-md">
          {/* Quick Access: Postes par Département Dropdown */}
          <DepartmentPositionsDropdown onNavigate={onNavigate} currentUser={currentUser} />

          {/* Multi-department badge if manager */}
          {currentUser.managedDepartmentNames && currentUser.managedDepartmentNames.length > 1 && (
            <div className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 font-caption-medium text-xs">
              <span className="material-symbols-outlined text-[14px] text-blue-600">domain</span>
              <span>{currentUser.managedDepartmentNames.length} dpts supervisés</span>
            </div>
          )}

          {/* SLA Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-success-dark font-caption-medium text-caption-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-success-emerald animate-pulse"></span>
            <span>SLA 98.4%</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifMenuOpen(!notifMenuOpen)}
              aria-label="Notifications"
              className="p-space-xs text-text-secondary hover:text-text-primary hover:bg-bg-canvas rounded-lg transition-colors relative flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {notificationCount > 0 && (
                <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-danger-red text-white font-caption-medium text-[10px] leading-none font-bold">
                  {notificationCount}
                </span>
              )}
            </button>

            {notifMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface-card border border-border-default rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-border-default flex items-center justify-between">
                  <span className="font-body-semibold text-text-primary text-xs uppercase tracking-wider">
                    Notifications Récentes
                  </span>
                  <span className="text-[11px] text-primary-container font-medium cursor-pointer hover:underline">
                    Tout marquer comme lu
                  </span>
                </div>
                <div className="divide-y divide-border-default/50 max-h-72 overflow-y-auto">
                  <div 
                    onClick={() => { onNavigate('validation-finance'); setNotifMenuOpen(false); }}
                    className="p-3 hover:bg-bg-canvas transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-body-semibold text-xs text-text-primary">Arbitrage Finance Requis</span>
                      <span className="text-[10px] text-text-muted">Il y a 18 min</span>
                    </div>
                    <p className="font-caption text-text-secondary mt-0.5 text-xs">
                      REQ-2026-0042 (DevSecOps) : Dépassement de grille +200 € à valider par dérogation.
                    </p>
                  </div>
                  <div 
                    onClick={() => { onNavigate('qualification-rh'); setNotifMenuOpen(false); }}
                    className="p-3 hover:bg-bg-canvas transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-body-semibold text-xs text-warning-text">Échéance RH J-0</span>
                      <span className="text-[10px] text-text-muted">Il y a 1h</span>
                    </div>
                    <p className="font-caption text-text-secondary mt-0.5 text-xs">
                      REQ-2026-0045 (Chef de Projet RH) : Demande en attente de qualification.
                    </p>
                  </div>
                  <div 
                    onClick={() => { onNavigate('recrutement'); setNotifMenuOpen(false); }}
                    className="p-3 hover:bg-bg-canvas transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-body-semibold text-xs text-success-dark">Entretien validé</span>
                      <span className="text-[10px] text-text-muted">Hier</span>
                    </div>
                    <p className="font-caption text-text-secondary mt-0.5 text-xs">
                      Julien Vasseur a réussi l'évaluation technique DevSecOps (4.8/5).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-border-default hidden sm:block"></div>

          {/* User Profile & Persona Switcher */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-space-sm pl-space-xs cursor-pointer group text-left focus:outline-none"
            >
              {currentUser.avatar ? (
                <img
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-border-default"
                  src={currentUser.avatar}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-subtle text-primary font-body-semibold text-xs flex items-center justify-center ring-2 ring-border-default">
                  {currentUser.initials}
                </div>
              )}
              <div className="hidden md:flex flex-col text-left">
                <span className="font-body-semibold text-body-semibold text-text-primary leading-tight">
                  {currentUser.name}
                </span>
                <span className="font-caption text-caption text-text-secondary leading-tight">
                  {currentUser.role}
                </span>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[18px] group-hover:text-text-primary transition-colors">
                expand_more
              </span>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface-card border border-border-default rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] py-space-xs z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-space-md py-space-sm border-b border-border-default">
                  <p className="font-body-semibold text-body-semibold text-text-primary">{currentUser.name}</p>
                  <p className="font-caption text-caption text-text-muted truncate">{currentUser.email}</p>
                  <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-subtle text-primary uppercase">
                    Rôle actif : {currentUser.roleType}
                  </span>
                </div>

                {/* Role Persona Switcher (Convenient for test & evaluation) */}
                <div className="px-3 py-2 border-b border-border-default bg-bg-canvas/60">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Changer de profil (Simulation)
                  </span>
                  <div className="flex flex-col gap-1">
                    {USER_PROFILES.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setProfileMenuOpen(false);
                        }}
                        className={`text-left px-2 py-1 text-xs rounded flex items-center justify-between transition-colors ${
                          currentUser.id === u.id
                            ? 'bg-primary-container text-white font-semibold'
                            : 'hover:bg-slate-200/70 text-text-secondary'
                        }`}
                      >
                        <span className="truncate">{u.name}</span>
                        <span className="text-[10px] opacity-75">{u.roleType}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { onNavigate('tableau-de-bord'); setProfileMenuOpen(false); }}
                  className="w-full flex items-center gap-space-sm px-space-md py-space-sm font-body-default text-body-default text-text-secondary hover:bg-bg-canvas hover:text-text-primary transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  Mon profil
                </button>
                <button
                  type="button"
                  onClick={() => { onNavigate('referentiels-admin'); setProfileMenuOpen(false); }}
                  className="w-full flex items-center gap-space-sm px-space-md py-space-sm font-body-default text-body-default text-text-secondary hover:bg-bg-canvas hover:text-text-primary transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  Préférences & Barèmes
                </button>

                <div className="my-space-xs border-t border-border-default"></div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-space-sm px-space-md py-space-sm font-body-default text-body-default text-danger-red hover:bg-red-50 transition-colors text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
