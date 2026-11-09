import React from 'react';
import { UserProfile, ViewMode } from '../types/sirh';

interface AccessDeniedViewProps {
  currentUser: UserProfile;
  attemptedView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onSwitchUserPrompt: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  currentUser,
  attemptedView,
  onNavigate,
  onSwitchUserPrompt,
}) => {
  const getRequiredRole = () => {
    switch (attemptedView) {
      case 'qualification-rh':
        return 'Pôle RH / Ressources Humaines (Claire Delorme)';
      case 'validation-finance':
        return 'Contrôle de Gestion / Direction Financière (Gilles Vaudon)';
      case 'approbation-direction':
        return 'Direction Générale / Membre CODIR';
      case 'onboarding':
      case 'employes-contrats':
        return 'Pôle Ressources Humaines & Mobilité';
      case 'referentiels-admin':
        return 'Administration RH & Contrôle Financier';
      default:
        return 'Habilitation supérieure requise';
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-bg-canvas">
      <div className="max-w-lg w-full bg-surface-card rounded-2xl shadow-xl border border-border-default p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-danger-red flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[36px]">gpp_maybe</span>
        </div>

        <span className="px-3 py-1 rounded-full bg-red-50 text-danger-red font-caption-medium text-xs font-semibold mb-2 border border-red-200">
          Erreur 403 · Habilitation Insuffisante
        </span>

        <h2 className="font-headline-sm text-xl text-text-primary font-bold">
          Accès Restreint par la Politique RBAC
        </h2>

        <p className="text-xs text-text-secondary mt-2 leading-relaxed">
          Votre compte actif <strong className="text-text-primary">{currentUser.name}</strong> ({currentUser.role}) ne dispose pas des droits nécessaires pour accéder à cette vue opérationnelle.
        </p>

        <div className="w-full bg-bg-canvas rounded-xl p-4 my-6 text-left border border-border-default space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Rôle requis :</span>
            <span className="font-semibold text-text-primary">{getRequiredRole()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Votre rôle actuel :</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 font-bold text-text-primary">
              {currentUser.roleType}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Principe de conformité :</span>
            <span className="text-text-secondary">Séparation des pouvoirs (Norme CSE)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            type="button"
            onClick={() => onNavigate('tableau-de-bord')}
            className="w-full sm:flex-1 h-10 rounded-lg bg-bg-canvas hover:bg-slate-200 text-text-primary border border-border-default text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Mon tableau de bord</span>
          </button>

          <button
            type="button"
            onClick={onSwitchUserPrompt}
            className="w-full sm:flex-1 h-10 rounded-lg bg-primary-container hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">switch_account</span>
            <span>Changer d'utilisateur</span>
          </button>
        </div>
      </div>
    </div>
  );
};
