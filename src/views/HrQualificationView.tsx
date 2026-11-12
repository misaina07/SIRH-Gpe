import React, { useEffect, useState } from 'react';
import { Requisition, UserProfile, ViewMode } from '../types/sirh';
import { apiGet, apiPost } from '../services/api';

interface HrQualificationViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenDocModal: () => void;
  currentUser?: UserProfile;
}

export const HrQualificationView: React.FC<HrQualificationViewProps> = ({
  onNavigate,
  onOpenDocModal,
  currentUser,
}) => {
  const [ficheConforme, setFicheConforme] = useState<boolean>(true);
  const [gradeConfirme, setGradeConfirme] = useState<boolean>(true);
  const [coherenceFourchette, setCoherenceFourchette] = useState<boolean>(true);
  const [comment, setComment] = useState<string>(
    'Besoin hautement prioritaire pour la conformité DSI. Le profil DevSecOps étant rare et en forte tension marché, je valide la fiche de poste et confirme le rattachement au Grade G5. Transmission à la Finance pour arbitrage budgétaire.'
  );
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [requisitionId, setRequisitionId] = useState('req-0048');

  useEffect(() => {
    apiGet<Requisition[]>('/requisitions?status=en_cours_rh').then((items) => {
      if (items.length) setRequisitionId(items[0].id);
    }).catch(() => undefined);
  }, []);

  const canValidate = currentUser ? (currentUser.canValidateRH ?? (currentUser.roleType === 'RH')) : true;
  const isRequester = currentUser?.name === 'Marc Lefebvre' || currentUser?.roleType === 'Manager';

  const handleValidateAndSubmit = async () => {
    if (!canValidate) {
      alert(`Action réservée au pôle RH (Claire Delorme). Votre profil (${currentUser?.name || 'Inconnu'}) est en consultation seule.`);
      return;
    }
    setIsValidating(true);
    try {
      await apiPost(`/requisitions/${requisitionId}/rh-validation`, {
        approved: true,
        checkFiche: ficheConforme,
        checkGrade: gradeConfirme,
        checkCoherence: coherenceFourchette,
        observations: comment,
      });
      onNavigate('validation-finance');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Validation RH impossible.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleReturnToManager = async () => {
    if (!canValidate) {
      alert(`Action réservée au pôle RH. Votre profil est en consultation seule.`);
      return;
    }
    const reason = window.prompt('Motif du renvoi au manager pour correction :', 'Préciser les astreintes et les prérequis de certification CKA.');
    if (!reason) return;
    try {
      await apiPost(`/requisitions/${requisitionId}/rh-validation`, {
        approved: false, checkFiche: ficheConforme, checkGrade: gradeConfirme,
        checkCoherence: coherenceFourchette, observations: reason,
      });
      onNavigate('mes-demandes');
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Renvoi au manager impossible.'); }
  };

  const handleReject = async () => {
    if (!canValidate) {
      alert(`Action réservée au pôle RH. Votre profil est en consultation seule.`);
      return;
    }
    const reason = window.prompt('Motif du retour au manager pour correction :');
    if (!reason) return;
    try {
      await apiPost(`/requisitions/${requisitionId}/rh-validation`, {
        approved: false, checkFiche: ficheConforme, checkGrade: gradeConfirme,
        checkCoherence: coherenceFourchette, observations: reason,
      });
      onNavigate('mes-demandes');
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Retour au manager impossible.'); }
  };

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="max-w-[1280px] w-full mx-auto px-margin py-space-lg flex flex-col gap-space-lg">
        {/* Header Section with Breadcrumb Context, ID & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted">
                Processus Recrutement #REQ-2026-0042
              </span>
              <span className="inline-flex items-center px-space-xs py-0.5 rounded-full bg-surface-container-high font-caption-medium text-[11px] text-text-secondary">
                DSI · Infra Cloud
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-space-md">
              <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                Ingénieur DevSecOps Senior
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 font-caption-medium text-caption-medium">
                <span className="w-2 h-2 rounded-full bg-info-sky"></span>
                En attente RH
              </span>
            </div>
          </div>

          {/* Metadata Quick Pill */}
          <div className="flex items-center gap-space-md bg-surface-card p-space-sm rounded-xl shadow-sm border border-border-default">
            <div className="flex flex-col text-right">
              <span className="font-caption text-caption text-text-muted">Délai restant SLA</span>
              <span className="font-body-semibold text-body-semibold text-text-primary">18h restantes</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[20px]">timer</span>
            </div>
          </div>
        </div>

        {/* Role Separation / Impartiality Notice for non-RH users */}
        {!canValidate && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">policy</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900">
                {isRequester
                  ? "Contrôle d'impartialité & Séparation des pouvoirs (Norme CSE)"
                  : "Accès en consultation seule (Étape réservée au pôle RH)"}
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {isRequester
                  ? "En tant que demandeur de ce besoin (Marc Lefebvre - DSI), les règles de gouvernance interne vous interdisent de qualifier votre propre réquisition de poste. Seul le service RH (Claire Delorme) peut instruire cette étape."
                  : `Votre profil actif (${currentUser?.name || 'Utilisateur'} - ${currentUser?.role || ''}) ne dispose pas de la délégation de signature RH requise pour qualifier ce dossier. Vous consultez les données en lecture seule.`}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-amber-200/80 text-amber-900 text-[11px] font-bold uppercase tracking-wider shrink-0">
              Lecture Seule
            </span>
          </div>
        )}

        {/* Stepper Workflow Bar (Horizontal Progression) */}
        <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-default">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md relative">
            {/* Step 1: Validated */}
            <div 
              onClick={() => onNavigate('nouvelle-demande')}
              className="flex items-center gap-space-sm cursor-pointer hover:bg-slate-50 p-1 rounded"
            >
              <div className="w-8 h-8 rounded-full bg-success-emerald text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-caption-medium text-caption-medium text-success-dark">Étape 1 · Manager</span>
                <span className="font-body-semibold text-body-semibold text-text-primary truncate">Marc Lefebvre</span>
                <span className="font-caption text-caption text-text-muted">Validé le 14/10/2026</span>
              </div>
            </div>

            {/* Step 2: Current Active (RH) */}
            <div className="flex items-center gap-space-sm relative bg-primary-subtle/50 p-1 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary-container/30">
                <span className="font-body-semibold text-body-semibold">2</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-caption-medium text-caption-medium text-primary-container font-semibold">
                    Étape 2 · Qualification RH
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
                </div>
                <span className="font-body-semibold text-body-semibold text-text-primary truncate">Claire Delorme</span>
                <span className="font-caption text-caption text-primary-container font-caption-medium">En cours d'examen</span>
              </div>
            </div>

            {/* Step 3: Pending (Finance) */}
            <div 
              onClick={() => onNavigate('validation-finance')}
              className="flex items-center gap-space-sm opacity-60 cursor-pointer hover:opacity-100 p-1 rounded"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-low text-text-secondary flex items-center justify-center shrink-0 border border-border-default">
                <span className="font-body-semibold text-body-semibold">3</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-caption-medium text-caption-medium text-text-muted">Étape 3 · Finance</span>
                <span className="font-body-semibold text-body-semibold text-text-primary truncate">Contrôle de Gestion</span>
                <span className="font-caption text-caption text-text-muted">En attente</span>
              </div>
            </div>

            {/* Step 4: Pending (Direction) */}
            <div 
              onClick={() => onNavigate('approbation-direction')}
              className="flex items-center gap-space-sm opacity-60 cursor-pointer hover:opacity-100 p-1 rounded"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-low text-text-secondary flex items-center justify-center shrink-0 border border-border-default">
                <span className="font-body-semibold text-body-semibold">4</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-caption-medium text-caption-medium text-text-muted">Étape 4 · Direction</span>
                <span className="font-body-semibold text-body-semibold text-text-primary truncate">Direction Générale</span>
                <span className="font-caption text-caption text-text-muted">En attente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Split Layout 60% / 40% */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* LEFT PANEL (60% -> col-span-7) */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Fiche de Synthèse Card */}
            <div className="bg-surface-card rounded-xl p-space-lg shadow-sm border border-border-default flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-border-default">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary-container text-[22px]">description</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">Fiche de synthèse de la demande</h2>
                </div>
                <span className="font-caption-medium text-caption-medium text-text-muted font-mono">Réf : DEM-2026-X89</span>
              </div>

              {/* Structured Key Metrics Table Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md bg-surface-container-low rounded-lg p-space-md border border-border-default/60">
                <div className="flex flex-col gap-1">
                  <span className="font-caption text-caption text-text-secondary uppercase">Département & Entité</span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-text-muted">apartment</span>
                    <span className="font-body-semibold text-body-semibold text-text-primary">DSI · Code 4100</span>
                  </div>
                  <span className="font-caption text-caption text-text-muted">Direction Systèmes d'Information</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-caption text-caption text-text-secondary uppercase">Motif du Recrutement</span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-text-muted">rocket_launch</span>
                    <span className="font-body-semibold text-body-semibold text-text-primary">Création stratégique</span>
                  </div>
                  <span className="font-caption text-caption text-text-muted">Renfort Cloud & SecOps</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-caption text-caption text-text-secondary uppercase">Date Cible de Prise</span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-text-muted">event_available</span>
                    <span className="font-body-semibold text-body-semibold text-text-primary">01/12/2026</span>
                  </div>
                  <span className="font-caption text-caption text-text-muted">Délai préavis pris en compte</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-caption text-caption text-text-secondary uppercase">Manager Demandeur</span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-text-muted">person</span>
                    <span className="font-body-semibold text-body-semibold text-text-primary">Marc Lefebvre</span>
                  </div>
                  <span className="font-caption text-caption text-text-muted">Engineering Manager Infra</span>
                </div>
              </div>

              {/* Remuneration Target Card with Range Bar */}
              <div className="bg-surface-container rounded-lg p-space-md flex flex-col gap-space-sm border border-border-default/60">
                <div className="flex items-center justify-between">
                  <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-secondary">
                    Fourchette salariale demandée
                  </span>
                  <span className="font-body-semibold text-body-semibold text-primary tabular-nums">
                    3 000,00 € — 3 600,00 € brut/mois
                  </span>
                </div>
                <div className="flex items-center justify-between font-caption text-caption text-text-muted">
                  <span>Équivalent brut annuel :</span>
                  <span className="font-body-medium text-body-medium text-text-primary">36 000,00 € — 43 200,00 €</span>
                </div>
                {/* Visual Range Representation */}
                <div className="relative w-full h-3 bg-slate-200 rounded-full mt-1 overflow-hidden flex">
                  <div className="w-[20%] bg-transparent"></div>
                  <div className="w-[60%] bg-primary-container rounded-full h-full relative" title="Fourchette demandée">
                    <div className="absolute inset-0 bg-white/20"></div>
                  </div>
                  <div className="w-[20%] bg-warning-amber/80 h-full" title="Tension hors-grille standard (+100 €)"></div>
                </div>
                <div className="flex justify-between font-caption text-[11px] text-text-muted">
                  <span>Grille mini : 2 500 €</span>
                  <span className="text-warning-text font-caption-medium">Plafond Grille : 3 500 €</span>
                  <span>Demande max : 3 600 €</span>
                </div>
              </div>

              {/* Manager's Narrative Justification */}
              <div className="flex flex-col gap-space-xs">
                <label className="font-caption-medium text-caption-medium text-text-secondary uppercase">
                  Justification métier du manager
                </label>
                <div className="p-space-md bg-surface-container-low rounded-lg text-text-primary font-body-default text-body-default leading-relaxed relative border border-border-default/50">
                  <span className="material-symbols-outlined text-text-muted/40 absolute top-2 right-2 text-[28px]">
                    format_quote
                  </span>
                  « Dans le cadre de l'audit de sécurité ISO 27001 et de la migration Kubernetes multi-cloud, nous devons sécuriser notre chaîne CI/CD et nos déploiements de production. Ce rôle assurera également le pont entre l'équipe SecOps groupe et nos équipes applicatives. »
                </div>
              </div>

              {/* Document Joint */}
              <div className="flex flex-col gap-space-xs">
                <span className="font-caption-medium text-caption-medium text-text-secondary uppercase">
                  Document de référence joint
                </span>
                <div className="flex items-center justify-between p-space-sm bg-surface rounded-lg shadow-sm border border-border-default">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-red-100 text-danger-red flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-body-semibold text-body-semibold text-text-primary truncate">
                          Fiche_Poste_DevSecOps_G5.pdf
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-success-dark font-caption-medium text-[11px]">
                          Référentiel certifié
                        </span>
                      </div>
                      <span className="font-caption text-caption text-text-muted">245 Ko · Horodaté le 14/10/2026 à 09:12</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenDocModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container text-body-semibold font-body-semibold transition-colors shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>Ouvrir la fiche de poste</span>
                  </button>
                </div>
              </div>

              {/* Governance & Impartiality Security Notice */}
              <div className="p-space-md rounded-lg bg-emerald-50 text-success-dark flex items-start gap-space-sm border border-emerald-200">
                <span className="material-symbols-outlined text-success-dark text-[20px] shrink-0 mt-0.5">policy</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-body-semibold text-body-semibold">
                    Contrôle d'impartialité & Séparation des pouvoirs
                  </span>
                  <p className="font-caption text-caption text-slate-700">
                    Demandeur <span className="font-body-semibold">Marc Lefebvre</span> ≠ Valideur RH{' '}
                    <span className="font-body-semibold">Claire Delorme</span>. Conforme à la politique d'audit interne et aux règles de conformité CSE.
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Snippet Preview */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-default flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-text-muted text-[20px]">cloud_upload</span>
                <div className="flex flex-col">
                  <span className="font-caption-medium text-caption-medium text-text-primary">
                    Journal des modifications de la demande
                  </span>
                  <span className="font-caption text-caption text-text-muted">
                    3 événements enregistrés par le système de traçabilité
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('approbation-direction')}
                className="text-primary hover:text-primary-hover font-caption-medium text-caption-medium cursor-pointer"
              >
                Afficher l'historique complet
              </button>
            </div>
          </div>

          {/* RIGHT PANEL (40% -> col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg sticky top-20">
            {/* Qualification Card */}
            <div className="bg-surface-card rounded-xl shadow-md border border-border-default p-space-lg flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary-container text-[22px]">checklist_rtl</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">Grille d'évaluation & RH</h2>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary-subtle text-primary font-caption-medium text-[11px] font-semibold">
                  3/3 Obligatoires
                </span>
              </div>
              <p className="font-caption text-caption text-text-secondary -mt-space-xs">
                La validation engage la responsabilité du pôle Talent Acquisition avant transmission budgétaire.
              </p>

              {/* Verification Item 1 */}
              <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-xs border border-border-default/50">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex flex-col">
                    <span className="font-body-semibold text-body-semibold text-text-primary">
                      1. Fiche de poste conforme
                    </span>
                    <span className="font-caption text-caption text-text-secondary">
                      Conformité au besoin exprimé et missions déclarées
                    </span>
                  </div>
                  {/* Segmented Toggle OUI/NON */}
                  <div className="inline-flex rounded-lg bg-surface p-1 shrink-0 shadow-inner border border-border-default">
                    <button
                      type="button"
                      onClick={() => setFicheConforme(true)}
                      className={`px-3 py-1 rounded-md font-caption-medium text-caption-medium transition-all flex items-center gap-1 cursor-pointer ${
                        ficheConforme
                          ? 'bg-success-emerald text-white shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span> Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setFicheConforme(false)}
                      className={`px-3 py-1 rounded-md font-caption-medium text-caption-medium transition-all cursor-pointer ${
                        !ficheConforme
                          ? 'bg-danger-red text-white shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Non
                    </button>
                  </div>
                </div>
                <div className="mt-space-xs bg-white/70 p-2 rounded text-text-secondary font-caption text-caption flex items-center gap-1.5 border border-border-default/40">
                  <span className="material-symbols-outlined text-success-emerald text-[16px]">info</span>
                  <span>Note : Missions et compétences en adéquation avec les prérequis techniques.</span>
                </div>
              </div>

              {/* Verification Item 2 */}
              <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-xs border border-border-default/50">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex flex-col">
                    <span className="font-body-semibold text-body-semibold text-text-primary">
                      2. Grade salarial confirmé
                    </span>
                    <span className="font-caption text-caption text-text-secondary">
                      Validation du niveau hiérarchique et coefficient
                    </span>
                  </div>
                  {/* Segmented Toggle OUI/NON */}
                  <div className="inline-flex rounded-lg bg-surface p-1 shrink-0 shadow-inner border border-border-default">
                    <button
                      type="button"
                      onClick={() => setGradeConfirme(true)}
                      className={`px-3 py-1 rounded-md font-caption-medium text-caption-medium transition-all flex items-center gap-1 cursor-pointer ${
                        gradeConfirme
                          ? 'bg-success-emerald text-white shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span> Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setGradeConfirme(false)}
                      className={`px-3 py-1 rounded-md font-caption-medium text-caption-medium transition-all cursor-pointer ${
                        !gradeConfirme
                          ? 'bg-danger-red text-white shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Non
                    </button>
                  </div>
                </div>
                <div className="mt-space-xs flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-primary-subtle text-primary font-caption-medium text-caption-medium font-semibold">
                    Grade G5 — 2 500,00 € à 3 500,00 €
                  </span>
                </div>
              </div>

              {/* Verification Item 3 */}
              <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-xs border border-border-default/50">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex flex-col">
                    <span className="font-body-semibold text-body-semibold text-text-primary">
                      3. Cohérence fourchette / grade
                    </span>
                    <span className="font-caption text-caption text-text-secondary">
                      Alignement avec les barèmes Groupe
                    </span>
                  </div>
                  {/* Segmented Toggle OUI/NON */}
                  <div className="inline-flex rounded-lg bg-surface p-1 shrink-0 shadow-inner border border-border-default">
                    <button
                      type="button"
                      onClick={() => setCoherenceFourchette(true)}
                      className={`px-3 py-1 rounded-md font-caption-medium text-caption-medium transition-all flex items-center gap-1 cursor-pointer ${
                        coherenceFourchette
                          ? 'bg-success-emerald text-white shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span> Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoherenceFourchette(false)}
                      className={`px-3 py-1 rounded-md font-caption-medium text-caption-medium transition-all cursor-pointer ${
                        !coherenceFourchette
                          ? 'bg-danger-red text-white shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Non
                    </button>
                  </div>
                </div>
                {/* Amber Indicative Warning */}
                <div className="mt-space-xs p-2.5 rounded-lg bg-amber-50 text-warning-text flex items-start gap-2 text-caption font-caption border border-amber-200">
                  <span className="material-symbols-outlined text-warning-amber text-[18px] shrink-0">warning</span>
                  <p className="leading-tight">
                    <strong className="font-body-semibold">Attention :</strong> Le plafond demandé (3 600,00 €) dépasse de 100,00 € la grille standard du grade G5. Tolérance de tension marché applicable.
                  </p>
                </div>
              </div>

              {/* Mandatory Observations / Comments */}
              <div className="flex flex-col gap-space-xs">
                <label className="font-body-semibold text-body-semibold text-text-primary flex items-center justify-between">
                  <span>Commentaire et observations RH <span className="text-danger-red">*</span></span>
                  <span className="font-caption text-caption text-text-muted font-normal">Obligatoire pour transmission</span>
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-space-md bg-surface-container rounded-lg font-body-default text-body-default text-text-primary border border-border-default focus:outline-none focus:ring-2 focus:ring-primary-container resize-none leading-relaxed transition-all shadow-inner"
                />
              </div>

              {/* Primary Actions Area */}
              <div className="flex flex-col gap-space-sm pt-space-xs">
                <button
                  type="button"
                  disabled={!canValidate || isValidating}
                  onClick={handleValidateAndSubmit}
                  className={`w-full h-11 px-space-md rounded-lg font-body-semibold text-body-semibold shadow-md flex items-center justify-center gap-space-sm transition-all ${
                    canValidate
                      ? 'bg-primary-container text-white hover:bg-primary-hover hover:shadow-lg cursor-pointer'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none border border-slate-300'
                  }`}
                  title={!canValidate ? "Action réservée au pôle RH (Claire Delorme)" : undefined}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {!canValidate ? 'lock' : isValidating ? 'sync' : 'send'}
                  </span>
                  <span>
                    {!canValidate
                      ? 'Validation réservée à Claire Delorme (RH)'
                      : isValidating
                        ? 'Transmission en cours...'
                        : 'Valider et transmettre à la Finance'}
                  </span>
                </button>
                <div className="grid grid-cols-2 gap-space-sm">
                  <button
                    type="button"
                    disabled={!canValidate}
                    onClick={handleReturnToManager}
                    className={`h-9 px-space-sm rounded-lg font-body-medium text-body-medium transition-colors flex items-center justify-center gap-1.5 text-center ${
                      canValidate
                        ? 'bg-surface-card hover:bg-surface-container-high text-text-primary shadow-sm border border-border-default cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-text-muted">undo</span>
                    <span>Renvoyer au manager</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canValidate}
                    onClick={handleReject}
                    className={`h-9 px-space-sm rounded-lg font-body-medium text-body-medium transition-colors flex items-center justify-center gap-1.5 text-center ${
                      canValidate
                        ? 'bg-red-50 hover:bg-red-100 text-danger-red cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Rejeter la demande</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Compliance & Regulatory Footer Card */}
            <div className="p-space-md rounded-xl bg-surface-container-high flex items-center gap-space-md border border-border-default/60">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-container shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <div className="flex flex-col">
                <span className="font-caption-medium text-caption-medium text-text-primary">Conformité RGPD & CSE</span>
                <span className="font-caption text-caption text-text-secondary">
                  Processus audité n° CNIL-SIRH-2026-B. Aucune donnée sensible collectée sans base légale.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
