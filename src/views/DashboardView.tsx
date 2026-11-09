import React from 'react';
import { UserProfile, ViewMode } from '../types/sirh';
import { DepartmentPositionsDropdown } from '../components/DepartmentPositionsDropdown';

interface DashboardViewProps {
  onNavigate: (view: ViewMode) => void;
  onOpenScheduleModal: () => void;
  onOpenDocModal: () => void;
  currentUser?: UserProfile;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenScheduleModal,
  currentUser,
}) => {
  return (
    <div className="flex flex-col w-full pb-16">
      <div className="w-full max-w-7xl mx-auto px-margin py-space-lg flex flex-col gap-space-lg">
        {/* Top Greeting & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md bg-surface-card p-space-lg rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute -right-8 -top-12 w-64 h-64 bg-primary-subtle rounded-full blur-2xl pointer-events-none opacity-60"></div>
          <div className="flex flex-col gap-space-xs relative z-10">
            <div className="flex items-center gap-space-xs text-text-muted font-caption-medium text-caption-medium uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-success-emerald"></span>
              <span>Tableau de bord RH</span>
              <span>•</span>
              <span className="text-text-secondary">{currentUser?.department || 'Direction des Ressources Humaines'}</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
              Bonjour, {currentUser?.name || 'Claire Delorme'}
            </h1>
            <p className="font-body-default text-body-default text-text-secondary max-w-2xl">
              {currentUser?.roleType === 'Manager'
                ? `Espace Demandeur & Responsable de ${currentUser.managedDepartmentNames?.length || 3} départements (Infra Cloud, Cyber-Sécurité, Architecture).`
                : 'Voici un aperçu de vos recrutements, demandes à qualifier et intégrations en cours.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm relative z-10 shrink-0">
            {/* Quick access dropdown for positions per department */}
            <DepartmentPositionsDropdown onNavigate={onNavigate} currentUser={currentUser} />

            <button
              type="button"
              onClick={() => onNavigate('nouvelle-demande')}
              className="inline-flex items-center gap-space-xs px-space-md h-9 bg-primary-container hover:bg-primary-hover text-white rounded-lg font-body-semibold text-body-semibold shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Nouvelle réquisition</span>
            </button>
          </div>
        </div>

        {/* Top KPI Row (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Card 1 */}
          <div 
            onClick={() => onNavigate('mes-demandes')}
            className="bg-surface-card p-space-md rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary-subtle flex items-center justify-center text-primary-container group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary-subtle text-primary font-caption-medium text-caption-medium">
                +2 aujourd'hui
              </span>
            </div>
            <div className="mt-space-md">
              <div className="font-headline-lg text-headline-lg text-text-primary leading-none tabular-nums font-semibold">4</div>
              <p className="font-caption-medium text-caption-medium text-text-secondary mt-1">Demandes à qualifier</p>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => onNavigate('recrutement')}
            className="bg-surface-card p-space-md rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-info-sky group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">group</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-danger-red font-caption-medium text-caption-medium font-medium">
                3 urgentes
              </span>
            </div>
            <div className="mt-space-md">
              <div className="font-headline-lg text-headline-lg text-text-primary leading-none tabular-nums font-semibold">18</div>
              <p className="font-caption-medium text-caption-medium text-text-secondary mt-1">Candidatures à traiter</p>
            </div>
          </div>

          {/* Card 3 */}
          <div 
            onClick={onOpenScheduleModal}
            className="bg-surface-card p-space-md rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-success-emerald group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">event_available</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-success-dark font-caption-medium text-caption-medium">
                2 aujourd'hui
              </span>
            </div>
            <div className="mt-space-md">
              <div className="font-headline-lg text-headline-lg text-text-primary leading-none tabular-nums font-semibold">7</div>
              <p className="font-caption-medium text-caption-medium text-text-secondary mt-1">Entretiens cette semaine</p>
            </div>
          </div>

          {/* Card 4 */}
          <div 
            onClick={() => onNavigate('onboarding')}
            className="bg-surface-card p-space-md rounded-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">person_add</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-caption-medium text-caption-medium">
                1 arrivée lundi
              </span>
            </div>
            <div className="mt-space-md">
              <div className="font-headline-lg text-headline-lg text-text-primary leading-none tabular-nums font-semibold">5</div>
              <p className="font-caption-medium text-caption-medium text-text-secondary mt-1">Onboardings en cours</p>
            </div>
          </div>
        </div>

        {/* Main Content Area: 2/3 Left + 1/3 Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
          {/* LEFT PANEL (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-space-lg min-w-0">
            {/* Task List Card (À traiter en priorité) */}
            <div className="bg-surface-card rounded-lg shadow-sm flex flex-col overflow-hidden">
              <div className="px-space-lg py-space-md bg-surface-card flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">bolt</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">À traiter en priorité</h2>
                  <span className="px-2 py-0.5 rounded-full bg-bg-canvas text-text-secondary font-caption-medium text-caption-medium tabular-nums">
                    4 tâches actives
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button 
                    onClick={() => onNavigate('mes-demandes')}
                    className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-bg-canvas transition-colors" 
                    title="Filtres"
                  >
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-canvas text-text-secondary font-caption-medium text-caption-medium uppercase tracking-wider">
                      <th className="py-space-sm px-space-md">N° Référence</th>
                      <th className="py-space-sm px-space-md">Intitulé du poste / Candidat</th>
                      <th className="py-space-sm px-space-md">Demandeur / Service</th>
                      <th className="py-space-sm px-space-md">Étape & SLA</th>
                      <th className="py-space-sm px-space-md text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default/40">
                    {/* Row 1 */}
                    <tr className="bg-surface-card hover:bg-bg-canvas transition-colors">
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <button
                          onClick={() => onNavigate('validation-finance')}
                          className="font-body-semibold text-body-semibold text-primary font-mono text-[13px] hover:underline"
                        >
                          REQ-2026-0042
                        </button>
                      </td>
                      <td className="py-3 px-space-md min-w-[200px]">
                        <div className="font-body-semibold text-body-semibold text-text-primary">Ingénieur DevSecOps</div>
                        <div className="font-caption text-caption text-text-muted">CDI • Cadre • Paris</div>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <div className="font-body-default text-body-default text-text-primary">Marc Lefebvre</div>
                        <div className="font-caption text-caption text-text-secondary">Direction DSI</div>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-success-dark font-caption-medium text-caption-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-emerald"></span>
                          <span>En attente Finance</span>
                        </div>
                        <div className="font-caption text-caption text-text-muted mt-0.5 pl-3 tabular-nums">48h restantes</div>
                      </td>
                      <td className="py-3 px-space-md text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onNavigate('validation-finance')}
                          className="h-8 px-space-md bg-surface-card hover:bg-bg-canvas text-text-primary font-body-semibold text-body-semibold rounded-lg shadow-sm border border-border-default transition-all"
                        >
                          Ouvrir
                        </button>
                      </td>
                    </tr>

                    {/* Row 2 (Flagged: Amber accent bar) */}
                    <tr className="bg-surface-card hover:bg-bg-canvas transition-colors relative">
                      <td className="py-3 px-space-md whitespace-nowrap relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning-amber"></div>
                        <button
                          onClick={() => onNavigate('qualification-rh')}
                          className="font-body-semibold text-body-semibold text-primary font-mono text-[13px] pl-1 hover:underline"
                        >
                          REQ-2026-0045
                        </button>
                      </td>
                      <td className="py-3 px-space-md min-w-[200px]">
                        <div className="font-body-semibold text-body-semibold text-text-primary">Chef de Projet RH</div>
                        <div className="font-caption text-caption text-text-muted">Création de poste • Lyon</div>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <div className="font-body-default text-body-default text-text-primary">Sophie Martin</div>
                        <div className="font-caption text-caption text-text-secondary">Pôle RH Corporate</div>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-warning-text font-caption-medium text-caption-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning-amber"></span>
                          <span>À qualifier RH</span>
                        </div>
                        <div className="font-caption text-caption text-danger-red mt-0.5 pl-3 font-medium">Échéance : J-0</div>
                      </td>
                      <td className="py-3 px-space-md text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onNavigate('qualification-rh')}
                          className="h-8 px-space-md bg-primary-container hover:bg-primary-hover text-white font-body-semibold text-body-semibold rounded-lg shadow-sm transition-all"
                        >
                          Qualifier
                        </button>
                      </td>
                    </tr>

                    {/* Row 3 */}
                    <tr className="bg-surface-card hover:bg-bg-canvas transition-colors">
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <button
                          onClick={() => onNavigate('recrutement')}
                          className="font-body-semibold text-body-semibold text-text-primary font-mono text-[13px] hover:text-primary"
                        >
                          CAND-2026-0318
                        </button>
                      </td>
                      <td className="py-3 px-space-md min-w-[200px]">
                        <div className="font-body-semibold text-body-semibold text-text-primary">Julien Vasseur</div>
                        <div className="font-caption text-caption text-text-secondary">DevSecOps • Profil Senior</div>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <div className="font-body-default text-body-default text-text-primary font-mono text-[13px]">OFF-2026-0012</div>
                        <div className="font-caption text-caption text-text-muted">Équipe Plateforme</div>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 font-caption-medium text-caption-medium">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          <span>Note 4.8 / 5</span>
                        </div>
                        <div className="font-caption text-caption text-text-muted mt-0.5">Test technique validé</div>
                      </td>
                      <td className="py-3 px-space-md text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onNavigate('recrutement')}
                          className="h-8 px-space-md bg-surface-card hover:bg-bg-canvas text-text-primary font-body-semibold text-body-semibold rounded-lg shadow-sm border border-border-default transition-all"
                        >
                          Décider
                        </button>
                      </td>
                    </tr>

                    {/* Row 4 */}
                    <tr className="bg-surface-card hover:bg-bg-canvas transition-colors">
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <span className="font-body-semibold text-body-semibold text-text-primary font-mono text-[13px]">
                          OFF-2026-0021
                        </span>
                      </td>
                      <td className="py-3 px-space-md min-w-[200px]">
                        <div className="font-body-semibold text-body-semibold text-text-primary">Sarah Benali</div>
                        <div className="font-caption text-caption text-text-muted">Proposition envoyée (58k €)</div>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <div className="font-body-default text-body-default text-text-primary">Juridique & Finance</div>
                        <div className="font-caption text-caption text-text-secondary">Contrat validé</div>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-caption-medium text-caption-medium">
                          <span className="material-symbols-outlined text-[14px]">outgoing_mail</span>
                          <span>Attente signature</span>
                        </div>
                        <div className="font-caption text-caption text-warning-text mt-0.5 pl-1 tabular-nums">Délai : J-2</div>
                      </td>
                      <td className="py-3 px-space-md text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => alert('Dossier Sarah Benali : Relance automatique envoyée par DocuSign.')}
                          className="h-8 px-space-md bg-surface-card hover:bg-bg-canvas text-text-primary font-body-semibold text-body-semibold rounded-lg shadow-sm border border-border-default transition-all"
                        >
                          Suivre
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table footer link */}
              <div className="p-space-sm bg-bg-canvas flex items-center justify-between text-text-secondary font-caption text-caption">
                <span>Affichage de 4 éléments sur 14 demandes et actions en cours</span>
                <button
                  type="button"
                  onClick={() => onNavigate('mes-demandes')}
                  className="font-caption-medium text-caption-medium text-primary hover:underline flex items-center gap-1"
                >
                  <span>Voir tout le registre des requêtes</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Recruitment Funnel Widget */}
            <div className="bg-surface-card p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">filter_alt</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">Entonnoir de conversion global</h2>
                </div>
                <span className="text-text-muted font-caption text-caption">Campagnes Q4 2026</span>
              </div>

              {/* Graphic Horizontal Funnel Sequence */}
              <div className="grid grid-cols-5 gap-2 pt-2 items-center">
                {/* Stage 1 */}
                <div className="flex flex-col gap-1.5 p-space-sm rounded-lg bg-bg-canvas relative">
                  <div className="flex items-center justify-between text-text-muted font-caption text-[11px] font-medium uppercase tracking-wider">
                    <span>Étape 1</span>
                    <span className="material-symbols-outlined text-[14px]">inbox</span>
                  </div>
                  <div className="font-headline-sm text-headline-sm text-text-primary font-semibold tabular-nums">142</div>
                  <div className="font-caption-medium text-caption-medium text-text-secondary truncate">Reçues</div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-indigo-600 h-full w-full"></div>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="flex flex-col gap-1.5 p-space-sm rounded-lg bg-bg-canvas relative">
                  <div className="flex items-center justify-between text-text-muted font-caption text-[11px] font-medium uppercase tracking-wider">
                    <span className="text-primary font-semibold">31.7%</span>
                    <span className="material-symbols-outlined text-[14px]">fact_check</span>
                  </div>
                  <div className="font-headline-sm text-headline-sm text-text-primary font-semibold tabular-nums">45</div>
                  <div className="font-caption-medium text-caption-medium text-text-secondary truncate">Présélectionnés</div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-indigo-500 h-full w-[32%]"></div>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="flex flex-col gap-1.5 p-space-sm rounded-lg bg-bg-canvas relative">
                  <div className="flex items-center justify-between text-text-muted font-caption text-[11px] font-medium uppercase tracking-wider">
                    <span className="text-primary font-semibold">40.0%</span>
                    <span className="material-symbols-outlined text-[14px]">support_agent</span>
                  </div>
                  <div className="font-headline-sm text-headline-sm text-text-primary font-semibold tabular-nums">18</div>
                  <div className="font-caption-medium text-caption-medium text-text-secondary truncate">Entretiens</div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-indigo-400 h-full w-[13%]"></div>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="flex flex-col gap-1.5 p-space-sm rounded-lg bg-bg-canvas relative">
                  <div className="flex items-center justify-between text-text-muted font-caption text-[11px] font-medium uppercase tracking-wider">
                    <span className="text-primary font-semibold">33.3%</span>
                    <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                  </div>
                  <div className="font-headline-sm text-headline-sm text-text-primary font-semibold tabular-nums">6</div>
                  <div className="font-caption-medium text-caption-medium text-text-secondary truncate">Retenus / Offres</div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-sky-500 h-full w-[4%]"></div>
                  </div>
                </div>

                {/* Stage 5 */}
                <div className="flex flex-col gap-1.5 p-space-sm rounded-lg bg-emerald-50/70 relative">
                  <div className="flex items-center justify-between text-emerald-800 font-caption text-[11px] font-medium uppercase tracking-wider">
                    <span className="text-success-dark font-semibold">66.7%</span>
                    <span className="material-symbols-outlined text-[14px] text-success-emerald">how_to_reg</span>
                  </div>
                  <div className="font-headline-sm text-headline-sm text-success-dark font-semibold tabular-nums">4</div>
                  <div className="font-caption-medium text-caption-medium text-success-dark truncate">Embauchés</div>
                  <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-success-emerald h-full w-[100%]"></div>
                  </div>
                </div>
              </div>

              {/* Conversion footnotes */}
              <div className="flex items-center justify-between pt-space-xs text-text-secondary font-caption text-caption flex-wrap gap-2">
                <div className="flex items-center gap-space-md">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                    Délai moyen d'embauche : <strong className="text-text-primary font-semibold tabular-nums">28 jours</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success-emerald"></span>
                    Taux de concrétisation offre : <strong className="text-text-primary font-semibold tabular-nums">85%</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('recrutement')}
                  className="text-primary font-caption-medium text-caption-medium hover:underline"
                >
                  Rapport d'efficacité →
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL (1/3 width) */}
          <div className="flex flex-col gap-space-lg">
            {/* Quick Shortcuts Bar */}
            <div className="bg-surface-card p-space-md rounded-lg shadow-sm flex flex-col gap-space-sm">
              <span className="font-caption-medium text-caption-medium uppercase tracking-wider text-text-muted px-1">
                Raccourcis Opérations
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigate('nouvelle-demande')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-bg-canvas hover:bg-primary-subtle hover:text-primary transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">post_add</span>
                    <span className="font-body-semibold text-body-semibold text-text-primary group-hover:text-primary">
                      Nouvelle offre d'emploi
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-primary text-[16px]">
                    chevron_right
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onOpenScheduleModal}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-bg-canvas hover:bg-primary-subtle hover:text-primary transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-info-sky text-[20px]">video_call</span>
                    <span className="font-body-semibold text-body-semibold text-text-primary group-hover:text-primary">
                      Planifier un entretien
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-primary text-[16px]">
                    chevron_right
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('recrutement')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-bg-canvas hover:bg-primary-subtle hover:text-primary transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-purple-600 text-[20px]">description</span>
                    <span className="font-body-semibold text-body-semibold text-text-primary group-hover:text-primary">
                      Générer une proposition
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-primary text-[16px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>

            {/* Onboardings Prévus Card */}
            <div className="bg-surface-card p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-purple-600 text-[20px]">flight_land</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">Arrivées & Onboarding</h2>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-caption-medium text-caption-medium">
                  14 prochains jours
                </span>
              </div>

              <div className="flex flex-col gap-space-md">
                {/* Item 1: Thomas Garcia */}
                <div 
                  onClick={() => onNavigate('onboarding')}
                  className="p-space-md rounded-lg bg-bg-canvas flex flex-col gap-space-sm hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-body-semibold text-body-semibold">
                        TG
                      </div>
                      <div>
                        <div className="font-body-semibold text-body-semibold text-text-primary">Thomas Garcia</div>
                        <div className="font-caption text-caption text-text-secondary">DSI • Développeur Fullstack</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-warning-text font-caption-medium text-caption-medium tabular-nums font-semibold">
                      J-5
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-caption text-caption text-text-muted mt-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Arrivée le 03/11/2026
                    </span>
                    <span className="font-medium text-text-primary tabular-nums">8/12 tâches (67%)</span>
                  </div>
                  {/* Checklist Progress Bar */}
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-container h-full rounded-full transition-all duration-500" style={{ width: '67%' }}></div>
                  </div>
                </div>

                {/* Item 2: Amélie Morin */}
                <div 
                  onClick={() => onNavigate('onboarding')}
                  className="p-space-md rounded-lg bg-bg-canvas flex flex-col gap-space-sm hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-primary-container flex items-center justify-center font-body-semibold text-body-semibold">
                        AM
                      </div>
                      <div>
                        <div className="font-body-semibold text-body-semibold text-text-primary">Amélie Morin</div>
                        <div className="font-caption text-caption text-text-secondary">Finance • Responsable Paie</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-bg-canvas text-text-secondary font-caption-medium text-caption-medium tabular-nums">
                      J-12
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-caption text-caption text-text-muted mt-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Arrivée le 10/11/2026
                    </span>
                    <span className="font-medium text-text-primary tabular-nums">4/12 tâches (33%)</span>
                  </div>
                  {/* Checklist Progress Bar */}
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-container h-full rounded-full transition-all duration-500" style={{ width: '33%' }}></div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('onboarding')}
                className="w-full py-2 bg-surface-card hover:bg-bg-canvas text-primary font-caption-medium text-caption-medium rounded-lg text-center transition-colors border border-border-default/60"
              >
                Voir le planning d'intégration complet
              </button>
            </div>

            {/* Audit & Activity Timeline Card */}
            <div className="bg-surface-card p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-text-secondary text-[20px]">history</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">Flux d'activité récent</h2>
                </div>
                <span className="material-symbols-outlined text-text-muted text-[18px] cursor-pointer hover:text-text-primary">
                  refresh
                </span>
              </div>

              {/* Vertical Timeline */}
              <div className="relative pl-6 flex flex-col gap-space-lg">
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-surface-container"></div>

                {/* Activity 1 */}
                <div 
                  onClick={() => onNavigate('validation-finance')}
                  className="relative flex flex-col gap-0.5 cursor-pointer group"
                >
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary-container ring-4 ring-surface-card"></span>
                  <p className="font-body-default text-body-default text-text-primary leading-tight group-hover:text-primary">
                    <strong>Marc L.</strong> a soumis la demande <span className="font-mono text-primary font-medium text-[13px]">REQ-2026-0042</span>
                  </p>
                  <span className="font-caption text-caption text-text-muted">il y a 2h • Portail Manager</span>
                </div>

                {/* Activity 2 */}
                <div className="relative flex flex-col gap-0.5">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-success-emerald ring-4 ring-surface-card"></span>
                  <p className="font-body-default text-body-default text-text-primary leading-tight">
                    <strong>Sarah B.</strong> a signé sa proposition d'embauche
                  </p>
                  <span className="font-caption text-caption text-text-muted">il y a 4h • Signature électronique DocuSign</span>
                </div>

                {/* Activity 3 */}
                <div 
                  onClick={() => onNavigate('recrutement')}
                  className="relative flex flex-col gap-0.5 cursor-pointer group"
                >
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-info-sky ring-4 ring-surface-card"></span>
                  <p className="font-body-default text-body-default text-text-primary leading-tight group-hover:text-primary">
                    Entretien technique validé pour <span className="font-mono text-text-primary font-medium text-[13px]">CAND-2026-0318</span>
                  </p>
                  <span className="font-caption text-caption text-text-muted">hier à 16:45 • Évaluateur : Thomas D.</span>
                </div>
              </div>

              <div className="pt-space-xs text-center">
                <button
                  type="button"
                  onClick={() => onNavigate('approbation-direction')}
                  className="font-caption-medium text-caption-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  Journal d'audit complet (18 événements)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
