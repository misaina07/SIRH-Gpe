import React, { useEffect, useState } from 'react';
import { Requisition, UserProfile, ViewMode } from '../types/sirh';
import { apiGet, apiPost } from '../services/api';

interface FinanceValidationViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenDocModal: () => void;
  currentUser: UserProfile;
  onValidationSuccess?: () => void;
}

export const FinanceValidationView: React.FC<FinanceValidationViewProps> = ({
  onNavigate,
  onOpenDocModal,
  currentUser,
}) => {
  const [derogationMotive, setDerogationMotive] = useState<string>(
    'Validation autorisée au titre de la tolérance budgétaire de 10% compte tenu du profil critique DevSecOps.'
  );
  const [actionStatus, setActionStatus] = useState<'idle' | 'validating' | 'approved' | 'rejected' | 'modified'>('idle');
  const [requisitionId, setRequisitionId] = useState('req-0042');

  useEffect(() => {
    apiGet<Requisition[]>('/requisitions?status=en_cours_finance').then((items) => {
      if (items.length) setRequisitionId(items[0].id);
    }).catch(() => undefined);
  }, []);

  const canValidate = currentUser.roleType === 'Finance' || currentUser.roleType === 'Direction';

  const handleValidateFunds = async () => {
    if (!canValidate) {
      alert(`Action réservée au Contrôle de Gestion (Gilles Vaudon) ou à la Direction. Votre rôle est : ${currentUser.roleType}`);
      return;
    }
    setActionStatus('validating');
    try {
      await apiPost(`/requisitions/${requisitionId}/finance-validation`, {
        approved: true,
        derogationMotive,
        comments: derogationMotive || 'Budget validé par la Finance.',
      });
      setActionStatus('approved');
      setTimeout(() => {
        onNavigate('approbation-direction');
      }, 400);
    } catch (error) {
      setActionStatus('idle');
      window.alert(error instanceof Error ? error.message : 'Validation Finance impossible.');
    }
  };

  const handleReject = async () => {
    if (!canValidate) {
      alert(`Action réservée au Contrôle de Gestion. Votre rôle est : ${currentUser.roleType}`);
      return;
    }
    const comments = window.prompt('Motif du retour au manager pour correction :');
    if (!comments) return;
    try {
      await apiPost(`/requisitions/${requisitionId}/finance-validation`, { approved: false, comments });
      setActionStatus('rejected');
      onNavigate('mes-demandes');
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Retour Finance impossible.'); }
  };

  const handleRequestModif = async () => {
    if (!canValidate) {
      alert(`Action réservée au Contrôle de Gestion. Votre rôle est : ${currentUser.roleType}`);
      return;
    }
    const feedback = window.prompt('Indiquez les ajustements demandés au Manager :', 'Merci de revoir le plafond à 3 400 € pour respecter le barème DSI standard.');
    if (feedback) {
      try {
        await apiPost(`/requisitions/${requisitionId}/finance-validation`, { approved: false, comments: feedback });
        setActionStatus('modified');
        onNavigate('mes-demandes');
      } catch (error) { window.alert(error instanceof Error ? error.message : 'Retour au manager impossible.'); }
    }
  };

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="w-full max-w-7xl mx-auto px-margin py-space-lg flex flex-col gap-space-lg">
        {/* Role Access Restriction Banner if non-finance */}
        {!canValidate && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-warning-text text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-warning-amber">policy</span>
              <span>
                <strong>Mode consultation seule ({currentUser.name} - {currentUser.roleType}) :</strong> Seul le Contrôle de Gestion (Gilles Vaudon) peut valider la dérogation et réserver les fonds.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-200/80 font-bold text-[10px] uppercase">
              Lecture Seule
            </span>
          </div>
        )}

        {/* Top Action & Meta Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs text-text-secondary font-caption-medium text-caption-medium">
              <button onClick={() => onNavigate('mes-demandes')} className="hover:text-text-primary cursor-pointer transition-colors">
                Demandes à évaluer
              </button>
              <span className="material-symbols-outlined text-[14px] text-text-muted">chevron_right</span>
              <span className="text-text-primary font-body-semibold">REQ-2026-0042</span>
            </div>
            <div className="flex items-center flex-wrap gap-space-md">
              <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                Demande REQ-2026-0042 — Évaluation Financière et Budgétaire
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-subtle text-primary-container font-caption-medium text-caption-medium">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                Validée RH · En attente Finance
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-space-sm self-start md:self-auto">
            <button
              type="button"
              disabled={!canValidate}
              onClick={handleReject}
              title={!canValidate ? "Réservé au Contrôle de Gestion (Gilles Vaudon)" : "Refuser la demande"}
              className={`h-9 px-space-md rounded-lg font-body-medium text-body-medium text-danger-red transition-colors flex items-center gap-1.5 ${
                !canValidate ? 'opacity-40 cursor-not-allowed bg-slate-100' : 'hover:bg-error-container hover:text-on-error-container cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {!canValidate ? 'lock' : 'block'}
              </span>
              <span>Refuser la demande</span>
            </button>

            <button
              type="button"
              disabled={!canValidate}
              onClick={handleRequestModif}
              title={!canValidate ? "Réservé au Contrôle de Gestion (Gilles Vaudon)" : "Demander une modification"}
              className={`h-9 px-space-md rounded-lg font-body-medium text-body-medium text-warning-text bg-warning-amber/15 transition-colors flex items-center gap-1.5 ${
                !canValidate ? 'opacity-40 cursor-not-allowed' : 'hover:bg-warning-amber/25 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {!canValidate ? 'lock' : 'edit_note'}
              </span>
              <span>Demander une modification</span>
            </button>

            <button
              type="button"
              disabled={!canValidate || actionStatus === 'validating' || actionStatus === 'approved'}
              onClick={handleValidateFunds}
              title={!canValidate ? "Réservé au Contrôle de Gestion (Gilles Vaudon)" : "Valider le budget"}
              className={`h-9 px-space-md rounded-lg font-body-medium text-body-medium text-white shadow-sm transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 ${
                !canValidate
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-primary-container hover:bg-primary-hover cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {!canValidate ? 'lock' : actionStatus === 'validating' ? 'sync' : actionStatus === 'approved' ? 'check' : 'lock_clock'}
              </span>
              <span>
                {actionStatus === 'validating'
                  ? 'Réservation des fonds...'
                  : actionStatus === 'approved'
                  ? 'Fonds réservés avec succès'
                  : 'Valider le budget et réserver les fonds'}
              </span>
            </button>
          </div>
        </div>

        {/* Workflow Stepper Container */}
        <div className="w-full bg-surface-card rounded-xl p-space-md shadow-sm border border-border-default">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md relative">
            {/* Step 1: Manager (Completed) */}
            <div 
              onClick={() => onNavigate('nouvelle-demande')}
              className="flex items-start gap-space-sm relative cursor-pointer hover:bg-slate-50 p-1 rounded"
            >
              <div className="w-7 h-7 rounded-full bg-success-emerald text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-caption-medium text-caption-medium text-text-secondary">Étape 1 · Manager</span>
                <span className="font-body-semibold text-body-semibold text-text-primary truncate">Marc Lefebvre</span>
                <span className="font-caption text-caption text-text-muted">Soumis le 14/10/2026</span>
              </div>
            </div>

            {/* Step 2: RH (Completed) */}
            <div 
              onClick={() => onNavigate('qualification-rh')}
              className="flex items-start gap-space-sm relative cursor-pointer hover:bg-slate-50 p-1 rounded"
            >
              <div className="w-7 h-7 rounded-full bg-success-emerald text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-caption-medium text-caption-medium text-text-secondary">Étape 2 · Ressources Humaines</span>
                <span className="font-body-semibold text-body-semibold text-text-primary truncate">Claire Delorme</span>
                <span className="font-caption text-caption text-text-muted">Conforme fiche G5 le 16/10/2026</span>
              </div>
            </div>

            {/* Step 3: Finance (Active Pulsing) */}
            <div className="flex items-start gap-space-sm relative bg-primary-subtle/50 p-1.5 rounded-lg">
              <div className="relative flex items-center justify-center shrink-0 w-7 h-7">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-25"></span>
                <div className="w-7 h-7 rounded-full bg-primary-container text-white font-caption-medium text-caption-medium flex items-center justify-center shadow-sm">
                  3
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-caption-medium text-caption-medium text-primary-container font-semibold">
                    Étape 3 · Finance (En cours)
                  </span>
                  <span className="inline-flex px-1.5 py-0.2 rounded font-caption text-[11px] bg-warning-amber/15 text-warning-text font-medium">
                    SLA J-1
                  </span>
                </div>
                <span className="font-body-semibold text-body-semibold text-text-primary truncate">Analyste Finance</span>
                <span className="font-caption text-caption text-text-secondary">Évaluation d'arbitrage requise</span>
              </div>
            </div>

            {/* Step 4: Direction (Pending) */}
            <div 
              onClick={() => onNavigate('approbation-direction')}
              className="flex items-start gap-space-sm relative opacity-70 cursor-pointer hover:opacity-100 p-1 rounded"
            >
              <div className="w-7 h-7 rounded-full bg-bg-canvas text-text-muted font-caption-medium text-caption-medium flex items-center justify-center shrink-0 border border-border-default">
                4
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-caption-medium text-caption-medium text-text-muted">Étape 4 · Direction Générale</span>
                <span className="font-body-semibold text-body-semibold text-text-muted truncate">Approbation finale</span>
                <span className="font-caption text-caption text-text-muted">En attente des arbitrages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Workspace Split-Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* LEFT PANEL: 40% Desktop Split (5 of 12 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            {/* Summary Card */}
            <div className="bg-surface-card rounded-xl p-space-lg shadow-sm border border-border-default flex flex-col gap-space-lg">
              <div className="flex items-center justify-between pb-space-sm border-b border-border-default">
                <h2 className="font-headline-sm text-headline-sm text-text-primary">Synthèse de la demande</h2>
                <span className="font-caption text-caption text-text-muted font-mono font-medium">REQ-2026-0042</span>
              </div>

              {/* Position Details */}
              <div className="flex flex-col gap-space-sm bg-bg-canvas p-space-md rounded-lg border border-border-default/60">
                <div className="flex flex-col">
                  <span className="font-caption text-caption text-text-muted">Intitulé du poste</span>
                  <span className="font-body-semibold text-body-semibold text-text-primary">Ingénieur DevSecOps Senior</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-caption text-caption text-text-muted">Département & Imputation</span>
                  <span className="font-body-default text-body-default text-text-primary">
                    Direction des Systèmes d'Information (DSI) · Code 4100
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-caption text-caption text-text-muted">Motif de la réquisition</span>
                  <span className="font-body-default text-body-default text-text-primary">
                    Création de poste stratégique (Renfort Cloud)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <div className="flex flex-col">
                    <span className="font-caption text-caption text-text-muted">Date cible début</span>
                    <span className="font-body-semibold text-body-semibold text-text-primary">01/12/2026</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-caption text-caption text-text-muted">Demandeur</span>
                    <span className="font-body-semibold text-body-semibold text-text-primary">Marc Lefebvre</span>
                  </div>
                </div>
              </div>

              {/* Qualification RH Check & Review */}
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-secondary">
                    Validation RH Préalable
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-success-dark font-caption-medium text-caption-medium">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Qualifié & conforme RH
                  </span>
                </div>
                <div className="flex flex-col gap-space-xs p-space-sm bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-success-emerald text-[18px]">check_circle</span>
                    <span className="font-body-default text-body-default text-text-primary">
                      Fiche de poste conforme au référentiel G5
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-success-emerald text-[18px]">check_circle</span>
                    <span className="font-body-default text-body-default text-text-primary">
                      Grade salarial G5 validé par Claire Delorme
                    </span>
                  </div>
                  <div className="mt-space-xs p-space-sm bg-surface-card rounded text-text-secondary font-caption text-caption italic border border-border-default/50">
                    « Compétences rares sur le marché, tension de recrutement forte justifiant le haut de fourchette. »
                  </div>
                </div>
              </div>

              {/* Documents Attachment Box */}
              <div className="flex flex-col gap-space-xs">
                <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-secondary">
                  Pièce jointe contractuelle
                </span>
                <div 
                  onClick={onOpenDocModal}
                  className="flex items-center justify-between p-space-sm bg-bg-canvas rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group border border-border-default/60"
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-8 h-8 rounded bg-red-100 text-danger-red flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-semibold text-body-semibold text-text-primary truncate group-hover:text-primary-container transition-colors">
                        Fiche_Poste_DevSecOps_G5.pdf
                      </span>
                      <span className="font-caption text-caption text-text-muted">245 Ko · Document signé RH</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-primary-container font-caption-medium text-caption-medium shrink-0 ml-space-sm">
                    <span>Consulter</span>
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                  </div>
                </div>
              </div>

              {/* Quick HR Context Specs */}
              <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center gap-space-sm text-text-secondary font-caption text-caption border border-border-default/50">
                <span className="material-symbols-outlined text-primary-container text-[20px]">policy</span>
                <span>Contrat CDI cadre temps plein · Forfait jour 218 j · Coefficient convention collective Syntec 3.1</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: 60% Desktop Split (7 of 12 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Main Decision Banner (Amber Derogation Required) */}
            <div className="bg-amber-50/90 rounded-xl p-space-md shadow-sm border border-amber-200 flex flex-col sm:flex-row gap-space-md items-start">
              <div className="w-10 h-10 rounded-full bg-warning-amber text-warning-text flex items-center justify-center shrink-0 shadow-sm font-bold">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-sm flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-warning-text font-semibold">
                    RÉSULTAT : À MODIFIER (Dépassement de grille départementale)
                  </span>
                </div>
                <p className="font-body-default text-body-default text-text-secondary leading-relaxed">
                  La demande excède la grille du département (<strong className="text-text-primary font-body-semibold">+200 €/m</strong>) et génère un dépassement de <strong className="text-danger-red font-body-semibold">480,00 €</strong> sur le budget disponible (tolérance admise : 10%). Vous pouvez valider avec dérogation formelle ou demander un ajustement.
                </p>
              </div>
            </div>

            {/* Widget: Salary & Multi-Criteria Floating Bar */}
            <div className="bg-surface-card rounded-xl p-space-lg shadow-sm border border-border-default flex flex-col gap-space-lg">
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex flex-col">
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">
                    Comparaison Salariale & Budgétaire Multicritères
                  </h3>
                  <span className="font-caption text-caption text-text-secondary">
                    Positionnement du brut mensuel demandé face aux référentiels en vigueur
                  </span>
                </div>
                <span className="material-symbols-outlined text-text-muted text-[20px]">tune</span>
              </div>

              {/* Multi-Bar Floating Track Visualization (2 000 € to 4 000 € scale) */}
              <div className="flex flex-col gap-space-md pt-space-xs pb-space-sm">
                {/* Grid X-Axis Legend */}
                <div className="w-full flex justify-between font-caption text-caption text-text-muted px-1 border-b border-border-default/50 pb-1 tabular-nums">
                  <span>2 000 €</span>
                  <span>2 500 €</span>
                  <span>3 000 €</span>
                  <span>3 500 €</span>
                  <span>4 000 €</span>
                </div>

                {/* Track 1: Grille du Poste Grade G5 [2500 - 3500] => 25% to 75% width */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between font-caption-medium text-caption-medium">
                    <span className="text-text-secondary">1. Grille du poste (Grade G5)</span>
                    <span className="text-text-primary tabular-nums">2 500,00 € — 3 500,00 €</span>
                  </div>
                  <div className="relative w-full h-7 bg-bg-canvas rounded-lg overflow-hidden flex items-center border border-border-default/40">
                    <div
                      className="absolute h-4 rounded bg-slate-400/80 shadow-xs flex items-center justify-between px-2 text-white font-caption text-[11px]"
                      style={{ left: '25%', width: '50%' }}
                    >
                      <span>Min</span>
                      <span>Max</span>
                    </div>
                  </div>
                </div>

                {/* Track 2: Grille Département DSI [2600 - 3400] => 30% to 70% width */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between font-caption-medium text-caption-medium">
                    <span className="text-text-secondary">2. Grille département DSI</span>
                    <span className="text-text-primary tabular-nums">2 600,00 € — 3 400,00 €</span>
                  </div>
                  <div className="relative w-full h-7 bg-bg-canvas rounded-lg overflow-hidden flex items-center border border-border-default/40">
                    <div
                      className="absolute h-4 rounded bg-indigo-300 shadow-xs flex items-center justify-between px-2 text-text-primary font-caption text-[11px]"
                      style={{ left: '30%', width: '40%' }}
                    >
                      <span>Seuil min</span>
                      <span>Seuil max</span>
                    </div>
                  </div>
                </div>

                {/* Track 3: Demande Manager [3000 - 3600] => 50% to 80% width with hatched red section from 70% to 80% */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between font-caption-medium text-caption-medium">
                    <span className="text-text-primary font-body-semibold">3. Demande Manager (Soumis)</span>
                    <div className="flex items-center gap-space-xs">
                      <span className="text-text-primary font-body-semibold tabular-nums">3 000,00 € — 3 600,00 €</span>
                      <span className="px-1.5 py-0.5 rounded bg-red-100 text-danger-red font-caption-medium text-[11px] tabular-nums font-semibold">
                        +200 € / mois
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full h-8 bg-bg-canvas rounded-lg overflow-hidden flex items-center border border-border-default/50 shadow-inner">
                    {/* In-range portion: 3000 to 3400 (50% to 70%) */}
                    <div
                      className="absolute h-5 rounded-l bg-primary-container flex items-center px-2 text-white font-caption text-[11px]"
                      style={{ left: '50%', width: '20%' }}
                    >
                      <span>3 000 €</span>
                    </div>
                    {/* Overlap excess portion: 3400 to 3600 (70% to 80%) with red stripe styling */}
                    <div
                      className="absolute h-5 rounded-r bg-danger-red flex items-center justify-end px-2 text-white font-caption text-[11px] font-semibold"
                      style={{
                        left: '70%',
                        width: '10%',
                        backgroundImage:
                          'repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 4px, transparent 0, transparent 8px)',
                      }}
                    >
                      <span>3 600 €</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Financial Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
                {/* Card 1: DSI Budget Status */}
                <div className="p-space-md rounded-xl bg-bg-canvas flex flex-col justify-between gap-space-sm border border-border-default">
                  <div className="flex flex-col">
                    <span className="font-caption-medium text-caption-medium text-text-secondary uppercase tracking-wider">
                      Budget Département DSI (Année 2026)
                    </span>
                    <span className="font-headline-sm text-headline-sm text-text-primary tabular-nums mt-0.5">
                      120 000,00 €
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-caption font-caption text-text-secondary">
                    <div className="flex justify-between">
                      <span>Déjà engagé :</span>
                      <span className="text-text-primary font-medium tabular-nums">60 000,00 €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Budget disponible avant réservation :</span>
                      <span className="text-text-primary font-medium tabular-nums">60 000,00 €</span>
                    </div>
                  </div>
                  {/* Stacked visual progress bar */}
                  <div className="w-full flex flex-col gap-1 pt-1">
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-slate-400" style={{ width: '50%' }} title="Engagé: 50%"></div>
                      <div className="h-full bg-danger-red" style={{ width: '0.4%' }} title="Dépassement projeté"></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-caption text-text-muted">
                      <span>50% engagé</span>
                      <span className="text-danger-red font-medium">50,4% projeté (+480 €)</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Cost Calculation Formula & Excess */}
                <div className="p-space-md rounded-xl bg-bg-canvas flex flex-col justify-between gap-space-sm border border-border-default">
                  <div className="flex flex-col">
                    <span className="font-caption-medium text-caption-medium text-text-secondary uppercase tracking-wider">
                      Formule & Coût Annuel Estimé
                    </span>
                    <div className="flex items-baseline gap-space-xs mt-0.5">
                      <span className="font-headline-sm text-headline-sm text-text-primary tabular-nums">60 480,00 €</span>
                      <span className="px-1.5 py-0.5 rounded font-caption-medium text-[11px] bg-red-100 text-danger-red tabular-nums font-semibold">
                        − 480,00 €
                      </span>
                    </div>
                  </div>
                  <div className="p-space-xs bg-surface-card rounded text-caption font-mono text-text-primary border border-border-default/60">
                    3 600,00 € × 12 mois × 1,40 = 60 480,00 €
                  </div>
                  <div className="flex flex-col gap-0.5 text-caption font-caption text-text-muted">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      <span>Charges patronales 40% incluses</span>
                    </div>
                    <div>Tolérance dépassement : 10% (max 6 000,00 €) · 12 mois</div>
                  </div>
                </div>
              </div>

              {/* Automated Compliance Checks (Checklist) */}
              <div className="flex flex-col gap-space-xs pt-space-xs">
                <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-secondary">
                  Contrôles Automatiques du Moteur de Règles
                </span>
                <div className="flex flex-col gap-space-xs bg-bg-canvas p-space-sm rounded-lg border border-border-default/60">
                  {/* Item 1 */}
                  <div className="flex items-start gap-space-sm p-1.5 rounded hover:bg-surface-card transition-colors">
                    <span className="material-symbols-outlined text-success-emerald text-[20px] shrink-0">check_circle</span>
                    <div className="flex flex-col">
                      <span className="font-body-semibold text-body-semibold text-text-primary">
                        Contrôle A - Demande dans la grille du poste
                      </span>
                      <span className="font-caption text-caption text-text-secondary">
                        Fourchette demandée jusqu'à 3 600,00 €, acceptable au vu du grade G5 étendu (3 500 € + marge).
                      </span>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start gap-space-sm p-1.5 rounded hover:bg-surface-card transition-colors">
                    <span className="material-symbols-outlined text-warning-amber text-[20px] shrink-0">warning</span>
                    <div className="flex flex-col">
                      <span className="font-body-semibold text-body-semibold text-warning-text">
                        Contrôle B - Demande dans la grille du département
                      </span>
                      <span className="font-caption text-caption text-text-secondary">
                        Dépassement de 200,00 € / mois par rapport au plafond départemental DSI (3 400,00 €).
                      </span>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start gap-space-sm p-1.5 rounded hover:bg-surface-card transition-colors">
                    <span className="material-symbols-outlined text-info-sky text-[20px] shrink-0">info</span>
                    <div className="flex flex-col">
                      <span className="font-body-semibold text-body-semibold text-text-primary">
                        Contrôle C - Coût annuel dans le budget disponible
                      </span>
                      <span className="font-caption text-caption text-text-secondary">
                        Dépassement net de 480,00 € sur le reliquat disponible, intégralement couvert par la clause de tolérance de 10% (6 000,00 € maxi).
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formal Derogation Text Area */}
              <div className="flex flex-col gap-space-xs pt-space-xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-default text-label-default text-text-primary font-medium" htmlFor="derogation-motive">
                    Motif de la dérogation budgétaire <span className="text-danger-red">*</span>
                  </label>
                  <span className="font-caption text-caption text-text-muted">Requis pour validation avec arbitrage</span>
                </div>
                <textarea
                  id="derogation-motive"
                  rows={2}
                  value={derogationMotive}
                  onChange={(e) => setDerogationMotive(e.target.value)}
                  className="w-full p-space-sm bg-surface-card rounded-lg font-body-default text-body-default text-text-primary border border-border-default focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 transition-all shadow-inner"
                />
                <span className="font-caption text-caption text-text-muted italic">
                  Ce motif sera consigné dans l'historique d'audit immuable et transmis à la Direction Générale.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
