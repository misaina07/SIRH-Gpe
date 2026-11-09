# 📘 Guide Complet & Documentation Technique Front-End : Portail SIRH Entreprise

> **Bienvenue dans la documentation officielle du portail SIRH Entreprise.**  
> Ce document est conçu à la fois comme une **explication exhaustive du code source front-end** pour les développeurs et comme un **guide pas à pas illustré pour les utilisateurs débutants**.

---

## 📑 Sommaire
1. [Vue d'Ensemble & Objectifs du Système](#1-vue-densemble--objectifs-du-système)
2. [Architecture Technique Front-End](#2-architecture-technique-front-end)
3. [Arborescence Détaillée du Projet](#3-arborescence-détaillée-du-projet)
4. [Modèle de Données & Typage TypeScript (`src/types/sirh.ts`)](#4-modèle-de-données--typage-typescript)
5. [Données Simulées & Métier (`src/data/mockData.ts`)](#5-données-simulées--métier)
6. [Point d'Entrée & Chef d'Orchestre (`src/App.tsx`)](#6-point-dentrée--chef-dorchestre-srcapptsx)
7. [Composants Réutilisables (`src/components/`)](#7-composants-réutilisables)
   - [7.1 En-tête Global (`Header.tsx`)](#71-en-tête-global-headertsx)
   - [7.2 Barre Latérale & Sécurité (`Sidebar.tsx`)](#72-barre-latérale--sécurité-sidebartsx)
   - [7.3 Menu Déroulant des Postes par Département (`DepartmentPositionsDropdown.tsx`)](#73-menu-déroulant-des-postes-par-département)
   - [7.4 Garde de Sécurité 403 (`AccessDeniedView.tsx`)](#74-garde-de-sécurité-403)
   - [7.5 Fenêtres Modales : Documents, Entretiens, Recherche rapide](#75-fenêtres-modales)
8. [Vues & Écrans Métier (`src/views/`)](#8-vues--écrans-métier)
   - [8.1 Page de Connexion & Historique des Logins (`LoginView.tsx`)](#81-page-de-connexion--historique-des-logins)
   - [8.2 Tableau de Bord Général (`DashboardView.tsx`)](#82-tableau-de-bord-général)
   - [8.3 Registre avec Maximum de Filtres (`DemandesListView.tsx`)](#83-registre-avec-maximum-de-filtres)
   - [8.4 Création de Poste par le Manager (`NewRequisitionView.tsx`)](#84-création-de-poste-par-le-manager)
   - [8.5 Qualification RH & Impartialité CSE (`HrQualificationView.tsx`)](#85-qualification-rh--impartialité-cse)
   - [8.6 Évaluation & Arbitrage Finance (`FinanceValidationView.tsx`)](#86-évaluation--arbitrage-finance)
   - [8.7 Approbation Finale Direction (`ExecutiveApprovalView.tsx`)](#87-approbation-finale-direction)
   - [8.8 Vivier Candidats & Kanban (`RecruitmentKanbanView.tsx`)](#88-vivier-candidats--kanban)
   - [8.9 Onboarding & Référentiels Admin](#89-onboarding--référentiels-admin)
9. [Guide Utilisateur Débutant Pas à Pas](#9-guide-utilisateur-débutant-pas-à-pas)
10. [Règles de Sécurité, Gouvernance & Séparation des Pouvoirs](#10-règles-de-sécurité-gouvernance--séparation-des-pouvoirs)
11. [Commandes de Développement & Guide Dépanneur](#11-commandes-de-développement--guide-dépanneur)

---

## 1. Vue d'Ensemble & Objectifs du Système

Le **Portail SIRH Entreprise** est une application web monopage (SPA) de gestion des ressources humaines et de gouvernance du recrutement. Elle couvre l'intégralité du cycle de vie d'un besoin de recrutement au sein d'une organisation d'envergure :

```
[1. Manager]             [2. Pôle RH]             [3. Contrôle Finance]         [4. Direction Générale]
Saisie du besoin         Qualification             Arbitrage budgétaire          Signature finale
Choix du département     Vérification du grade     Dérogation autorisée          Publication de l'offre
    │                         │                             │                             │
    └─────────────────────────┴─────────────────────────────┴─────────────────────────────┘
                                           ▼
                             [5. Pipeline Candidats]
                             Tableau Kanban Recrutement
```

### Principes Fondamentaux Respectés dans l'Application :
1. **Séparation stricte des pouvoirs (Norme CSE & Audit Interne)** : Un manager qui exprime un besoin ne peut jamais être celui qui valide la conformité RH ou débloque le budget.
2. **Managers multi-départements** : Un manager peut superviser plusieurs départements (ex: *Marc Lefebvre* supervise 3 départements techniques : Infra Cloud, Cyber-Sécurité et Architecture Logicielle).
3. **Mémorisation sécurisée des connexions** : Sur la page de login, un historique déroulant retient les comptes utilisés récemment, **sans jamais stocker ni pré-remplir les mots de passe** pour préserver la confidentialité.
4. **Lisibilité maximale & Filtres avancés** : Panneau de filtrage multi-critères, 3 modes d'affichage (Tableau, Cartes, Vue groupée par département), indicateurs KPI en temps réel et menu déroulant complet des postes vacants.

---

## 2. Architecture Technique Front-End

- **Framework Web** : [React 19](https://react.dev/) avec architecture modulaire basée sur les composants fonctionnels et les hooks (`useState`, `useEffect`, `useMemo`, `useRef`).
- **Outil de Build & Serveur de Dev** : [Vite 8](https://vitejs.dev/) avec support TypeScript natif ultra-rapide.
- **Typage Statique** : [TypeScript 7](https://www.typescriptlang.org/) configuré en mode strict pour garantir zéro régression d'exécution.
- **Styling & Design System** : [Tailwind CSS 4](https://tailwindcss.com/) utilisant l'import moderne `@import "tailwindcss";` dans `src/index.css`.
- **Iconographie** : [Google Material Symbols Outlined](https://fonts.google.com/icons) pour une cohérence visuelle parfaite.
- **Gestion de l'État & Persistance** :
  - État réactif local piloté par le composant racine `src/App.tsx`.
  - Persistance de la session et des identifiants mémorisés dans le `localStorage` du navigateur (`sirh_auth`, `sirh_user_id`, `sirh_saved_login_emails`).

---

## 3. Arborescence Détaillée du Projet

Voici l'organisation complète des dossiers et fichiers de l'application :

```
/
├── index.html                      # Page HTML racine avec polices et balises SEO
├── package.json                    # Dépendances npm et scripts de build
├── tsconfig.json                   # Configuration du compilateur TypeScript
├── vite.config.ts                  # Configuration de Vite et Tailwind
├── public/
│   └── assets/                     # Logos, maquettes et images statiques
├── src/
│   ├── main.tsx                    # Point d'entrée de montage React 19
│   ├── index.css                   # Styles globaux et importation Tailwind CSS 4
│   ├── App.tsx                     # Chef d'orchestre de l'application (Auth & Routing)
│   ├── types/
│   │   └── sirh.ts                 # Définitions de types TypeScript (Profil, Requisition, Dept...)
│   ├── data/
│   │   └── mockData.ts             # Données de simulation (Personas, Postes, Candidats...)
│   ├── components/                 # Éléments d'interface utilisateur réutilisables
│   │   ├── Header.tsx              # Barre de navigation supérieure
│   │   ├── Sidebar.tsx             # Menu latéral avec contrôle d'accès visuel
│   │   ├── DepartmentPositionsDropdown.tsx # Menu déroulant des postes par département
│   │   ├── AccessDeniedView.tsx    # Écran d'erreur 403 (Accès interdit)
│   │   ├── DocumentModal.tsx       # Visionneuse de document PDF officiel
│   │   ├── ScheduleInterviewModal.tsx # Planificateur de rendez-vous candidat
│   │   └── SearchModal.tsx         # Recherche universelle (Cmd+K)
│   └── views/                      # Écrans et pages principales de l'application
│       ├── LoginView.tsx           # Page de connexion avec historique des emails
│       ├── DashboardView.tsx       # Tableau de bord avec indicateurs de pilotage
│       ├── DemandesListView.tsx    # Registre des demandes avec panneau de super-filtres
│       ├── NewRequisitionView.tsx  # Formulaire de création de poste (Manager)
│       ├── HrQualificationView.tsx # Étape 2 : Qualification par les RH
│       ├── FinanceValidationView.tsx # Étape 3 : Arbitrage budgétaire Finance
│       ├── ExecutiveApprovalView.tsx # Étape 4 : Signature finale Direction
│       ├── RecruitmentKanbanView.tsx # Tableau Kanban des candidatures
│       ├── OnboardingView.tsx      # Suivi d'intégration des nouveaux arrivants
│       └── ReferentielsAdminView.tsx # Barèmes de salaires et conventions
└── TODO/
    └── todo.md                     # Le présent fichier d'explication et guide
```

---

## 4. Modèle de Données & Typage TypeScript

Le fichier `src/types/sirh.ts` centralise tous les contrats d'interface de l'application. Voici les principaux types et leur rôle :

### A. Rôles et Profil Utilisateur (`UserProfile`)
```typescript
export type UserRole = 'RH' | 'Manager' | 'Finance' | 'Direction';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  roleType: UserRole;
  email: string;
  avatar: string;
  initials: string;
  department: string;
  managedDepartmentIds?: string[];      // Liste des IDs des départements supervisés
  managedDepartmentNames?: string[];    // Noms lisibles des départements supervisés
  password?: string;
  description?: string;
  allowedViews: ViewMode[];             // Pages autorisées pour ce rôle
  canValidateRH?: boolean;              // Droit d'approuver l'étape 2 (RH)
  canValidateFinance?: boolean;         // Droit d'approuver l'étape 3 (Finance)
  canValidateDirection?: boolean;       // Droit d'approuver l'étape 4 (Direction)
  canCreateRequisition?: boolean;       // Droit d'ouvrir une demande
  canManageCandidates?: boolean;        // Droit d'avancer un candidat dans le Kanban
}
```

### B. Départements & Postes Vacants (`Department`, `AvailablePosition`)
```typescript
export interface AvailablePosition {
  id: string;
  title: string;                        // Ex: "Ingénieur DevSecOps Senior"
  departmentId: string;                 // Ex: "dept-dsi-cloud"
  departmentName: string;
  departmentCode: string;               // Ex: "DSI-4100"
  grade: string;                        // Ex: "G5"
  contractType: string;                 // Ex: "CDI — Cadre"
  status: 'ouvert' | 'en_validation' | 'pourvu' | 'brouillon';
  salaryMin: number;
  salaryMax: number;
  salaryRange: string;                  // Ex: "3 000 € – 3 600 € / mois"
  fte: number;                          // Équivalent Temps Plein (1.0 ETP)
  priority: 'urgente' | 'normale' | 'basse';
  managerId: string;
  managerName: string;                  // Ex: "Marc Lefebvre"
  managerEmail: string;
  location: string;                     // Ex: "Paris (Hybride)"
  targetDate: string;
  skills?: string[];                    // Ex: ["Kubernetes", "Terraform", "Vault"]
}

export interface Department {
  id: string;
  code: string;
  name: string;
  shortName: string;
  category: 'Technique' | 'Finance' | 'RH' | 'Direction' | 'Opérations' | 'Marketing';
  primaryManagerId: string;
  primaryManagerName: string;
  primaryManagerRole: string;
  allocatedBudgetAnnual: number;
  consumedBudgetAnnual: number;
  headcountCurrent: number;
  headcountTarget: number;
  openPositionsCount: number;
  positions: AvailablePosition[];
}
```

### C. Historique des Identifiants Mémorisés (`SavedLoginEmail`)
```typescript
export interface SavedLoginEmail {
  email: string;
  name: string;
  role: string;
  roleType: UserRole;
  avatar?: string;
  department?: string;
  lastLoginAt?: string;                 // Date/heure indicative de dernière connexion
}
```
> **Remarque importante de sécurité** : L'interface `SavedLoginEmail` ne contient **aucun champ mot de passe**. Les mots de passe ne sont jamais sauvegardés dans le stockage local.

---

## 5. Données Simulées & Métier (`src/data/mockData.ts`)

Ce fichier injecte une simulation d'entreprise complète et cohérente :

### Les 4 Personas Utilisateurs Préconfigurés :
| Nom | Rôle affiché | Type de rôle | Email | Mot de passe | Responsabilité particulière |
|---|---|---|---|---|---|
| **Claire Delorme** | Responsable RH & Recrutement | `RH` | `c.delorme@entreprise.fr` | `rh` | Supervise le vivier, qualifie les fiches de poste, gère 2 départements RH. |
| **Marc Lefebvre** | Engineering Manager | `Manager` | `m.lefebvre@entreprise.fr` | `manager` | **Responsable de 3 départements** : Infra Cloud (4100), Cyber-Sécurité (4120) et Archi Platform (4200). Saisit les besoins techniques. |
| **Gilles Vaudon** | Contrôleur de Gestion DSI | `Finance` | `g.vaudon@entreprise.fr` | `finance` | Arbitre les dépassements budgétaires, autorise les dérogations salariales. |
| **Direction Générale** | Direction Exécutive & CODIR | `Direction` | `direction@entreprise.fr` | `codir` | Signataire légal final, autorise la publication officielle des postes. |

### Les 6 Départements Opérationnels :
1. **DSI · Infrastructure Cloud & DevOps (DSI-4100)** — Géré par Marc Lefebvre (Budget 420 k€).
2. **DSI · Cyber-Sécurité & Conformité NIS2 (DSI-4120)** — Géré par Marc Lefebvre (Budget 280 k€).
3. **DSI · Architecture & Core Platform (DSI-4200)** — Géré par Marc Lefebvre (Budget 350 k€).
4. **Direction RH · Recrutement & Talents (DRH-1200)** — Géré par Claire Delorme (Budget 240 k€).
5. **Contrôle de Gestion & Arbitrage (DFIN-2100)** — Géré par Gilles Vaudon (Budget 190 k€).
6. **DSI · Data Platform & IA Générative (DSI-4300)** — Géré par Laurent Fabre (Budget 310 k€).

---

## 6. Point d'Entrée & Chef d'Orchestre (`src/App.tsx`)

Le fichier `src/App.tsx` est le composant central qui gère l'état global et la logique de navigation :

### Fonctionnalités Clés gérées par `App.tsx` :
1. **Contrôle d'Authentification** :
   - Vérifie si l'utilisateur est authentifié (`isAuthenticated`).
   - Si l'utilisateur n'est pas connecté, il affiche automatiquement la page de connexion `<LoginView />`.
   - Mémorise la session dans `localStorage` (`sirh_auth` et `sirh_user_id`).
2. **Garde de Sécurité des Vues (Gouvernance RBAC)** :
   - Chaque profil utilisateur possède une liste `allowedViews`.
   - Si un utilisateur tente d'accéder à une vue non autorisée (par exemple un manager essayant de valider l'étape Finance), `App.tsx` intercepte la demande et affiche `<AccessDeniedView />` (écran 403 explicatif).
3. **Routage Dynamique SPA** :
   - Alterne entre les différentes vues sans aucun rechargement de page (`tableau-de-bord`, `mes-demandes`, `nouvelle-demande`, `recrutement`, `qualification-rh`, `validation-finance`, `approbation-direction`, `onboarding`, `referentiels-admin`).
4. **Système de Toast Notifications** :
   - Affiche des notifications flottantes en bas à droite pour confirmer les actions (connexion réussie, entretiens planifiés, changements de profil).
5. **Raccourci Clavier Global `Cmd+K` / `Ctrl+K`** :
   - Un écouteur d'événement global ouvre instantanément la boîte de recherche rapide.

---

## 7. Composants Réutilisables (`src/components/`)

### 7.1 En-tête Global (`Header.tsx`)
- **Fil d'Ariane dynamique** : Indique clairement la page courante (`Portail SIRH > Registre des demandes`).
- **Barre de recherche rapide** : Clic ou raccourci `Cmd+K` pour ouvrir le moteur universel.
- **Bouton « Postes par Département »** : Ouvre le menu déroulant interactif des postes.
- **Badge d'alerte multi-départements** : Affiche par exemple `3 dpts supervisés` lorsque Marc Lefebvre est connecté.
- **Indicateur de SLA** : Badge vert pulsant indiquant la conformité des délais de recrutement (98.4%).
- **Menu Profil** : Affiche l'utilisateur connecté, son département, son rôle, un commutateur rapide de simulation de compte, et le bouton de déconnexion.

### 7.2 Barre Latérale & Sécurité (`Sidebar.tsx`)
- Menu de navigation persistant sur la gauche de l'écran.
- **Cadenas visuel 🔒** sur les liens non autorisés pour le rôle actif (ex: cadenas sur la validation financière quand on est connecté en tant que RH ou Manager).
- **Badge de rôle en haut** (`RH`, `MANAGER`, `FINANCE`, `DIRECTION`).
- **Cartouche multi-départements en bas** : Si le manager gère plusieurs départements, la barre liste les entités dont il a la charge.
- **Bouton de déconnexion direct**.

### 7.3 Menu Déroulant des Postes par Département (`DepartmentPositionsDropdown.tsx`)
Ce composant offre une expérience utilisateur premium pour trouver et consulter les postes disponibles :
- **Barre de recherche interne** (titre, technologie, ville).
- **Filtre par département** avec le nombre de postes par entité.
- **Filtre par manager** (mettant en valeur les managers multi-départements).
- **Boutons de statut** : *Tous*, *Ouvert au recrutement*, *En validation*, *Pourvu*.
- **Cartouche d'analyse départementale** : Dès qu'un département est sélectionné, affiche l'effectif actuel/cible et le budget annuel alloué.
- **Bouton « Examiner » sur chaque ligne** : Redirige directement vers l'étape adéquate du workflow.

### 7.4 Garde de Sécurité 403 (`AccessDeniedView.tsx`)
- Écran élégant affiché lorsqu'une règle de sécurité ou de séparation des pouvoirs est violée.
- Explique en détail :
  - Quel rôle était exigé pour cette page.
  - Quel est le rôle actuel de l'utilisateur.
  - Le motif réglementaire (ex: Norme CSE, non-cumul ordonnateur-payeur).
  - Propose des boutons pour revenir au tableau de bord ou changer de compte.

### 7.5 Fenêtres Modales
- **`DocumentModal.tsx`** : Affiche une réplique de la fiche de poste officielle au format PDF d'entreprise avec les compétences NIS2, l'impact budgétaire et le visa RH.
- **`ScheduleInterviewModal.tsx`** : Permet de choisir un candidat, de définir la date, l'heure et le type d'entretien (RH, Technique, Cadrage Manager), avec génération automatique de l'invitation.
- **`SearchModal.tsx`** : Palette de commande type Spotlight/Raycast permettant de naviguer instantanément dans toute l'application.

---

## 8. Vues & Écrans Métier (`src/views/`)

### 8.1 Page de Connexion & Historique des Logins (`LoginView.tsx`)
- **Menu déroulant des identifiants mémorisés** :
  - Liste les adresses e-mail des comptes récemment utilisés sur la machine.
  - **Ne stocke aucun mot de passe** : le clic sur un compte préremplit l'email, vide le mot de passe et place le curseur dans le champ mot de passe avec une mention explicative.
  - Permet d'effacer une adresse de l'historique d'un simple clic sur la croix `✕`.
- **Cartes d'Accès Rapide par Rôle (RBAC)** :
  - Sur la colonne de droite, 4 cartes interactives permettent de se connecter en un clic pour tester instantanément les 4 personas (`Claire Delorme`, `Marc Lefebvre`, `Gilles Vaudon`, `Direction Générale`).
  - Chaque carte affiche les départements supervisés et un rappel des règles de gouvernance.

### 8.2 Tableau de Bord Général (`DashboardView.tsx`)
- Salutation personnalisée avec le nom et le département de l'utilisateur actif.
- 4 cartes métriques clés (Demandes à qualifier, Recrutements actifs, Offres publiées, Entrées prévues).
- Actions rapides pour créer une réquisition ou planifier un entretien.
- Raccourci vers le menu déroulant des postes par département.

### 8.3 Registre avec Maximum de Filtres (`DemandesListView.tsx`)
C'est le centre de contrôle opérationnel des réquisitions avec une ergonomie pensée pour une lisibilité maximale :
- **Bandeau de KPIs en temps réel** :
  - *Total Demandes*
  - *Vue Marc Lefebvre (3 départements gérés)*
  - *En arbitrage Finance & RH*
  - *Besoins Urgents*
  - *Offres Publiées*
- **Panneau de Super-Filtres** :
  1. *Recherche plein texte* (code REQ, titre, technologie, demandeur, ville).
  2. *Département* (DSI Cloud, DSI Cyber NIS2, DSI Archi, RH, Finance, Data).
  3. *Manager responsable* (filtrage nominatif).
  4. *Statut du workflow* (Brouillon, Qualification RH, Arbitrage Finance, Visa Direction, Publiée).
  5. *Priorité* (🔴 Urgente NIS2 vs ⚪ Normale).
  6. *Type de contrat* (CDI Cadre, CDD).
  7. *Tranche de rémunération* (< 3 200 €, 3 200 € – 3 700 €, > 3 700 €).
  8. *Conformité budgétaire* (Dans la grille, Tolérance 10%, Dépassement).
- **3 Modes d'Affichage** :
  - **Mode Tableau (Défaut)** : Grille dense avec stepper d'avancement 1-2-3-4 pour chaque ligne, salaires, budgets chargés et actions directes.
  - **Mode Cartes** : Fiches visuelles avec jauge de progression et détails financiers.
  - **Mode Groupé par Département** : Regroupe les demandes par département avec un bandeau mettant en valeur le manager responsable de chaque entité.

### 8.4 Création de Poste par le Manager (`NewRequisitionView.tsx`)
- Écran utilisé par le manager demandeur (ex: Marc Lefebvre).
- **Sélecteur de département supervisé** : Permet de choisir pour quel département le poste est ouvert (Infra Cloud, Cyber NIS2 ou Archi Platform).
- **Jauge salariale comparative interactive** :
  - Compare en temps réel le salaire demandé (min / max) avec le plafond départemental (3 400 €) et la grille du grade G5 (2 500 € – 3 500 €).
  - Détecte automatiquement les dépassements et active la zone d'alerte jaune/ambre pour dérogation future.
- **Calculateur de coût employeur (40% de charges patronales)** : Affiche immédiatement le coût annuel total pour l'entreprise (ex: 60 480 €).

### 8.5 Qualification RH & Impartialité CSE (`HrQualificationView.tsx`)
- Étape 2 du circuit d'approbation.
- **Règle d'impartialité CSE** :
  - Si l'utilisateur connecté est le demandeur (*Marc Lefebvre*) ou n'a pas le rôle RH, **les boutons de validation et de rejet sont verrouillés**, et un bandeau d'alerte officiel s'affiche :
    > *« Contrôle d'impartialité & Séparation des pouvoirs (Norme CSE) : En tant que demandeur de ce besoin (Marc Lefebvre - DSI), les règles de gouvernance interne vous interdisent de qualifier votre propre réquisition de poste. Seul le service RH (Claire Delorme) peut instruire cette étape. »*
- Si connecté en tant que Claire Delorme (RH) :
  - Vérification de la fiche de poste, confirmation du rattachement au Grade G5 et saisie des observations obligatoires.
  - Transmission en 1 clic vers le Contrôle de Gestion (Finance).

### 8.6 Évaluation & Arbitrage Finance (`FinanceValidationView.tsx`)
- Étape 3 du circuit d'approbation.
- Réservé au Contrôle de Gestion (*Gilles Vaudon*) ou à la Direction.
- Analyse le dépassement budgétaire de 480 € annuel (+100 € mensuel au-delà du plafond standard).
- Permet de consigner le motif de dérogation officielle (tension sur le profil DevSecOps NIS2) et de débloquer les fonds réservés de 60 480 €.

### 8.7 Approbation Finale Direction (`ExecutiveApprovalView.tsx`)
- Étape 4 du circuit d'approbation.
- Réservé exclusivement à la **Direction Générale** (Membre CODIR).
- Présente la synthèse exécutive complète avec l'historique immuable des visas (Manager → RH → Finance).
- Signature électronique exécutive qui bascule le poste au statut `publiée` et ouvre la campagne de recrutement dans le vivier candidats.

### 8.8 Vivier Candidats & Kanban (`RecruitmentKanbanView.tsx`)
- Tableau Kanban à 5 colonnes :
  1. **Candidatures Reçues** (ex: Alexandre Leroy, Maxime Dubois).
  2. **Présélectionnés** (ex: Sarah Rousseau, Karim Haddad).
  3. **Entretiens en cours** (ex: Julien Vasseur avec alerte SLA J-1).
  4. **Retenus pour offre** (ex: Elena Kova avec proposition de contrat).
  5. **Non retenus / Refusés** (avec motif officiel de refus).
- Fonctionnalités :
  - Changement d'étape en un clic.
  - Planification d'entretien avec invitation.
  - Affichage des scores, compétences et prétentions salariales.

---

## 9. Guide Utilisateur Débutant Pas à Pas

Vous découvrez l'application pour la première fois ? Suivez ce tutoriel guidé pour maîtriser tous les fonctionnements :

### Étape 1 : Se Connecter à l'Application
1. Rendez-vous sur la page de connexion.
2. Pour tester facilement, regardez la colonne de droite **« Accès Rapide par Rôle (RBAC) »**.
3. Cliquez sur la carte de **Marc Lefebvre** (Engineering Manager).
4. Vous êtes immédiatement connecté et redirigé vers le tableau de bord avec les droits Manager.

### Étape 2 : Tester l'Historique des Identifiants Mémorisés (Sans Mot de Passe)
1. Cliquez sur le bouton **« Se déconnecter »** dans le menu latéral gauche.
2. De retour sur la page de connexion, cliquez sur le champ déroulant **« Historique des identifiants mémorisés »**.
3. Choisissez par exemple **Claire Delorme**.
4. Remarquez que son adresse e-mail est automatiquement renseignée, mais que **le mot de passe reste vide** pour des raisons de sécurité.
5. Saisissez le mot de passe `rh` et cliquez sur **« Se connecter au portail »**.

### Étape 3 : Trouver les Postes Disponibles par Département
1. Dans l'en-tête en haut à droite, cliquez sur le bouton **« Postes par Département »**.
2. Une fenêtre déroulante détaillée s'ouvre.
3. Testez les filtres :
   - Sélectionnez le département **« DSI · Infrastructure Cloud & DevOps »** pour voir ses 3 postes.
   - Sélectionnez le manager **« Marc Lefebvre »** : remarquez le badge indiquant qu'il supervise 3 départements.
4. Cliquez sur **« Examiner »** en face d'un poste pour vous rendre directement sur sa fiche.

### Étape 4 : Utiliser le Maximum de Filtres sur le Registre des Demandes
1. Dans le menu de gauche, cliquez sur **« Mes demandes »** (ou utilisez la barre supérieure).
2. Vous arrivez sur le **Registre des demandes**.
3. Testez les raccourcis en un clic (les cartes en haut) :
   - Cliquez sur **« Marc Lefebvre »** : la liste se filtre instantanément sur les demandes rattachées à ses 3 départements.
   - Cliquez sur **« En Arbitrage »** : affiche uniquement les dossiers nécessitant une validation RH ou Finance.
   - Cliquez sur **« Besoins Urgents »** : isole les demandes à priorité haute.
4. Dans le panneau de filtres, combinez plusieurs critères (ex: Département + Tranche salariale).
5. Changez le mode d'affichage avec les 3 icônes à droite :
   - 📊 **Tableau** : pour tout voir en détail.
   - 🗂️ **Cartes** : pour une vue visuelle.
   - 🏢 **Groupé par Département** : pour visualiser l'organisation hiérarchique et le budget de chaque entité.

### Étape 5 : Vivre le Workflow Complet de Recrutement
1. **Création (Marc Lefebvre)** : Cliquez sur **« Créer un poste »**, choisissez le département concerné et ajustez la fourchette salariale.
2. **Qualification RH (Claire Delorme)** :
   - Si vous êtes connecté en tant que Marc, essayez d'ouvrir `REQ-2026-0042` sur l'étape RH : observez le cadenas et l'alerte d'impartialité.
   - Basculez sur **Claire Delorme** (via le menu profil en haut à droite) : les boutons d'approbation deviennent actifs !
   - Cliquez sur **« Valider et transmettre à la Finance »**.
3. **Arbitrage Finance (Gilles Vaudon)** :
   - Basculez sur **Gilles Vaudon** : observez le calcul de dérogation salariale et cliquez sur **« Valider le déblocage des fonds »**.
4. **Signature Direction (Direction Générale)** :
   - Basculez sur **Direction Générale** : examinez le dossier et cliquez sur **« Approuver et signer électroniquement »**.
   - Le poste est officiellement publié et bascule dans le Kanban de recrutement !

---

## 10. Règles de Sécurité, Gouvernance & Séparation des Pouvoirs

Le système intègre nativement des garde-fous stricts conformes aux audits internes :

| Principe de Contrôle | Règle Métier | Implémentation Front-End |
|---|---|---|
| **Contrôle d'impartialité (Norme CSE)** | Le demandeur d'un poste ne peut pas instruire le visa RH de son propre besoin. | Verrouillage automatique des boutons avec badge *« Contrôle d'impartialité CSE »* dans `HrQualificationView.tsx`. |
| **Séparation Ordonnateur / Payeur** | Seul le Contrôle de Gestion ou la Direction Financière peut valider un dépassement de budget. | Restriction dans `FinanceValidationView.tsx` avec alerte pour les autres rôles. |
| **Délégation de Signature Direction** | La publication d'une offre engageant juridiquement l'entreprise requiert la signature CODIR. | Restriction stricte dans `ExecutiveApprovalView.tsx` réservée au rôle `Direction`. |
| **Écran de Blocage 403 (RBAC)** | Tentative d'accès manuel à une URL ou vue non autorisée. | Interception globale par `App.tsx` et affichage du composant `AccessDeniedView.tsx`. |
| **Zéro Mémorisation de Mot de Passe** | Aucun mot de passe ne doit être conservé dans le cache local du navigateur. | Le module d'historique de `LoginView.tsx` ne stocke que le nom, l'email et le rôle. |

---

## 11. Commandes de Développement & Guide Dépanneur

### Commandes Utiles :
```bash
# Lancer le serveur de développement local (Port 3000)
npm run dev

# Compiler et vérifier l'absence d'erreurs TypeScript
npm run build

# Valider la conformité du code et le typage strict
npm run lint
```

### Questions Fréquentes (FAQ Débutant) :

**Q1 : Pourquoi certains boutons affichent-ils une icône de cadenas 🔒 ?**  
> *Réponse* : Cela signifie que votre compte actuel ne possède pas l'habilitation requise pour cette action (principe de sécurité RBAC). Utilisez le menu profil en haut à droite pour basculer sur le rôle autorisé.

**Q2 : Où sont stockées les données quand je modifie un filtre ou un statut ?**  
> *Réponse* : L'application fonctionne en mémoire dynamique côté client (React state) avec sauvegarde des préférences de session dans le `localStorage` de votre navigateur.

**Q3 : Comment un manager peut-il voir tous ses départements ?**  
> *Réponse* : Rendez-vous sur le Registre des demandes (`Mes demandes`) et cliquez sur le raccourci **« Marc Lefebvre »** ou utilisez le menu déroulant **« Postes par Département »**.

---

*Documentation générée pour le Portail SIRH Entreprise — Système d'Information des Ressources Humaines & Arbitrage Budgétaire.*
