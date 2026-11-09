import React, { useState } from 'react';
import { UserProfile, ViewMode } from '../types/sirh';

interface ExecutiveApprovalViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenDocModal: () => void;
  currentUser: UserProfile;
}

export const ExecutiveApprovalView: React.FC<ExecutiveApprovalViewProps> = ({
  onNavigate,
  onOpenDocModal,
  currentUser,
}) => {
  const [approvalStatus, setApprovalStatus] = useState<'idle' | 'approving' | 'approved' | 'rejected'>('idle');

  const isDirection = currentUser.roleType === 'Direction';

  const handleApprove = () => {
    if (!isDirection) {
      alert(`Action réservée à la Direction Générale. Votre rôle actuel est : ${currentUser.roleType}`);
      return;
    }
    setApprovalStatus('approving');
    setTimeout(() => {
      setApprovalStatus('approved');
      setTimeout(() => {
        onNavigate('recrutement');
      }, 1400);
    }, 1000);
  };

  const handleReject = () => {
    if (!isDirection) {
      alert(`Action réservée à la Direction Générale. Votre rôle actuel est : ${currentUser.roleType}`);
      return;
    }
    const confirmed = window.confirm(
      'Confirmez-vous le rejet de cette demande ?\nLes fonds réservés de 60 480 € seront automatiquement restitués au budget DSI non-alloué.'
    );
    if (confirmed) {
      setApprovalStatus('rejected');
    }
  };

  return (
    <div className="flex flex-col w-full pb-28">
      <div className="w-full max-w-7xl mx-auto px-margin py-space-lg flex flex-col gap-space-lg">
        {/* Role Access Restriction Banner if non-Direction */}
        {!isDirection && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-warning-text text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-warning-amber">gavel</span>
              <span>
                <strong>Mode consultation seule ({currentUser.name} - {currentUser.roleType}) :</strong> Seule la Direction Générale (CODIR) est habilitée à signer l'approbation finale d'ouverture du poste.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-200/80 font-bold text-[10px] uppercase">
              Signature Restreinte
            </span>
          </div>
        )}

        {/* Page Header Title & Metadata */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted">
                Réf. REQ-2026-0042
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary-subtle text-primary font-caption-medium text-caption-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                Validée Finance · En attente Direction
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-text-secondary font-caption-medium text-caption-medium">
                <span className="material-symbols-outlined text-[14px]">security</span>
                Poste Clé / NIS2
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
              Approbation finale Direction Générale
            </h1>
            <p className="font-body-default text-body-default text-text-secondary">
              Demande d'ouverture de recrutement : <span className="font-body-semibold text-text-primary">Ingénieur DevSecOps Senior (DSI)</span> · Contrat CDI Temps Plein
            </p>
          </div>

          {/* Quick Action Reference & Avatar stack */}
          <div className="flex items-center gap-space-md bg-bg-canvas px-space-md py-space-sm rounded-lg self-start lg:self-center border border-border-default">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold ring-2 ring-white" title="Marc Lefebvre (Manager)">
                ML
              </div>
              <div className="inline-block h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold ring-2 ring-white" title="Claire Delorme (RH)">
                CD
              </div>
              <div className="inline-block h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-semibold ring-2 ring-white" title="Gilles Vaudon (Finance)">
                GV
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-caption-medium text-caption-medium text-text-primary font-semibold">3 visas recueillis</span>
              <span className="font-caption text-caption text-success-dark flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[13px]">check_circle</span> Conforme aux statuts
              </span>
            </div>
          </div>
        </div>

        {/* Workflow Stepper (Step 4 Active) */}
        <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
            {/* Step 1 */}
            <div 
              onClick={() => onNavigate('nouvelle-demande')}
              className="flex items-center gap-space-sm w-full md:w-auto cursor-pointer hover:bg-slate-50 p-1 rounded"
            >
              <div className="w-8 h-8 rounded-full bg-success-emerald text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex flex-col">
                <span className="font-caption-medium text-caption-medium text-text-muted">Étape 1 · Manager</span>
                <span className="font-body-semibold text-body-semibold text-text-primary">Marc Lefebvre</span>
                <span className="font-caption text-caption text-text-secondary">Validé le 14/10/2026</span>
              </div>
            </div>
            <div className="hidden md:block flex-1 h-0.5 bg-success-emerald mx-space-sm"></div>

            {/* Step 2 */}
            <div 
              onClick={() => onNavigate('qualification-rh')}
              className="flex items-center gap-space-sm w-full md:w-auto cursor-pointer hover:bg-slate-50 p-1 rounded"
            >
              <div className="w-8 h-8 rounded-full bg-success-emerald text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex flex-col">
                <span className="font-caption-medium text-caption-medium text-text-muted">Étape 2 · Ressources Humaines</span>
                <span className="font-body-semibold text-body-semibold text-text-primary">Claire Delorme</span>
                <span className="font-caption text-caption text-text-secondary">Validé le 16/10/2026</span>
              </div>
            </div>
            <div className="hidden md:block flex-1 h-0.5 bg-success-emerald mx-space-sm"></div>

            {/* Step 3 */}
            <div 
              onClick={() => onNavigate('validation-finance')}
              className="flex items-center gap-space-sm w-full md:w-auto cursor-pointer hover:bg-slate-50 p-1 rounded"
            >
              <div className="w-8 h-8 rounded-full bg-success-emerald text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex flex-col">
                <span className="font-caption-medium text-caption-medium text-text-muted">Étape 3 · Arbitrage Finance</span>
                <span className="font-body-semibold text-body-semibold text-text-primary">Gilles Vaudon</span>
                <span className="font-caption text-caption text-warning-text font-medium">Dérogation accordée le 18/10</span>
              </div>
            </div>
            <div className="hidden md:block flex-1 h-0.5 bg-primary mx-space-sm"></div>

            {/* Step 4 (Current) */}
            <div className="flex items-center gap-space-sm w-full md:w-auto bg-primary-subtle px-space-md py-space-sm rounded-lg border border-primary-container/20">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-body-semibold text-body-semibold shadow-sm animate-pulse">
                4
              </div>
              <div className="flex flex-col">
                <span className="font-caption-medium text-caption-medium text-primary font-bold">Étape 4 · Décision Finale</span>
                <span className="font-body-semibold text-body-semibold text-text-primary">Direction Générale</span>
                <span className="font-caption text-caption text-primary">En cours d'arbitrage final</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Card 1 */}
          <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-caption-medium text-caption-medium text-text-secondary uppercase tracking-wider">
                Coût annuel total employeur
              </span>
              <span className="p-1.5 rounded-lg bg-surface-container-high text-primary">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </span>
            </div>
            <div className="mt-space-md flex flex-col gap-0.5">
              <div className="font-headline-lg text-headline-lg text-text-primary tabular-nums tracking-tight font-semibold">
                60 480,00 €
              </div>
              <span className="font-caption text-caption text-text-muted">
                Charges patronales 40% incluses · 3 600 € max/mois brut
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-caption-medium text-caption-medium text-text-secondary uppercase tracking-wider">
                Impact budgétaire DSI
              </span>
              <span className="p-1.5 rounded-lg bg-surface-container-high text-info-sky">
                <span className="material-symbols-outlined text-[20px]">pie_chart</span>
              </span>
            </div>
            <div className="mt-space-md flex flex-col gap-0.5">
              <div className="font-headline-lg text-headline-lg text-text-primary tabular-nums tracking-tight font-semibold">
                50,4 %
              </div>
              <span className="font-caption text-caption text-warning-text font-medium">
                Dépassement de 480,00 € couvert par la tolérance (10%)
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-caption-medium text-caption-medium text-text-secondary uppercase tracking-wider">
                Résultat analyse financière
              </span>
              <span className="p-1.5 rounded-lg bg-surface-container-high text-warning-amber">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </span>
            </div>
            <div className="mt-space-md flex flex-col gap-1.5">
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-warning-text font-caption-medium text-caption-medium font-semibold">
                  <span className="material-symbols-outlined text-[13px]">warning</span>
                  À MODIFIER (Dérogation accordée)
                </span>
              </div>
              <span className="font-caption text-caption text-text-secondary">
                Visa Finance accordé au vu de la rareté du profil
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-caption-medium text-caption-medium text-text-secondary uppercase tracking-wider">
                Date d'embauche souhaitée
              </span>
              <span className="p-1.5 rounded-lg bg-surface-container-high text-success-emerald">
                <span className="material-symbols-outlined text-[20px]">event_available</span>
              </span>
            </div>
            <div className="mt-space-md flex flex-col gap-0.5">
              <div className="font-headline-lg text-headline-lg text-text-primary tabular-nums tracking-tight font-semibold">
                01/12/2026
              </div>
              <span className="font-caption text-caption text-text-muted">
                Délai de recrutement projeté : 45 jours calendaires
              </span>
            </div>
          </div>
        </div>

        {/* Main Two-Column Split (60% Details & Arbitrage / 40% Audit Trail) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* LEFT COLUMN: 7 OF 12 COLS */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Compensative Benchmark & Range Comparison Widget */}
            <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-border-default">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">finance_mode</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">
                    Arbitrage salarial & Enveloppes budgétaires
                  </h2>
                </div>
                <span className="font-caption-medium text-caption-medium text-text-secondary">
                  Base Mensuelle Brute
                </span>
              </div>
              <p className="font-body-default text-body-default text-text-secondary">
                Comparaison multi-niveaux : Positionnement du profil ciblé vis-à-vis des grilles conventionnelles de l'entreprise.
              </p>

              {/* Visual Horizontal Bar Metric */}
              <div className="flex flex-col gap-space-md mt-space-sm bg-bg-canvas p-space-md rounded-lg border border-border-default/60">
                {/* Scale Reference Axis (2 000€ à 4 000€) */}
                <div className="flex justify-between font-caption text-caption text-text-muted px-1">
                  <span>2 000 €</span>
                  <span>2 500 €</span>
                  <span>3 000 €</span>
                  <span>3 500 €</span>
                  <span>4 000 €</span>
                </div>

                {/* Row 1: Grade Conventionnel G5 */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-body-medium text-text-secondary">Grade G5 (SYNTEC / Interne)</span>
                    <span className="font-body-medium tabular-nums text-text-primary">2 500 € — 3 500 €</span>
                  </div>
                  <div className="relative w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-[25%] w-[50%] bg-secondary rounded-full"></div>
                  </div>
                </div>

                {/* Row 2: Grille Département DSI */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-body-medium text-text-secondary">Grille Métier DSI 2026</span>
                    <span className="font-body-medium tabular-nums text-text-primary">2 600 € — 3 400 €</span>
                  </div>
                  <div className="relative w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-[30%] w-[40%] bg-info-sky rounded-full"></div>
                  </div>
                </div>

                {/* Row 3: Demande Retenue */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-body-semibold text-text-primary">Proposition retenue (REQ-2026-0042)</span>
                      <span className="inline-flex items-center text-[11px] font-semibold text-warning-text bg-amber-100 px-1.5 rounded">
                        +100 €/m plancher max
                      </span>
                    </div>
                    <span className="font-body-semibold tabular-nums text-primary">3 000 € — 3 600 €</span>
                  </div>
                  <div className="relative w-full h-4 bg-surface-container-high rounded-full overflow-hidden shadow-inner">
                    <div className="absolute top-0 bottom-0 left-[50%] w-[25%] bg-primary"></div>
                    <div
                      className="absolute top-0 bottom-0 left-[75%] w-[5%] bg-warning-amber"
                      title="Dépassement autorisé par dérogation RH/Finance"
                    ></div>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="overflow-x-auto mt-space-sm">
                <table className="w-full text-left font-body-default text-body-default">
                  <thead>
                    <tr className="bg-bg-canvas text-text-secondary text-xs uppercase tracking-wider">
                      <th className="py-2.5 px-3 rounded-l-lg">Poste budgétaire</th>
                      <th className="py-2.5 px-3">Mensuel Brut</th>
                      <th className="py-2.5 px-3">Charges Patronales (40%)</th>
                      <th className="py-2.5 px-3 rounded-r-lg text-right">Annuel Total Chargé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default/30 text-xs">
                    <tr className="bg-surface-card">
                      <td className="py-2.5 px-3 font-body-medium text-text-primary">Salaire Fourchette Basse</td>
                      <td className="py-2.5 px-3 tabular-nums">3 000,00 €</td>
                      <td className="py-2.5 px-3 tabular-nums">1 200,00 €</td>
                      <td className="py-2.5 px-3 tabular-nums text-right font-medium">50 400,00 €</td>
                    </tr>
                    <tr className="bg-primary-subtle font-body-semibold text-primary">
                      <td className="py-2.5 px-3">Plafond Dérogatoire Accordé</td>
                      <td className="py-2.5 px-3 tabular-nums">3 600,00 €</td>
                      <td className="py-2.5 px-3 tabular-nums">1 440,00 €</td>
                      <td className="py-2.5 px-3 tabular-nums text-right font-bold text-text-primary">60 480,00 €</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strategic Synthesis & Business Case */}
            <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm pb-space-xs border-b border-border-default">
                <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">
                  Synthèse stratégique & Business Case
                </h2>
              </div>
              <div className="space-y-space-md font-body-default text-body-default text-text-secondary leading-relaxed">
                <div className="bg-bg-canvas p-space-md rounded-lg flex flex-col gap-1 border border-border-default/60">
                  <span className="font-caption-medium text-caption-medium uppercase text-text-muted tracking-wider">
                    Justification opérationnelle DSI
                  </span>
                  <p className="text-text-primary">
                    La mise en conformité réglementaire <span className="font-body-semibold">NIS 2</span> et le déploiement de l'architecture Cloud Souverain exigent une expertise pointue en automatisation CI/CD sécurisée. Le gel de ce recrutement reporte le jalon d'homologation de production du T1 2027 au S2 2027, exposant l'organisation à un risque de non-conformité contractuelle.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col gap-1 border border-border-default/40">
                    <div className="flex items-center gap-1.5 text-text-primary font-body-semibold text-body-semibold">
                      <span className="material-symbols-outlined text-info-sky text-[18px]">bolt</span>
                      Impact sur la vélocité
                    </div>
                    <p className="font-caption text-caption text-text-secondary">
                      Absorption de 320 jours/homme d'audits de code automatisés par an, déchargeant 3 leads techniques actuellement saturés.
                    </p>
                  </div>
                  <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col gap-1 border border-border-default/40">
                    <div className="flex items-center gap-1.5 text-text-primary font-body-semibold text-body-semibold">
                      <span className="material-symbols-outlined text-success-emerald text-[18px]">verified_user</span>
                      Couverture du risque
                    </div>
                    <p className="font-caption text-caption text-text-secondary">
                      Suppression de la dépendance externe prestataire actuelle (facturée 850 € HT/jour, soit une économie brute estimée de 42 k€/an).
                    </p>
                  </div>
                </div>

                <div 
                  onClick={onOpenDocModal}
                  className="flex items-center gap-space-sm text-xs text-text-muted bg-surface-card p-2 rounded-lg border border-border-default cursor-pointer hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                  <span>Fiche de poste standardisée n° FP-DSI-2026-11 certifiée par le comité RH et validée sans réserve par le CSE.</span>
                  <span className="text-primary font-medium hover:underline ml-auto">Voir document →</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 5 OF 12 COLS - AUDIT TIMELINE & DECISION CONTEXT */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            {/* Vertical Audit Timeline & Consecutive Visas */}
            <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs border-b border-border-default">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">history_edu</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">Piste d'audit & Visas</h2>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-dark bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Horodatage certifié
                </span>
              </div>

              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-high">
                {/* Milestone 1: Manager */}
                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-success-emerald ring-4 ring-surface-card"></div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-semibold text-body-semibold text-text-primary">Étape 1 · Création du besoin</span>
                    <span className="font-caption text-caption text-text-muted">14/10/2026 à 09:15</span>
                  </div>
                  <p className="font-caption-medium text-caption-medium text-text-secondary">
                    <span className="text-text-primary font-medium">Marc Lefebvre</span> (Manager Technique DevSecOps)
                  </p>
                  <div className="bg-bg-canvas p-space-sm rounded-lg text-xs text-text-secondary mt-1 border border-border-default/60">
                    « Ouverture prioritaire pour relève d'astreinte et pilotage du durcissement Kubernetes. »
                  </div>
                </div>

                {/* Milestone 2: RH */}
                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-success-emerald ring-4 ring-surface-card"></div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-semibold text-body-semibold text-text-primary">Étape 2 · Éligibilité RH</span>
                    <span className="font-caption text-caption text-text-muted">16/10/2026 à 14:30</span>
                  </div>
                  <p className="font-caption-medium text-caption-medium text-text-secondary">
                    <span className="text-text-primary font-medium">Claire Delorme</span> (Responsable RH Recrutement)
                  </p>
                  <div className="bg-bg-canvas p-space-sm rounded-lg text-xs text-text-secondary mt-1 border border-border-default/60">
                    Fiche de poste qualifiée Grade G5. Disponibilité de vivier externe confirmée avec tension forte sur le profil.
                  </div>
                </div>

                {/* Milestone 3: Finance Derogation */}
                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-warning-amber ring-4 ring-surface-card"></div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-semibold text-body-semibold text-warning-text">
                      Étape 3 · Arbitrage Finance (Dérogation)
                    </span>
                    <span className="font-caption text-caption text-text-muted">18/10/2026 à 11:20</span>
                  </div>
                  <p className="font-caption-medium text-caption-medium text-text-secondary">
                    <span className="text-text-primary font-medium">Gilles Vaudon</span> (Contrôleur de Gestion DSI)
                  </p>
                  <div className="bg-amber-50/70 p-space-sm rounded-lg text-xs text-warning-text mt-1 border border-amber-200">
                    <span className="font-semibold">Motif officiel consigné :</span> « Dépassement de grille (+480 €) validé au titre du caractère critique en cybersécurité pour la société. Les enveloppes d'astreintes prévisionnelles sont ajustées en conséquence. »
                  </div>
                </div>

                {/* Milestone 4: Direction (Pending) */}
                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-surface-card animate-ping"></div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-semibold text-body-semibold text-primary">
                      Étape 4 · Signature Direction
                    </span>
                    <span className="font-caption text-caption text-primary font-medium">En attente active</span>
                  </div>
                  <p className="font-caption-medium text-caption-medium text-text-secondary">
                    Direction Générale · Décision exécutive finale requise pour déclenchement des publications.
                  </p>
                </div>
              </div>

              <div className="mt-space-sm pt-space-sm bg-bg-canvas p-space-md rounded-lg flex items-center justify-between border border-border-default">
                <span className="font-caption text-caption text-text-secondary">ID Transaction Blockchain interne</span>
                <span className="font-caption-medium text-caption-medium font-mono text-text-primary">0x8F94…b44D</span>
              </div>
            </div>

            {/* Candidate Sourcing Preview Card */}
            <div className="bg-surface-card p-space-lg rounded-xl shadow-sm border border-border-default flex flex-col gap-space-sm">
              <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted">
                Vivier & Canaux de sourcing
              </span>
              <div className="flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">hub</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-body-semibold text-body-semibold text-text-primary">3 pré-candidatures qualifiées</span>
                  <span className="font-caption text-caption text-text-secondary">
                    Cabinet partenaire et cooptations en attente d'arbitrage
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-space-xs text-xs">
                <span className="text-text-muted">Disponibilité moyenne</span>
                <span className="font-semibold text-text-primary">Sous 60 jours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Persistent Bottom Decision Bar */}
        <div className="fixed bottom-0 left-64 right-0 bg-surface-card/95 backdrop-blur-md px-gutter py-3.5 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-border-default flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md min-w-0">
            <div className="p-2 rounded-lg bg-surface-container-high hidden sm:flex items-center justify-center text-text-primary">
              <span className="material-symbols-outlined text-[20px]">gavel</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-sm truncate">
                <span className="font-body-semibold text-body-semibold text-text-primary truncate">
                  Décision Direction Générale
                </span>
                <span className="font-caption text-caption text-text-muted hidden md:inline">
                  · REQ-2026-0042 (DevSecOps)
                </span>
              </div>
              <span className="font-caption text-caption text-text-secondary truncate">
                La validation engagera le budget employeur annuel de{' '}
                <span className="font-semibold tabular-nums text-text-primary">60 480,00 €</span>.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-md shrink-0">
            {/* Consultation link */}
            <button
              onClick={onOpenDocModal}
              className="hidden xl:inline-flex items-center gap-1 font-body-default text-body-default text-text-secondary hover:text-text-primary transition-colors pr-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
              Consulter le dossier d'audit complet
            </button>

            {/* Rejet Button */}
            <button
              type="button"
              disabled={approvalStatus === 'approving' || approvalStatus === 'approved'}
              onClick={handleReject}
              className="h-9 px-space-md rounded-lg font-body-semibold text-body-semibold text-danger-red bg-surface-card hover:bg-red-50 border border-border-default focus:outline-none transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Les fonds réservés de 60 480 € seront automatiquement débloqués"
            >
              <span className="material-symbols-outlined text-[18px]">block</span>
              <span>{approvalStatus === 'rejected' ? 'Demande clôturée' : 'Rejeter la demande'}</span>
            </button>

            {/* Validation Button */}
            <button
              type="button"
              disabled={approvalStatus === 'approving' || approvalStatus === 'approved'}
              onClick={handleApprove}
              className="h-9 px-space-lg rounded-lg font-body-semibold text-body-semibold text-white bg-success-dark hover:bg-emerald-800 shadow-sm focus:outline-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-85"
            >
              <span className={`material-symbols-outlined text-[18px] ${approvalStatus === 'approving' ? 'animate-spin' : ''}`}>
                {approvalStatus === 'approving' ? 'sync' : approvalStatus === 'approved' ? 'verified' : 'check_circle'}
              </span>
              <span>
                {approvalStatus === 'approving'
                  ? 'Validation en cours...'
                  : approvalStatus === 'approved'
                  ? 'Offre publiée avec succès (Redirection...)'
                  : "Valider l'ouverture du recrutement"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
