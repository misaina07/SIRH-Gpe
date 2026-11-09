import React from 'react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  documentTitle = 'Fiche_Poste_DevSecOps_G5.pdf',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-border-default overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-bg-canvas">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-danger-red flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
            </div>
            <div>
              <h3 className="font-body-semibold text-text-primary text-base flex items-center gap-2">
                <span>{documentTitle}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-success-dark text-[11px] font-semibold">
                  Certifié & Horodaté
                </span>
              </h3>
              <p className="text-xs text-text-muted">
                Fiche descriptive de fonction validée par la Direction des Ressources Humaines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Document Body (Styled as official corporate PDF) */}
        <div className="p-8 overflow-y-auto space-y-6 text-text-primary font-body-default bg-white">
          {/* Header strip inside doc */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">
                DIRECTION DES SYSTÈMES D'INFORMATION · SIRH-REF-2026-G5
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">FICHE DE POSTE & DÉFINITION DE FONCTION</h1>
              <p className="text-sm text-slate-600">Classification Conventionnelle SYNTEC : Grade G5 / Position 3.1</p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <div>Réf: FP-DSI-2026-11</div>
              <div>Statut: Conforme CSE</div>
              <div>Date: 14/10/2026</div>
            </div>
          </div>

          {/* Identification Block */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Intitulé normalisé :</span>
              <p className="font-bold text-slate-900 text-sm">Ingénieur DevSecOps Senior</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Département de rattachement :</span>
              <p className="font-bold text-slate-900 text-sm">Infrastructure Cloud & Sécurité (Code 4100)</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Supérieur hiérarchique :</span>
              <p className="text-slate-900 font-medium">Engineering Manager (Marc Lefebvre)</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Grille de référence salariale :</span>
              <p className="text-slate-900 font-medium">2 500,00 € à 3 500,00 € brut mensuel de base</p>
            </div>
          </div>

          {/* Missions Principales */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              1. Finalité & Missions Principales
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 leading-relaxed">
              <li>
                Assurer la sécurisation « Shift-Left » des pipelines d'intégration et de déploiement continus (CI/CD) sur l'ensemble des clusters Kubernetes.
              </li>
              <li>
                Déployer et administrer les solutions de gestion des secrets d'entreprise (HashiCorp Vault) et de scanning des vulnérabilités (SAST/DAST).
              </li>
              <li>
                Piloter la conformité aux exigences réglementaires NIS 2 et aux audits de certification ISO 27001.
              </li>
              <li>
                Participer à la gouvernance de l'architecture Cloud Souverain multi-régions et former les équipes de développement aux bonnes pratiques SecOps.
              </li>
            </ul>
          </div>

          {/* Compétences Requises */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              2. Compétences Techniques & Expérience
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800 mb-1">Hard Skills Indispensables :</p>
                <p className="text-slate-600">Kubernetes (CKA), Docker, Terraform, GitLab CI, Python/Go, Vault, IAM Cloud (AWS/GCP), SIEM & Falco.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800 mb-1">Expérience & Profil :</p>
                <p className="text-slate-600">Minimum 5 à 7 ans d'expérience en ingénierie Cloud / DevOps avec une spécialisation prouvée en cybersécurité.</p>
              </div>
            </div>
          </div>

          {/* Certification Signature Block */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-success-emerald text-[20px]">verified</span>
              <span>Signature numérique certifiée : <strong>Claire Delorme (Pôle Recrutement RH)</strong></span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              SHA256: e8f9...3b12 | Horodatage CSE 14/10/2026 09:12
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3 border-t border-border-default bg-bg-canvas flex items-center justify-between">
          <span className="text-xs text-text-muted">Document confidentiel réservé à la commission de recrutement.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert('Téléchargement du document initié.');
              }}
              className="h-8 px-3 rounded-lg border border-border-default bg-white text-text-primary text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Télécharger PDF
            </button>
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
