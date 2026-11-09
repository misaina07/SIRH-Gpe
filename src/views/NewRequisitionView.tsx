import React, { useState } from 'react';
import { ViewMode } from '../types/sirh';

interface NewRequisitionViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenDocModal?: () => void;
}

export const NewRequisitionView: React.FC<NewRequisitionViewProps> = ({ onNavigate }) => {
  const [selectedDept, setSelectedDept] = useState<string>('dept-dsi-cloud');
  const [salMin, setSalMin] = useState<number>(3000);
  const [salMax, setSalMax] = useState<number>(3600);
  const [currency, setCurrency] = useState<string>('EUR');
  const [activeStep, setActiveStep] = useState<number>(2);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [saveTime, setSaveTime] = useState<string>('14:32');

  // Mathematical constraints for G5 & IT Dept
  const deptCeiling = 3400;
  const gradeMin = 2500;
  const gradeMax = 3500;
  const deptMin = 2600;
  const deptMax = 3400;
  const allocatedBudget = 60000;

  // Real-time calculations
  const annualMin = salMin * 12;
  const annualMax = salMax * 12;
  const employerCost = salMax * 12 * 1.4; // 40% employer charges
  const budgetVariance = allocatedBudget - employerCost;
  const deptExcess = salMax - deptCeiling;

  // Chart range math: scale 2 000 € (0%) to 4 000 € (100%)
  const scaleMin = 2000;
  const scaleMax = 4000;
  const getPercent = (val: number) => {
    const clamped = Math.max(scaleMin, Math.min(scaleMax, val));
    return ((clamped - scaleMin) / (scaleMax - scaleMin)) * 100;
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setSalMin(num);
    setIsSaved(false);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setSalMax(num);
    setIsSaved(false);
  };

  const handleSaveDraft = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSaveTime(timeStr);
    setIsSaved(true);
  };

  // Bar calculations
  const reqStartPct = getPercent(salMin);
  const reqEndPct = getPercent(salMax);
  const reqWidthPct = Math.max(0, reqEndPct - reqStartPct);

  // If exceeding deptCeiling, split the manager bar
  const deptCeilPct = getPercent(deptCeiling);
  const hasExcess = salMax > deptCeiling;
  const normalWidthPct = hasExcess ? Math.max(0, deptCeilPct - reqStartPct) : reqWidthPct;
  const excessWidthPct = hasExcess ? Math.max(0, reqEndPct - deptCeilPct) : 0;

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Decorative ambient glow */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-24 left-1/3 w-96 h-96 bg-primary-container/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-12 right-12 w-64 h-64 bg-info-sky/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Page Context & Header Bar */}
        <div className="max-w-[1280px] mx-auto w-full px-space-lg pt-space-lg pb-space-md">
          {/* Metadata Strip */}
          <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-xs">
            <div className="flex items-center gap-space-xs text-text-muted font-caption text-caption">
              <span>RÉF : DEM-2026-0842</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-caption-medium text-caption-medium text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-warning-amber"></span>
                En cours de rédaction
              </span>
              <span>•</span>
              <span>Créé le 15/04/2026</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="px-2 py-0.5 rounded-full bg-secondary-container font-caption-medium text-caption text-on-secondary-container">
                Direction des Systèmes d'Information
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container font-caption-medium text-caption text-text-secondary">
                Périmètre France Métropole
              </span>
            </div>
          </div>

          {/* Main Title */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                Nouvelle demande de poste
              </h1>
              <p className="font-body-default text-body-default text-text-secondary mt-0.5">
                Expression du besoin — Parcours d'approbation et arbitrage budgétaire
              </p>
            </div>

            {/* Role badge indicator */}
            <div className="flex items-center gap-space-sm bg-surface-card px-space-md py-space-xs rounded-xl shadow-sm border border-border-default self-start md:self-auto">
              <div className="w-7 h-7 rounded-full bg-primary-subtle text-primary-container flex items-center justify-center font-caption-medium text-caption-medium font-bold">
                ML
              </div>
              <div className="flex flex-col text-left">
                <span className="font-caption-medium text-caption-medium text-text-primary leading-tight">Marc Lefebvre</span>
                <span className="font-caption text-caption text-text-muted leading-tight">Engineering Manager (Demandeur)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Progression Bar */}
      <div className="max-w-[1280px] mx-auto w-full px-space-lg mb-space-lg">
        <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-default">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md relative">
            {/* Step 1: Completed */}
            <button
              onClick={() => setActiveStep(1)}
              className="flex items-center gap-space-md group cursor-pointer transition-all text-left"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success-emerald text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-success-dark">
                  Étape 1 · Terminée
                </span>
                <span className="font-body-semibold text-body-semibold text-text-primary truncate">1. Poste et motif</span>
                <span className="font-caption text-caption text-text-muted truncate">Ingénieur DevSecOps (Grade G5)</span>
              </div>
            </button>

            {/* Step 2: Active */}
            <button
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-space-md relative md:pl-space-md md:border-l md:border-border-default text-left"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center shadow-sm ring-4 ring-primary-subtle">
                <span className="font-body-semibold text-body-semibold">2</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-primary-container">
                  Étape 2 sur 3 · En cours
                </span>
                <span className="font-body-semibold text-body-semibold text-text-primary truncate">2. Finances et salaire</span>
                <span className="font-caption text-caption text-text-secondary truncate">Fourchettes, grilles & budget</span>
              </div>
            </button>

            {/* Step 3: Upcoming */}
            <button
              onClick={() => onNavigate('qualification-rh')}
              className="flex items-center gap-space-md md:pl-space-md md:border-l md:border-border-default opacity-70 text-left hover:opacity-100 transition-opacity"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container text-text-muted flex items-center justify-center border border-border-default">
                <span className="font-body-semibold text-body-semibold">3</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted">
                  Étape 3 · À venir
                </span>
                <span className="font-body-semibold text-body-semibold text-text-secondary truncate">3. Justification et validation</span>
                <span className="font-caption text-caption text-text-muted truncate">Matrice d'impact & soumission</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid with 65/35 Split */}
      <div className="max-w-[1280px] mx-auto w-full px-space-lg pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Left Column: Form & Analytics (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            {/* Top Information Banner */}
            <div className="bg-primary-subtle/70 rounded-xl p-space-md flex items-start gap-space-md border border-primary-container/20">
              <div className="p-2 rounded-lg bg-white text-primary-container shadow-xs flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-semibold text-body-semibold text-primary">Référentiel salarial synchronisé</span>
                <p className="font-body-default text-body-default text-text-secondary mt-0.5">
                  Le poste sélectionné est <span className="font-body-semibold text-text-primary">Ingénieur DevSecOps (Grade G5)</span> rattaché au pôle Sécurité Applicative. Les montants saisis sont comparés en temps réel aux référentiels de classification et aux plafonds budgétaires validés au CODIR 2026.
                </p>
              </div>
            </div>

            {/* Multi-Department Manager Selector Card */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                  <span className="material-symbols-outlined text-[22px]">domain</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-body-semibold text-text-primary text-xs uppercase tracking-wider">
                      Département de rattachement du poste
                    </span>
                    <span className="px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      Manager : Marc Lefebvre (3 dpts)
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    En tant que manager, vous supervisez plusieurs départements. Choisissez le département cible :
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-80 shrink-0">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full h-10 px-3 bg-bg-canvas border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                >
                  <option value="dept-dsi-cloud">🏢 DSI · Infrastructure Cloud & DevOps (4100)</option>
                  <option value="dept-dsi-cyber">🏢 DSI · Cyber-Sécurité & NIS2 (4120)</option>
                  <option value="dept-dsi-archi">🏢 DSI · Architecture Logicielle (4200)</option>
                </select>
              </div>
            </div>

            {/* Form Card: Salary Inputs */}
            <div className="bg-surface-card rounded-xl p-space-lg shadow-sm border border-border-default">
              <div className="flex items-center justify-between pb-space-md border-b border-border-default mb-space-lg">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">Rémunération brute mensuelle de base</h2>
                  <p className="font-caption text-caption text-text-secondary">
                    Indiquez la plage de négociation autorisée pour les entretiens de recrutement.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs text-text-muted font-caption text-caption">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>Donnée confidentielle RH</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-end">
                {/* Min Salary */}
                <div className="md:col-span-5 flex flex-col gap-1.5">
                  <label className="font-label-default text-label-default text-text-primary flex items-center justify-between" htmlFor="sal-min">
                    <span>Salaire minimum demandé <span className="text-danger-red">*</span></span>
                    <span className="font-caption text-caption text-text-muted">Brut mensuel</span>
                  </label>
                  <div className="relative">
                    <input
                      id="sal-min"
                      type="text"
                      value={salMin.toLocaleString('fr-FR') + ' €'}
                      onChange={handleMinChange}
                      className="w-full h-10 pl-3 pr-10 bg-white border border-border-default rounded-lg font-body-semibold text-body-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all tabular-nums text-right"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px] pointer-events-none">
                      payments
                    </span>
                  </div>
                  <span className="font-caption text-caption text-text-muted">
                    Équivalent annuel brut : {annualMin.toLocaleString('fr-FR')},00 €
                  </span>
                </div>

                {/* Max Salary */}
                <div className="md:col-span-5 flex flex-col gap-1.5">
                  <label className="font-label-default text-label-default text-text-primary flex items-center justify-between" htmlFor="sal-max">
                    <span>Salaire maximum demandé <span className="text-danger-red">*</span></span>
                    <span className="font-caption text-caption text-text-muted">Brut mensuel</span>
                  </label>
                  <div className="relative">
                    <input
                      id="sal-max"
                      type="text"
                      value={salMax.toLocaleString('fr-FR') + ' €'}
                      onChange={handleMaxChange}
                      className={`w-full h-10 pl-3 pr-10 bg-white border ${
                        hasExcess ? 'border-warning-amber ring-1 ring-warning-amber/30' : 'border-border-default'
                      } rounded-lg font-body-semibold text-body-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-warning-amber focus:border-transparent transition-all tabular-nums text-right shadow-xs`}
                    />
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 ${
                      hasExcess ? 'text-warning-amber' : 'text-text-muted'
                    } text-[18px] pointer-events-none`}>
                      {hasExcess ? 'warning' : 'payments'}
                    </span>
                  </div>
                  <span className="font-caption text-caption text-warning-text font-caption-medium">
                    Équivalent annuel brut : {annualMax.toLocaleString('fr-FR')},00 €
                  </span>
                </div>

                {/* Currency Selector */}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="font-label-default text-label-default text-text-primary" htmlFor="currency-select">
                    Devise
                  </label>
                  <div className="relative">
                    <select
                      id="currency-select"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full h-10 pl-3 pr-8 bg-bg-canvas border border-border-default rounded-lg font-body-medium text-body-medium text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CHF">CHF (CHF)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[18px] pointer-events-none">
                      arrow_drop_down
                    </span>
                  </div>
                  <span className="font-caption text-caption text-text-muted">Zone Euro</span>
                </div>
              </div>
            </div>

            {/* Interactive Live Range Comparison Widget */}
            <div className="bg-surface-card rounded-xl p-space-lg shadow-sm border border-border-default flex flex-col gap-space-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md border-b border-border-default">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">bar_chart</span>
                    <h3 className="font-headline-sm text-headline-sm text-text-primary">Comparatif dynamique des grilles</h3>
                  </div>
                  <p className="font-caption text-caption text-text-secondary mt-0.5">
                    Positionnement relatif de l'enveloppe demandée vis-à-vis des accords d'entreprise.
                  </p>
                </div>
                <div className="flex items-center gap-space-md">
                  <div className="flex items-center gap-1.5 font-caption text-caption text-text-secondary">
                    <span className="w-3 h-2 rounded bg-indigo-100 border border-indigo-300 inline-block"></span>
                    <span>Grille poste G5</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-caption text-caption text-text-secondary">
                    <span className="w-3 h-2 rounded bg-slate-300 inline-block"></span>
                    <span>Plafond DSI</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-caption text-caption text-text-secondary">
                    <span className="w-3 h-2 rounded bg-primary-container inline-block"></span>
                    <span>Demande</span>
                  </div>
                </div>
              </div>

              {/* The Range Graph Canvas Container */}
              <div className="py-space-sm px-space-xs">
                {/* Axis Ticks (2 000 € -> 4 000 €) */}
                <div className="relative w-full h-6 mb-2">
                  <div className="absolute inset-x-0 bottom-0 h-px bg-border-default"></div>

                  <div className="absolute left-0 bottom-0 flex flex-col items-center -translate-x-1/2">
                    <span className="h-2 w-px bg-border-default mb-1"></span>
                    <span className="font-caption text-caption text-text-muted tabular-nums">2 000 €</span>
                  </div>
                  <div className="absolute left-[25%] bottom-0 flex flex-col items-center -translate-x-1/2">
                    <span className="h-2 w-px bg-border-default mb-1"></span>
                    <span className="font-caption text-caption text-text-muted tabular-nums">2 500 €</span>
                  </div>
                  <div className="absolute left-[50%] bottom-0 flex flex-col items-center -translate-x-1/2">
                    <span className="h-2 w-px bg-border-default mb-1"></span>
                    <span className="font-caption text-caption text-text-muted tabular-nums">3 000 €</span>
                  </div>
                  <div className="absolute left-[75%] bottom-0 flex flex-col items-center -translate-x-1/2">
                    <span className="h-2 w-px bg-border-default mb-1"></span>
                    <span className="font-caption text-caption text-text-muted tabular-nums">3 500 €</span>
                  </div>
                  <div className="absolute right-0 bottom-0 flex flex-col items-center translate-x-1/2">
                    <span className="h-2 w-px bg-border-default mb-1"></span>
                    <span className="font-caption text-caption text-text-muted tabular-nums">4 000 €</span>
                  </div>

                  {/* Vertical Reference Guideline for 3 400 € Max Department (70%) */}
                  <div className="absolute left-[70%] top-[-80px] bottom-[-140px] w-px border-l border-dashed border-warning-amber pointer-events-none z-10 hidden md:block">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-warning-amber text-warning-text font-caption-medium text-[10px] whitespace-nowrap shadow-xs">
                      Plafond DSI : 3 400 €
                    </span>
                  </div>
                </div>

                {/* Stacked Bars Container */}
                <div className="flex flex-col gap-space-md pt-space-md">
                  {/* Bar 1: Grille du poste (Grade G5) : 2 500 € (25%) -> 3 500 € (75%) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-caption font-caption-medium">
                      <span className="text-text-secondary">Grille du poste (Grade G5)</span>
                      <span className="text-text-primary tabular-nums">
                        {gradeMin.toLocaleString('fr-FR')},00 € — {gradeMax.toLocaleString('fr-FR')},00 €
                      </span>
                    </div>
                    <div className="h-7 w-full bg-surface-container rounded-lg relative overflow-hidden flex items-center">
                      <div className="absolute left-[25%] w-[50%] h-full bg-primary-subtle border-y border-primary-container/30 flex items-center justify-between px-2 text-primary font-caption-medium text-[11px]">
                        <span>Min standard</span>
                        <span>Médiane conventionnelle</span>
                        <span>Max standard</span>
                      </div>
                    </div>
                  </div>

                  {/* Bar 2: Grille départementale (IT) : 2 600 € (30%) -> 3 400 € (70%) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-caption font-caption-medium">
                      <span className="text-text-secondary">Grille départementale (Direction IT)</span>
                      <span className="text-text-primary tabular-nums">
                        {deptMin.toLocaleString('fr-FR')},00 € — {deptMax.toLocaleString('fr-FR')},00 €
                      </span>
                    </div>
                    <div className="h-7 w-full bg-surface-container rounded-lg relative overflow-hidden flex items-center">
                      <div className="absolute left-[30%] w-[40%] h-full bg-slate-200/90 flex items-center justify-between px-2 text-text-secondary font-caption-medium text-[11px]">
                        <span>2 600 €</span>
                        <span className="hidden sm:inline">Plafond budgétaire IT</span>
                        <span>3 400 €</span>
                      </div>
                    </div>
                  </div>

                  {/* Bar 3: Votre demande manager (Dynamic live width!) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-caption font-caption-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-primary font-body-semibold">Votre demande manager</span>
                        {hasExcess && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-100 text-warning-text text-[11px] font-caption-medium">
                            +{deptExcess.toLocaleString('fr-FR')} € au-dessus du plafond IT
                          </span>
                        )}
                      </div>
                      <span className="text-text-primary font-body-semibold tabular-nums">
                        {salMin.toLocaleString('fr-FR')},00 € — {salMax.toLocaleString('fr-FR')},00 €
                      </span>
                    </div>

                    <div className="h-8 w-full bg-surface-container rounded-lg relative overflow-hidden flex items-center shadow-inner">
                      {/* Normal requested range */}
                      <div
                        className="absolute h-full bg-primary-container text-white flex items-center justify-start px-2 font-caption-medium text-[11px] transition-all duration-300"
                        style={{
                          left: `${reqStartPct}%`,
                          width: `${normalWidthPct}%`,
                        }}
                      >
                        <span className="truncate">{salMin.toLocaleString('fr-FR')} €</span>
                      </div>

                      {/* Excess segment beyond 3 400 € */}
                      {hasExcess && (
                        <div
                          className="absolute h-full bg-warning-amber flex items-center justify-end px-2 text-warning-text font-caption-medium text-[11px] animate-pulse transition-all duration-300"
                          style={{
                            left: `${deptCeilPct}%`,
                            width: `${excessWidthPct}%`,
                          }}
                        >
                          <span className="truncate font-body-semibold">{salMax.toLocaleString('fr-FR')} €</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Legend and Help Note */}
                <div className="mt-space-md p-space-sm bg-bg-canvas rounded-lg flex items-center justify-between text-caption font-caption text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-text-secondary">tune</span>
                    Les fourchettes sont mises à jour automatiquement selon les barèmes conventionnels SYNTEC 2026.
                  </span>
                  <span className="tabular-nums">Échelle : 100 € = 5% axe</span>
                </div>
              </div>
            </div>

            {/* Warning Callout: Department Range Overflow */}
            {hasExcess && (
              <div className="bg-[#FFFBEB] rounded-xl p-space-md border border-amber-200 shadow-sm flex items-start gap-space-md animate-in fade-in duration-200">
                <div className="p-2 rounded-lg bg-amber-100 text-warning-amber flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[22px]">warning</span>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-body-semibold text-body-semibold text-warning-text">
                      Dépassement de la grille départementale détecté
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-warning-text font-caption-medium text-caption">
                      Écart : +{deptExcess.toLocaleString('fr-FR')},00 €/mois
                    </span>
                  </div>
                  <p className="font-body-default text-body-default text-text-secondary mt-1">
                    Votre fourchette demandée (<span className="font-body-semibold text-text-primary tabular-nums">{salMax.toLocaleString('fr-FR')},00 €</span>) excède la grille de référence du département Informatique (<span className="font-body-semibold text-text-primary tabular-nums">{deptCeiling.toLocaleString('fr-FR')},00 €</span>). Le service Finance & Contrôle de Gestion pourra demander un ajustement ou appliquer une validation par dérogation motivée lors de l'étape 3.
                  </p>
                  <div className="mt-space-sm pt-space-xs border-t border-amber-200/80 flex items-center gap-space-md text-caption font-caption-medium text-warning-text">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">help_outline</span>
                      Impact : Nécessite visa explicite Contrôle de Gestion
                    </span>
                    <button
                      onClick={() => onNavigate('validation-finance')}
                      className="underline hover:text-text-primary transition-colors cursor-pointer"
                    >
                      Préparer l'argumentaire dérogation →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Indicative Employer Financial Impact Card */}
            <div className="bg-surface-card rounded-xl p-space-lg shadow-sm border border-border-default">
              <div className="flex items-center justify-between pb-space-sm border-b border-border-default mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-text-secondary text-[20px]">calculate</span>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">Impact financier indicatif calculé</h3>
                </div>
                <span className="font-caption-medium text-caption-medium text-text-muted uppercase">Exercice fiscal 2026</span>
              </div>

              {/* Formula Breakdown Card */}
              <div className="bg-bg-canvas rounded-lg p-space-md border border-border-default mb-space-md">
                <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted">
                  Formule de calcul normalisée
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-body-semibold text-body-semibold text-text-primary tabular-nums">
                  <span className="px-2 py-1 bg-white rounded border border-border-default">
                    {salMax.toLocaleString('fr-FR')},00 € <span className="font-caption text-caption text-text-muted">brut max</span>
                  </span>
                  <span className="text-text-muted">×</span>
                  <span className="px-2 py-1 bg-white rounded border border-border-default">12 mois</span>
                  <span className="text-text-muted">×</span>
                  <span className="px-2 py-1 bg-white rounded border border-border-default">
                    1,40 <span className="font-caption text-caption text-text-muted">taux charges 40%</span>
                  </span>
                  <span className="text-text-muted">=</span>
                  <span className="px-3 py-1 bg-primary-subtle text-primary-container rounded border border-primary-container/20 text-headline-sm font-headline-sm">
                    {employerCost.toLocaleString('fr-FR')},00 €
                  </span>
                  <span className="font-caption text-caption text-text-secondary">/ an coût total employeur</span>
                </div>
              </div>

              {/* Department Budget Arbitration Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="p-space-md bg-white rounded-lg border border-border-default flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-caption text-caption text-text-muted">Budget alloué au poste (DSI 2026)</span>
                    <span className="font-headline-sm text-headline-sm text-text-primary tabular-nums">
                      {allocatedBudget.toLocaleString('fr-FR')},00 €
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary">
                    <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  </div>
                </div>

                <div className={`p-space-md ${budgetVariance < 0 ? 'bg-red-50/60 border-red-200' : 'bg-emerald-50/60 border-emerald-200'} rounded-lg border flex items-center justify-between`}>
                  <div className="flex flex-col">
                    <span className={`font-caption text-caption ${budgetVariance < 0 ? 'text-danger-red' : 'text-success-dark'} font-caption-medium`}>
                      {budgetVariance < 0 ? 'Dépassement prévisionnel constaté' : 'Reliquat disponible prévisionnel'}
                    </span>
                    <span className={`font-headline-sm text-headline-sm ${budgetVariance < 0 ? 'text-danger-red' : 'text-success-dark'} tabular-nums`}>
                      {budgetVariance < 0 ? `− ${Math.abs(budgetVariance).toLocaleString('fr-FR')},00 €` : `+ ${budgetVariance.toLocaleString('fr-FR')},00 €`}
                    </span>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${budgetVariance < 0 ? 'bg-red-100 text-danger-red' : 'bg-emerald-100 text-success-dark'} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {budgetVariance < 0 ? 'trending_down' : 'trending_up'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="font-caption text-caption text-text-muted mt-space-sm">
                {budgetVariance < 0
                  ? `Ce différentiel de ${Math.abs(budgetVariance).toLocaleString('fr-FR')},00 € fera l'objet d'un arbitrage par l'équipe Contrôle de Gestion lors de la phase 3 d'approbation.`
                  : 'L\'enveloppe demandée s\'inscrit dans les limites budgétaires allouées.'}
              </p>
            </div>
          </div>

          {/* Right Column: Approval Path Timeline & Metadata (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-space-lg sticky top-20">
            {/* Sticky Sidebar: Parcours de Validation */}
            <div className="bg-surface-card rounded-xl p-space-lg shadow-sm border border-border-default">
              <div className="flex items-center justify-between pb-space-sm border-b border-border-default mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-text-secondary text-[20px]">account_tree</span>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">Parcours de validation</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container font-caption-medium text-caption text-text-muted">
                  4 étapes
                </span>
              </div>
              <p className="font-caption text-caption text-text-secondary mb-space-md">
                Chaque acteur dispose d'un temps de traitement défini par les conventions de service RH (SLA).
              </p>

              {/* Timeline Track */}
              <div className="relative pl-6 flex flex-col gap-space-lg before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border-default">
                {/* Step 1: Manager (Demandeur) - Current */}
                <div className="relative flex items-start group">
                  <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-primary-container text-white flex items-center justify-center ring-4 ring-primary-subtle text-[11px] font-caption-medium">
                    1
                  </span>
                  <div className="flex flex-col min-w-0 pl-1">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-body-semibold text-body-semibold text-text-primary">1. Manager</span>
                      <span className="px-2 py-0.2 rounded-full bg-primary-subtle text-primary font-caption-medium text-[11px]">
                        En cours
                      </span>
                    </div>
                    <span className="font-caption-medium text-caption-medium text-text-secondary mt-0.5">
                      Demandeur : Marc Lefebvre
                    </span>
                    <span className="font-caption text-caption text-text-muted">Session ouverte il y a 18 min</span>
                  </div>
                </div>

                {/* Step 2: Qualification RH */}
                <div 
                  onClick={() => onNavigate('qualification-rh')}
                  className="relative flex items-start opacity-90 group cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
                >
                  <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-border-default text-text-muted flex items-center justify-center text-[11px] font-caption-medium group-hover:border-primary-container group-hover:text-primary-container">
                    2
                  </span>
                  <div className="flex flex-col min-w-0 pl-1 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-body-semibold text-body-semibold text-text-secondary group-hover:text-primary">
                        2. Qualification RH
                      </span>
                      <span className="font-caption-medium text-caption-medium text-info-sky bg-sky-50 px-1.5 rounded">
                        SLA : 48h
                      </span>
                    </div>
                    <span className="font-caption text-caption text-text-muted mt-0.5">Vérification classification & convention</span>
                    <span className="font-caption text-caption text-text-muted">Responsable : Claire Delorme (RH)</span>
                  </div>
                </div>

                {/* Step 3: Contrôle Finance & Budget */}
                <div 
                  onClick={() => onNavigate('validation-finance')}
                  className="relative flex items-start opacity-90 group cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
                >
                  <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-border-default text-text-muted flex items-center justify-center text-[11px] font-caption-medium group-hover:border-primary-container group-hover:text-primary-container">
                    3
                  </span>
                  <div className="flex flex-col min-w-0 pl-1 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-body-semibold text-body-semibold text-text-secondary group-hover:text-primary">
                        3. Contrôle Finance & Budget
                      </span>
                      <span className="font-caption-medium text-caption-medium text-warning-text bg-amber-50 px-1.5 rounded">
                        SLA : 72h
                      </span>
                    </div>
                    <span className="font-caption text-caption text-text-muted mt-0.5">Arbitrage dépassement grille (+200 €)</span>
                    <span className="font-caption text-caption text-text-muted">Responsable : Direction Financière DSI</span>
                  </div>
                </div>

                {/* Step 4: Direction Générale */}
                <div 
                  onClick={() => onNavigate('approbation-direction')}
                  className="relative flex items-start opacity-70 group cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
                >
                  <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-border-default text-text-muted flex items-center justify-center text-[11px] font-caption-medium group-hover:border-primary-container group-hover:text-primary-container">
                    4
                  </span>
                  <div className="flex flex-col min-w-0 pl-1 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-body-semibold text-body-semibold text-text-secondary group-hover:text-primary">
                        4. Direction Générale
                      </span>
                      <span className="font-caption text-caption text-text-muted">Clôture</span>
                    </div>
                    <span className="font-caption text-caption text-text-muted mt-0.5">Approbation finale & signature</span>
                    <span className="font-caption text-caption text-text-muted">Publication automatique du poste</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Box */}
            <div className="bg-surface-card rounded-xl p-space-md shadow-sm border border-border-default flex flex-col gap-space-sm">
              <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted">
                Récapitulatif de la position
              </span>
              <div className="flex justify-between items-center py-1 border-b border-border-default text-caption">
                <span className="text-text-secondary">Intitulé du poste</span>
                <span className="font-body-semibold text-text-primary">DevSecOps Engineer</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-default text-caption">
                <span className="text-text-secondary">Type de contrat</span>
                <span className="font-body-semibold text-text-primary">CDI — Temps plein</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-default text-caption">
                <span className="text-text-secondary">Département</span>
                <span className="font-body-semibold text-text-primary">Infrastructure Cloud & Sec</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-default text-caption">
                <span className="text-text-secondary">Motif du recrutement</span>
                <span className="font-body-semibold text-text-primary">Création de poste (Projet 2026)</span>
              </div>
              <div className="flex justify-between items-center py-1 text-caption">
                <span className="text-text-secondary">Prise de poste ciblée</span>
                <span className="font-body-semibold text-text-primary">01/06/2026</span>
              </div>
            </div>

            {/* Help Widget */}
            <div className="bg-surface-container rounded-xl p-space-md flex items-center gap-space-md">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-container shadow-xs flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-semibold text-body-semibold text-text-primary">Une question sur les grilles ?</span>
                <span className="font-caption text-caption text-text-secondary">Contactez le référent RH rémunération interne.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-64 right-0 h-16 bg-surface-card/95 backdrop-blur-md border-t border-border-default shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-30">
        <div className="max-w-[1280px] mx-auto h-full px-space-lg flex items-center justify-between gap-space-md">
          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-space-xs text-text-secondary">
            <span className="material-symbols-outlined text-success-emerald text-[20px]">cloud_done</span>
            <span className="font-caption text-caption text-text-muted hidden sm:inline">
              Brouillon enregistré automatiquement à{' '}
              <span className="font-caption-medium text-text-secondary tabular-nums">{saveTime}</span>
            </span>
            <span className="font-caption text-caption text-text-muted sm:hidden">Enregistré {saveTime}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-space-sm">
            {/* Ghost Button: Save Draft */}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="h-9 px-space-md rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-canvas font-body-medium text-body-medium transition-colors hidden md:inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{isSaved ? 'Brouillon enregistré' : 'Enregistrer le brouillon'}</span>
            </button>

            {/* Secondary Button: Previous Step */}
            <button
              type="button"
              onClick={() => onNavigate('tableau-de-bord')}
              className="h-9 px-space-md rounded-md border border-border-default bg-white text-text-primary hover:bg-bg-canvas font-body-medium text-body-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Précédent</span>
            </button>

            {/* Primary Button: Next Step */}
            <button
              type="button"
              onClick={() => onNavigate('qualification-rh')}
              className="h-9 px-space-md rounded-md bg-primary-container text-white hover:bg-primary-hover font-body-semibold text-body-semibold transition-all flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2"
            >
              <span>Étape suivante : Justification</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
