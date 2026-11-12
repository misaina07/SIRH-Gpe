# 🚀 Feuille de Route & Spécifications Techniques : TODO_ASA (Blocs 5, 6 & 7)

> **Projet :** SIRH Entreprise — Extension des Modules Opérationnels  
> **Source :** Spécifications de cadrage (Bloc 5 : Dossier Salarié, Bloc 6 : Temps de Travail & Pointage, Bloc 7 : Congés & Absences)  
> **Organisation d'Équipe :** 5 Développeurs (MISAINA, MIARANTSOA, MIRADO, DYLAN, TONTON)  
> **Stratégie de travail visée :** Découpage modulaire anti-conflits par branches feature. L’architecture applicative réellement présente dans le dépôt est décrite dans la section « Mise en situation avec l’architecture actuelle du dépôt ».

---

## Mise en situation avec l’architecture actuelle du dépôt

**État observé le 12 novembre 2026.** Cette section décrit le socle existant pour préparer les blocs 5, 6 et 7. Elle ne signifie pas que ces blocs sont implémentés et ne remplace pas leurs exigences détaillées plus bas.

### Architecture réellement en place

```text
React 19 + TypeScript + Vite (racine du dépôt)
  src/views, src/components, src/types/sirh.ts
  src/services/api.ts  ── HTTP / JSON + jeton Bearer
                  │
                  ▼
Spring Boot / Java 21 (backend/)
  config → security → controller → service
  AuthController, DirectoryController
  JdbcTemplate vers PostgreSQL
                  │
                  ▼
PostgreSQL `sirh`
  src/data/schema-possible.sql
  src/data/02-test-data.sql
```

- Le backend est organisé par couches sous `backend/src/main/java/com/example/sirh/` : `config`, `security`, `controller`, `dto`, `service` et `exception`.
- La persistance actuellement utilisée par les services est `JdbcTemplate`. La dépendance Spring Data JPA est présente, mais le projet ne contient pas encore d’entités JPA ni de repositories. Ne pas décrire le code courant comme une architecture JPA ou « Clean Architecture » déjà réalisée.
- Les endpoints actuels couvrent l’authentification, la lecture des utilisateurs/départements/postes/demandes/candidats/onboarding, les décisions du workflow de recrutement, l’historique et les indicateurs de dashboard. Ils constituent le socle partagé sur lequel les futurs blocs pourront s’appuyer.
- Le client React commun est `src/services/api.ts`. Les vues des blocs 5–7 (dossier salarié, pointage et congés) ne sont pas présentes dans l’arborescence actuelle. Ne pas les considérer comme développées parce que des tables portant ces noms existent dans PostgreSQL.
- Les valeurs de démonstration d’authentification sont activables uniquement en local par variables d’environnement. Le secret JWT et les paramètres PostgreSQL sont configurables hors du code source.

Les routes actuellement exposées se trouvent surtout dans `AuthController` et `DirectoryController` :

- Authentification : `POST /api/auth/login`, `GET /api/auth/me`.
- Lecture : `/api/users`, `/api/departments`, `/api/positions`, `/api/requisitions`, `/api/candidates`, `/api/onboarding`, `/api/dashboard` et `/api/dashboard/summary`.
- Workflow recrutement : création/soumission/correction d’une demande, validation RH, validation Finance, approbation Direction, détail et historique.
- Kanban : lecture du candidat et `PATCH /api/candidates/{id}/stage` avec contrôle de transition et motif obligatoire pour un refus.
- Aucune API d’entretien persisté, de modification des tâches onboarding, de dossier salarié, de pointage ou de congé n’est définie actuellement.

### Correspondance des chemins mentionnés dans les spécifications

Les chemins historiques de ce TODO décrivent parfois des services TypeScript côté backend. Dans ce dépôt, la logique serveur doit suivre Java/Spring Boot; React ne garde que l’interface et les appels HTTP.

| Chemin ou nom cité dans le cadrage | Emplacement à utiliser dans ce dépôt pour une future implémentation |
|---|---|
| `src/services/employeeService.ts`, `timeTrackingService.ts`, `leaveService.ts` | Services Java sous `backend/src/main/java/com/example/sirh/service/`, avec contrôleurs et DTO dans les packages existants |
| `src/services/api.ts` | Client HTTP React existant; ajouter ici les appels API frontend sans y placer les règles métier |
| `src/types/employee.ts`, `timeTracking.ts`, `leaves.ts` | Types d’interface à créer sous `src/types/` uniquement pour les données affichées/échangées par React |
| `src/middleware/rbacGuard.ts` | Les autorisations serveur doivent être appliquées dans Spring Security et les services backend; un contrôle React ne remplace jamais cette vérification |
| `src/db/schema.sql` | Les schémas existants sont sous `src/data/`; choisir et configurer une stratégie de migration avant d’ajouter le DDL cible |
| `src/views/EmployeeProfileView.tsx`, `TimeTrackingView.tsx`, `LeaveManagementView.tsx` | Écrans futurs sous `src/views/`; aucun de ces écrans n’existe actuellement |

### Écart à résoudre avant toute implémentation des blocs 5–7

Le modèle SQL détaillé proposé dans ce document n’est pas le schéma actuellement installé. Par exemple, le document propose des identifiants UUID et des tables `employee_contracts`, `career_logs` et `audit_logs`; `src/data/schema-possible.sql` utilise notamment des identifiants `employees` entiers et n’a pas ces trois tables. Les colonnes et états de `time_clock_events`, `daily_time_sheets` et `leave_requests` diffèrent également du modèle proposé ici.

Avant d’ajouter une entité, un repository ou un endpoint pour ces modules :

1. comparer les tables réellement utilisées (`src/data/schema-possible.sql`, `src/data/schema.sql`) avec le modèle cible décrit dans la section 3;
2. décider et documenter un schéma cible unique, les identifiants, les contraintes et la stratégie de migration;
3. créer une migration additive et testable, sans réinitialiser ni écraser les données locales existantes;
4. seulement ensuite, ajouter les entités/repositories JPA ou conserver JDBC selon une décision d’architecture explicite;
5. ajouter les DTO, services métier, contrôleurs Spring, autorisations et tests d’intégration PostgreSQL;
6. brancher les nouveaux écrans React au client `src/services/api.ts` sans refaire le design du portail existant.

Les cases à cocher des blocs 5–7 restent un cahier des charges futur. Les tables de base présentes dans le schéma ne suffisent pas à considérer ces blocs comme opérationnels.

### État du dépôt à cette date

| Domaine | Présent dans le dépôt | À ne pas confondre avec |
|---|---|---|
| Blocs recrutement 1–4 | Écrans React existants, API Spring Boot, authentification et workflow avec PostgreSQL | Une preuve que tous les critères de recette du portail sont déjà satisfaits |
| Bloc 5 — dossier salarié | Tables SQL de base seulement | GED, contrats successifs, carrière, audit RGPD ou conversion complète d’un candidat en salarié |
| Bloc 6 — temps et pointage | Tables SQL de base seulement | Pointeuse, calcul du temps, anomalies légales, régularisations ou export paie |
| Bloc 7 — congés et absences | Tables SQL de base seulement | Soldes, calcul des jours, anti-chevauchement, workflow manager/RH ou liaison paie |

Les contrôles `npm run lint`, `npm run build` et les tests Maven ont été exécutés pendant la mise en place du socle. Ils valident ces commandes au moment de leur exécution, mais ne remplacent pas les tests fonctionnels et PostgreSQL à ajouter pour chaque futur module.

## 📑 Sommaire Général
1. [Vue d'Ensemble & Alignement Stratégique](#1-vue-densemble--alignement-stratégique)
2. [Analyse Détaillée des 3 Blocs (QUOI, POURQUOI, COMMENT)](#2-analyse-détaillée-des-3-blocs)
   - [Bloc 5 — Dossier Administratif du Salarié (Référentiel Central)](#bloc-5--dossier-administratif-du-salarié)
   - [Bloc 6 — Temps de Travail et Pointage (Horaires & Anomalies)](#bloc-6--temps-de-travail-et-pointage)
   - [Bloc 7 — Congés et Absences (Soldes, Validation & Planning)](#bloc-7--congés-et-absences)
3. [Architecture Technique & Schéma de Base de Données](#3-architecture-technique--schéma-de-base-de-données)
4. [Répartition des Rôles & Tâches pour les 5 Personnes](#4-répartition-des-rôles--tâches-pour-les-5-personnes)
   - [👤 MISAINA — Architecture Globale & Socle Dossier Salarié (Bloc 5 Core)](#-misaina--architecture-globale--socle-dossier-salarié)
   - [👤 MIARANTSOA — Lead Frontend & Expérience Salarié / RH (UI/UX Blocs 5 & 6)](#-miarantsoa--lead-frontend--expérience-salarié--rh)
   - [👤 MIRADO — Moteur Temps de Travail, Pointage & Anomalies (Bloc 6 Core)](#-mirado--moteur-temps-de-travail-pointage--anomalies)
   - [👤 DYLAN — Moteur Congés, Soldes & Circuit de Validation (Bloc 7 Core)](#-dylan--moteur-congés-soldes--circuit-de-validation)
   - [👤 TONTON — Base de Données, Sécurité, Moteur Variables de Paie & CI/CD](#-tonton--base-de-données-sécurité-moteur-variables-de-paie--cicd)
5. [Guide de Synchronisation Git & Workflow d'Équipe](#5-guide-de-synchronisation-git--workflow-déquipe)
6. [Planning des Sprints & Critères d'Acceptation (DoD)](#6-planning-des-sprints--critères-dacceptation)

---

## 1. Vue d'Ensemble & Alignement Stratégique

L'application existante couvre le cycle de recrutement (**Blocs 1 à 4** : Création du poste par le Manager, Qualification RH, Arbitrage budgétaire Finance, Approbation CODIR, et Vivier de Candidats Kanban).

Dès qu'un candidat est retenu et embauché (ex: *Elena Kova* ou *Julien Vasseur*), il entre dans la vie active de l'entreprise. Les **Blocs 5, 6 et 7** constituent le cœur battant du SIRH opérationnel :

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BLOC 5 : DOSSIER SALARIÉ                        │
│             (Identité, Contrat, Affectation, GED, Carrière)            │
│                       ★ RÉFÉRENTIEL CENTRAL SIRH                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Alimente en continu
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│  BLOC 6 : TEMPS & POINTAGE    │               │   BLOC 7 : CONGÉS & ABSENCES  │
│ • Pointage Entrée/Sortie      │               │ • Types & Règles de Congés    │
│ • Heures Sup & Retards        │               │ • Soldes acquis / pris / reste│
│ • Détection Anomalies (11h)   │               │ • Workflow Validation N+1/RH  │
│ • Temps Réellement Travaillé  │               │ • Contrôle Chevauchements     │
└───────────────┬───────────────┘               └───────────────┬───────────────┘
                │                                               │
                └───────────────────────┬───────────────────────┘
                                        ▼
                        ┌───────────────────────────────┐
                        │      VARIABLES DE PAIE        │
                        │ (HSup, Retenues, Primes, RTT) │
                        └───────────────────────────────┘
```

---

## 2. Analyse Détaillée des 3 Blocs

---

### Bloc 5 — Dossier Administratif du Salarié

> *« Centraliser identité, coordonnées, documents et situation professionnelle. Conserver contrats, affectations, salaire et historique de carrière. Gérer les documents administratifs et leur validité. Prévoir confidentialité, habilitations et journal d’audit. Le dossier salarié devient le référentiel central du SIRH. »*

#### QUOI :
##### 1. Côté FRONT-END :
- **Fiche Salarié 360° (Dossier Collaborateur)** :
  - **Onglet État Civil & Identité** : Nom, prénom, date de naissance, NIR (Numéro de Sécurité Sociale masqué avec bouton d'affichage réservé RH), nationalité, adresse postale, contact d'urgence.
  - **Onglet Contrat & Situation RH** : Type de contrat (CDI, CDD, Stage, Alternance), date d'entrée, période d'essai (dates et renouvellement), statut cadre/non-cadre, grade conventionnel (G1 à G8), coefficient, temps plein/partiel, forfait jours (218 jours) ou base horaire (35h/39h).
  - **Onglet Affectation & Organigramme** : Direction, Département, Pôle, Manager N+1 responsable, bureau/site géographique, télétravail (jours fixes autorisés).
  - **Onglet Rémunération & Avantages** : Salaire brut de base, primes conventionnelles, variable, véhicule de fonction, mutuelle d'entreprise, titres-restaurant.
  - **Onglet Gestion Électronique des Documents (GED RH)** :
    - Liste des pièces jointes : CNI/Passeport, Titre de séjour (avec date d'expiration), RIB (BIC/IBAN), Permis de conduire, Visite médicale d'aptitude, Diplômes, Contrat de travail signé.
    - Badges de validité visuelle : `Validé (Vert)`, `Expire dans 30j (Ambre)`, `Expiré (Rouge)`.
  - **Onglet Historique de Carrière & Évolutions** : Timeline immuable des promotions, changements de salaire, mobilités inter-départements.
- **Habilitations d'affichage strictes (RGPD & Secret Professionnel)** :
  - *Salarié* : Peut consulter ses propres données et modifier ses coordonnées/RIB sous réserve de validation RH.
  - *Manager* : Voit uniquement la situation professionnelle de son équipe (département, poste, horaires, contact pro), sans accès au salaire ni aux documents médicaux.
  - *RH & Direction* : Accès complet avec traçabilité de consultation.

##### 2. Côté BACK-END :
- **Fichiers à créer** :
  - `src/services/employeeService.ts` : CRUD complet sur les salariés, pagination, filtrage multi-critères.
  - `src/services/documentService.ts` : Gestion des pièces justificatives, vérification des métadonnées MIME, chiffrement et détection des dates de péremption.
  - `src/services/careerHistoryService.ts` : Enregistrement immuable de chaque événement carrière (avenant, promotion, changement manager).
  - `src/middleware/gdprAuditMiddleware.ts` : Journalisation de toute consultation de données sensibles (qui a vu quoi, à quelle heure).
- **Fonctions Métier Clés** :
  - `createEmployeeFromCandidate(candidateId, contractData)` : Convertit un candidat retenu du Bloc 4 en salarié actif.
  - `checkDocumentExpirations()` : Cron/service quotidien qui déclenche les notifications de documents arrivant à échéance (visite médicale, titre de séjour).
  - `anonymizeLeaver(employeeId)` : Procédure RGPD pour les salariés ayant quitté l'entreprise après le délai légal de conservation.

#### POURQUOI (Choix Développeur) :
- **Pourquoi un référentiel central unique ?**  
  Pour éviter la duplication d'informations entre le pointage (Bloc 6) et les congés (Bloc 7). Si un manager ou un département change, la mise à jour unique dans le Bloc 5 se répercute instantanément sur les workflows de validation des autres blocs.
- **Pourquoi le chiffrement et le journal d'audit ?**  
  La CNIL impose que les données de santé (visites médicales) et d'identité (NIR, RIB) fassent l'objet d'une traçabilité d'accès.

#### COMMENT (Architecture & Base de Données) :
- Tables principales : `employees`, `employee_contracts`, `employee_documents`, `career_logs`, `audit_logs`.

---

### Bloc 6 — Temps de Travail et Pointage

> *« Définir horaires, planning et régime de travail. Enregistrer entrées, sorties, retards et heures supplémentaires. Calculer le temps réellement travaillé. Détecter les anomalies de pointage. Les données de temps alimentent les absences et les variables de paie. »*

#### QUOI :
##### 1. Côté FRONT-END :
- **Module Pointeuse Digitale (Web Kiosk / Espace Salarié)** :
  - Boutons tactiles et interactifs : `Pointer l'Arrivée`, `Début Pause Déjeuner`, `Fin Pause`, `Pointer le Départ`.
  - Horloge temps réel synchronisée avec affichage du cumul de la journée en cours (`07h 42min travaillées`).
- **Écran de Pilotage Manager & RH (Feuilles de Temps & Planning)** :
  - Tableau de bord hebdomadaire/mensuel des heures par collaborateur.
  - Vue planning d'équipe avec codes couleurs (Présent, Télétravail, Astreinte, En repos).
- **Centre de Traitement des Anomalies de Pointage** :
  - Badges d'alertes visuelles :
    - ⚠️ *Oubli de pointage sortie* (badgeage d'entrée sans départ le soir).
    - ⏱️ *Retard significatif* (> 15 min par rapport à l'horaire théorique).
    - 🚨 *Infraction Code du Travail* : Non-respect des 11h de repos consécutif obligatoire entre deux prises de poste ou amplitude quotidienne > 10h.
  - Modale de régularisation pour le salarié et le manager (motif de régularisation + visa manager).
- **Compteur d'Heures Supplémentaires & Récupération** :
  - Suivi des heures à 25% (au-delà de 35h jusqu'à 43h) et à 50% (au-delà de 43h).
  - Choix pour le collaborateur : paiement sur bulletin de paie ou versement au Compte Épargne Temps (CET/Repos compensateur).

##### 2. Côté BACK-END :
- **Fichiers à créer** :
  - `src/services/timeTrackingService.ts` : Enregistrement des pointages bruts, horodatage serveur immuable (tampon anti-fraude).
  - `src/services/overtimeCalculator.ts` : Calculateur d'heures effectives, ventilation hebdo, déduction des temps de pause forfaitaires.
  - `src/services/anomalyDetectionEngine.ts` : Moteur d'analyse des règles légales (repos 11h, durée max hebdo 48h, pointages manquants).
  - `src/services/payrollTimeExportService.ts` : Agrégation mensuelle des variables de paie (HSup 25%, HSup 50%, heures de nuit, dimanche, primes d'astreinte).
- **Fonctions Métier Clés** :
  - `recordClockEvent(employeeId, eventType, timestamp, metadata)` : Enregistre une entrée/sortie avec protection contre les doubles-clics.
  - `computeDailyEffectiveHours(employeeId, date)` : Déduit les temps de pause obligatoires et retourne la durée nette travaillée.
  - `scanWeeklyCompliance(employeeId, weekNumber)` : Analyse les infractions légales de la semaine.

#### POURQUOI (Choix Développeur) :
- **Pourquoi un horodatage côté serveur obligatoire ?**  
  Pour empêcher la falsification de pointage par modification de l'horloge système du navigateur du salarié.
- **Pourquoi une détection automatique des anomalies ?**  
  En droit du travail, l'employeur est pénalement responsable du respect du repos quotidien de 11 heures. Le système doit lever des alertes préventives avant l'envoi en paie.

---

### Bloc 7 — Congés et Absences

> *« Demande de congé → contrôle du solde → validation manager/RH. Gérer droits, soldes, types de congés, absences et justificatifs. Contrôler chevauchements et disponibilité du solde. Mettre à jour planning et variables de paie. Objets : TypeConge, DroitConge, SoldeConge, DemandeConge, Absence. »*

#### QUOI :
##### 1. Côté FRONT-END :
- **Portail de Saisie de Demande de Congé / Absence** :
  - Sélecteur de type : Congés Payés (CP), RTT, Congé sans solde, Événement familial (Mariage, Décès, Naissance), Maladie, Enfant malade.
  - Calendrier visuel interactif : Sélection de date de début (Matin / Après-midi) et date de fin.
  - **Calculateur de solde en direct** : Affiche instantanément :
    - Solde actuel : `22.5 jours`
    - Durée demandée : `-3.0 jours ouvrés`
    - Solde restant projeté : `19.5 jours`
  - Upload de pièce justificative obligatoire pour les arrêts maladie (sous 48h légal) ou justificatif de mariage/pacs.
- **Contrôleur d'Anti-Chevauchement Visuel & Équipe** :
  - Alerte si le salarié a déjà posé une absence sur la même période.
  - Vue **« Impact sur l'équipe »** : Indique si d'autres collègues du même département sont déjà absents aux mêmes dates (ex: *« Attention : 2 collaborateurs sur 4 sont déjà absents dans l'équipe Infra Cloud »*).
- **Espace de Validation Managériale & RH** :
  - File d'attente d'approbation avec boutons `Approuver`, `Refuser (motif obligatoire)` ou `Demande d'ajustement`.
- **Compteurs de Soldes en Cartes UI** :
  - Jauges circulaires élégantes : CP N-1 (à solder avant le 31 mai), CP N (en cours), RTT employeur / RTT salarié.

##### 2. Côté BACK-END :
- **Fichiers à créer** :
  - `src/services/leaveService.ts` : Gestion des demandes, calcul des jours ouvrés (exclusion des week-ends et jours fériés légaux français).
  - `src/services/leaveBalanceService.ts` : Incrémentation mensuelle des droits (+2.08 ou +2.5 CP/mois), décrémentation des soldes lors des validations.
  - `src/services/leaveValidationWorkflow.ts` : Moteur d'escalade d'approbation (Manager N+1 puis RH si congé exceptionnel).
  - `src/services/leaveOverlapValidator.ts` : Algorithme de vérification des plages de dates sans collision temporelle.
- **Fonctions Métier Clés** :
  - `calculateBusinessDays(startDate, endDate, halfDayFlag)` : Retourne le nombre exact de jours décomptés selon le calendrier conventionnel.
  - `assertSufficientBalance(employeeId, leaveTypeId, requestedDays)` : Empêche la soumission si le solde est insuffisant (sauf type sans solde autorisé).
  - `propagateToPayrollAndPlanning(leaveRequestId)` : Met à jour le planning général et génère la ligne de retenue/maintien pour le fichier de paie.

#### POURQUOI (Choix Développeur) :
- **Pourquoi un calcul des jours ouvrés/ouvrables paramétrable ?**  
  Selon la convention collective (Métallurgie, Syntec...), le décompte s'effectue en jours ouvrés (lundi au vendredi) ou ouvrables (lundi au samedi).
- **Pourquoi bloquer les chevauchements en base de données ?**  
  Pour garantir l'intégrité comptable : un salarié ne peut physiquement pas être à la fois en RTT et en arrêt maladie le même jour.

---

## 3. Architecture Technique & Schéma de Base de Données

### A. Modèle Entité-Relation (Base de Données Relationnelle SQL / PostgreSQL)

```sql
-- ========================================================
-- BLOC 5 : RÉFÉRENTIEL SALARIÉ & CARRIÈRE
-- ========================================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricule VARCHAR(20) UNIQUE NOT NULL, -- Ex: EMP-2026-0142
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email_pro VARCHAR(150) UNIQUE NOT NULL,
    email_perso VARCHAR(150),
    phone VARCHAR(20),
    nir_encrypted VARCHAR(255) NOT NULL, -- Numéro Sécurité Sociale chiffré
    birth_date DATE NOT NULL,
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_zip VARCHAR(10),
    hire_date DATE NOT NULL,
    exit_date DATE,
    department_id VARCHAR(50) NOT NULL,
    manager_id UUID REFERENCES employees(id),
    status VARCHAR(30) DEFAULT 'actif' -- 'actif', 'pre-embauche', 'suspendu', 'sorti'
);

CREATE TABLE employee_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(20) NOT NULL, -- 'CDI', 'CDD', 'STAGE', 'ALTERNANCE'
    start_date DATE NOT NULL,
    end_date DATE,
    trial_period_end DATE,
    grade VARCHAR(10) NOT NULL, -- 'G1' à 'G8'
    job_title VARCHAR(150) NOT NULL,
    work_regime VARCHAR(30) NOT NULL, -- 'FORFAIT_JOURS_218', 'HEBDO_35H', 'HEBDO_39H'
    monthly_gross_salary NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'CNI', 'TITRE_SEJOUR', 'RIB', 'VISITE_MEDICALE', 'DIPLOME'
    filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    expiration_date DATE, -- Pour alertes de validité
    verification_status VARCHAR(30) DEFAULT 'en_attente', -- 'valide', 'rejete', 'expire'
    verified_by UUID REFERENCES employees(id),
    verified_at TIMESTAMP
);

-- ========================================================
-- BLOC 6 : TEMPS DE TRAVAIL & POINTAGES
-- ========================================================
CREATE TABLE time_clock_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL, -- 'IN_MORNING', 'OUT_LUNCH', 'IN_LUNCH', 'OUT_EVENING'
    device_type VARCHAR(50) DEFAULT 'WEB_PORTAL',
    ip_hash VARCHAR(100),
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_regularized BOOLEAN DEFAULT FALSE,
    regularization_reason TEXT
);

CREATE TABLE daily_time_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    first_in TIMESTAMP,
    last_out TIMESTAMP,
    total_break_minutes INT DEFAULT 0,
    effective_worked_minutes INT NOT NULL DEFAULT 0,
    overtime_25_minutes INT DEFAULT 0,
    overtime_50_minutes INT DEFAULT 0,
    has_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_type VARCHAR(100), -- 'MANQUE_SORTIE', 'NON_RESPECT_11H', 'AMPLITUDE_MAX'
    status VARCHAR(30) DEFAULT 'soumis', -- 'valide_manager', 'rejete', 'cloture_paie'
    UNIQUE(employee_id, work_date)
);

-- ========================================================
-- BLOC 7 : CONGÉS & ABSENCES
-- ========================================================
CREATE TABLE leave_types (
    id VARCHAR(30) PRIMARY KEY, -- 'CP', 'RTT', 'MALADIE', 'SANS_SOLDE', 'MARIAGE'
    name VARCHAR(100) NOT NULL,
    accrual_rate_per_month NUMERIC(4,2) DEFAULT 0.0, -- Ex: 2.08 pour CP
    requires_justification BOOLEAN DEFAULT FALSE,
    max_days_allowed NUMERIC(4,1),
    color_code VARCHAR(20) DEFAULT '#3B82F6'
);

CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id VARCHAR(30) REFERENCES leave_types(id),
    period_year INT NOT NULL, -- 2026
    acquired_days NUMERIC(4,1) DEFAULT 0.0,
    taken_days NUMERIC(4,1) DEFAULT 0.0,
    pending_days NUMERIC(4,1) DEFAULT 0.0,
    remaining_days NUMERIC(4,1) GENERATED ALWAYS AS (acquired_days - taken_days - pending_days) STORED,
    UNIQUE(employee_id, leave_type_id, period_year)
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id VARCHAR(30) REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    start_half_day VARCHAR(10) DEFAULT 'MATIN', -- 'MATIN', 'MIDI'
    end_date DATE NOT NULL,
    end_half_day VARCHAR(10) DEFAULT 'SOIR', -- 'MIDI', 'SOIR'
    total_business_days NUMERIC(4,1) NOT NULL,
    status VARCHAR(30) DEFAULT 'en_attente_manager', -- 'approuve_manager', 'valide_rh', 'refuse'
    rejection_reason TEXT,
    justification_file_url VARCHAR(500),
    manager_approver_id UUID REFERENCES employees(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour détection instantanée de chevauchement
CREATE INDEX idx_leave_requests_overlap ON leave_requests (employee_id, start_date, end_date, status);
```

---

## 4. Répartition des Rôles & Tâches pour les 5 Personnes

Pour garantir une efficacité maximale et éviter tout conflit sur Git, chaque personne dispose d'un **périmètre métier dédié**, de **dossiers réservés** et d'interfaces de communication clairement définies.

---

### 👤 MISAINA — Architecture Globale & Socle Dossier Salarié
*Rôle : Tech Lead, Garant du Référentiel Central & Sécurité RGPD*

#### Périmètre Fichiers Dédié :
- `src/types/employee.ts` (Modèles de données du Bloc 5)
- `src/services/employeeCoreService.ts` (Service central des dossiers salariés)
- `src/middleware/rbacGuard.ts` (Habilitations fines : Salarié vs Manager vs RH)
- `src/views/EmployeeProfileView.tsx` (Composant d'affichage de la fiche 360°)

#### Tâches Précises à Réaliser :
1. **Concevoir le schéma TypeScript du Dossier Salarié** : Identité, état civil, NIR masqué, contrats successifs, rattachement managérial multi-départements.
2. **Implémenter la conversion Candidat → Salarié** : Connecter le Bloc 4 (recrutement) au Bloc 5 lorsqu'un candidat est retenu pour générer son matricule et sa fiche.
3. **Mettre en place le Journal d'Audit Légal (Audit Trail RGPD)** : Tracer dans un log sécurisé chaque lecture/modification d'une donnée confidentielle (RIB, adresse, visite médicale).
4. **Développer le sélecteur d'organigramme hiérarchique** : Gérer la relation N+1 (ex: *Marc Lefebvre* supervise des collaborateurs sur ses 3 départements distincts).

---

### 👤 MIARANTSOA — Lead Frontend & Expérience Salarié / RH
*Rôle : UI/UX Designer & Développeur Front-End Référent*

#### Périmètre Fichiers Dédié :
- `src/views/EmployeeDirectoryView.tsx` (Annuaire et trombinoscope des collaborateurs)
- `src/components/employee/DocumentUploadCard.tsx` (Composant de téléversement et vérification de validité de documents)
- `src/components/employee/CareerTimeline.tsx` (Frise chronologique de carrière et historique d'évolutions)
- `src/components/planning/GlobalTeamCalendar.tsx` (Calendrier visuel consolidé présences/absences)

#### Tâches Précises à Réaliser :
1. **Créer l'Annuaire d'Entreprise interactif** : Recherche temps réel par compétence, nom, département, bureau, avec bascule mode Trombinoscope ou Grille Pro.
2. **Développer le module de GED Administrative** : Système de glisser-déposer de justificatifs avec badges d'expiration colorés et alertes visuelles `J-30`.
3. **Construire la Frise Historique de Carrière** : Présentation visuelle des étapes du salarié (Période d'essai validée, Promotion Grade G5, Avenant télétravail).
4. **Concevoir le Calendrier d'Équipe Haute Visibilité** : Affichage mensuel/hebdomadaire indiquant qui est présent, qui télétravaille et qui est absent.

---

### 👤 MIRADO — Moteur Temps de Travail, Pointage & Anomalies
*Rôle : Spécialiste Droit Social, Temps de Travail & Moteur de Calcul (Bloc 6)*

#### Périmètre Fichiers Dédié :
- `src/types/timeTracking.ts` (Types des pointages, feuilles de temps et anomalies)
- `src/services/clockingEngine.ts` (Moteur d'enregistrement et calcul du temps net)
- `src/views/TimeTrackingView.tsx` (Interface de la pointeuse digitale et consultation)
- `src/components/time/AnomalyResolutionModal.tsx` (Modale de traitement des infractions et régularisations)

#### Tâches Précises à Réaliser :
1. **Développer la Pointeuse Virtuelle Responsive** : Boutons d'arrivée/départ/pause avec horodatage serveur infalsifiable et calcul du compteur journalier en direct.
2. **Implémenter le Calculateur des Régimes de Travail** :
   - Prise en charge des **35 heures**, **39 heures** (heures supplémentaires hebdomadaires).
   - Prise en charge du **Forfait Jours (218 jours)** avec suivi des jours ouvrés travaillés.
3. **Construire le Moteur de Détection des Anomalies Légales** :
   - Détection d'oubli de pointage sortie le soir.
   - Contrôle du temps de repos minimal de 11h d'affilée entre 2 journées.
   - Détection des dépassements de l'amplitude journalière maximale de 10h.
4. **Créer le Workflow de Régularisation** : Permettre au salarié de déclarer une régularisation motivée soumise à visa manager.

---

### 👤 DYLAN — Moteur Congés, Soldes & Circuit de Validation
*Rôle : Spécialiste Moteur Congés, Anti-Chevauchement & Workflow N+1 (Bloc 7)*

#### Périmètre Fichiers Dédié :
- `src/types/leaves.ts` (Modèles de TypeConge, SoldeConge, DemandeConge)
- `src/services/leaveCalculator.ts` (Calculateur des jours ouvrés et décompte des soldes)
- `src/views/LeaveManagementView.tsx` (Portail collaborateur de demande et suivi des soldes)
- `src/components/leaves/LeaveApprovalTable.tsx` (Tableau de validation managériale N+1 / RH)

#### Tâches Précises à Réaliser :
1. **Développer l'Interface de Demande de Congé** : Sélection de plage de dates, choix matin/après-midi, calcul instantané de l'impact sur le solde restant.
2. **Implémenter l'Algorithme d'Anti-Chevauchement** : Vérification stricte interdisant de poser deux demandes sur un créneau identique ou se chevauchant.
3. **Mettre en place le Contrôle d'Impact d'Équipe** : Affichage d'un avertissement si trop de collègues du même département sont simultanément absents.
4. **Construire le Circuit d'Approbation Managérial** : Notifications, acceptation/refus avec motif obligatoire et répercussion automatique sur le solde.

---

### 👤 TONTON — Base de Données, Sécurité, Moteur Variables de Paie & CI/CD
*Rôle : Database Administrator, Moteur de Paie & Intégration Transverse*

#### Périmètre Fichiers Dédié :
- `src/db/schema.sql` (Définitions DDL complètes, contraintes d'intégrité, triggers)
- `src/services/payrollAggregationService.ts` (Passerelle agrégeant Temps & Absences vers la Paie)
- `src/utils/exportUtils.ts` (Générateur d'exports CSV/Excel et fiches récapitulatives)
- `.github/workflows/ci.yml` (Pipeline de validation lint, build et tests automatisés)

#### Tâches Précises à Réaliser :
1. **Structurer et Valider le Schéma de Base de Données** : Implémenter les clés étrangères, contraintes `CHECK`, index de performance sur les dates.
2. **Développer le Moteur des Variables de Paie (Liaison Blocs 6 & 7)** :
   - Consolider les heures supplémentaires (HSup 25% / 50%) calculées par MIRADO.
   - Consolider les jours d'absence non rémunérée ou congés sans solde calculés par DYLAN.
   - Produire le fichier d'export mensuel conforme pour le logiciel de paie (Silae/Sage).
3. **Garantir l'Intégrité des Données & Triggers** : Empêcher en base toute suppression en cascade accidentelle d'un historique de paie ou de contrat.
4. **Piloter les Fusions Git & la CI/CD** : Superviser les pull requests, résoudre les conflits éventuels et garantir un build toujours vert (`compile_applet` & `lint_applet`).

---

## 5. Guide de Synchronisation Git & Workflow d'Équipe

Pour que les 5 développeurs travaillent en parfaite harmonie sans blocage ni régression, le projet adopte une **stratégie Git Flow stricte**.

### A. Arborescence des Branches Git
```
main (Production stable)
  │
  └── staging (Branche d'intégration continue de l'équipe)
        │
        ├── feature/bloc5-core-misaina
        ├── feature/bloc5-ui-miarantsoa
        ├── feature/bloc6-pointage-mirado
        ├── feature/bloc7-conges-dylan
        └── feature/db-paie-tonton
```

### B. Règles d'Or Anti-Conflits :
1. **Chaque personne possède son propre dossier/fichier** : Ne jamais modifier directement le fichier d'un coéquipier sans concertation.
2. **Partage des Types en Amont** : Les types TypeScript (`employee.ts`, `timeTracking.ts`, `leaves.ts`) sont validés et figés dès le début du sprint par MISAINA et TONTON.
3. **Pas de push direct sur `main` ou `staging`** : Tout travail passe par une branche `feature/...` et une Pull Request (PR) validée par au moins un relecteur.
4. **Synchronisation quotidienne (`git pull --rebase origin staging`)** : Chaque matin, chaque développeur met à jour sa branche locale pour intégrer les avancées des autres.

### C. Conventions de Commits (Conventional Commits) :
- `feat(bloc5): ajout de l'onglet GED documents salariés (MIARANTSOA)`
- `feat(bloc6): calcul automatique des heures supplémentaires à 25% (MIRADO)`
- `feat(bloc7): moteur d'anti-chevauchement des dates de congés (DYLAN)`
- `fix(core): correction du masquage du numéro de sécurité sociale (MISAINA)`
- `chore(db): index de performance sur les pointages horodatés (TONTON)`

---

## 6. Planning des Sprints & Critères d'Acceptation (DoD)

### Matrice d'Avancement par Sprint :

| Phase | Objectifs Clés | Responsables | Livrable Attendu |
|---|---|---|---|
| **Sprint 1 : Socle & Modélisation** | Définition des types, DDL SQL, contrats d'interfaces API. | MISAINA & TONTON | Types compilés, DDL validé, mock data étendu. |
| **Sprint 2 : Implémentation Métier** | Développement des moteurs de calcul (Pointage & Soldes congés). | MIRADO & DYLAN | Algorithmes testés (heures effectives, anti-chevauchement). |
| **Sprint 3 : Interfaces & Expérience Utilisateur** | Fiches 360°, pointeuse, calendrier partagé, dashboard. | MIARANTSOA & MISAINA | Écrans riches, responsive, conformité graphique Tailwind 4. |
| **Sprint 4 : Intégration & Clôture Paie** | Workflow N+1/RH, liaison variables de paie, audit RGPD. | TONTON & TOUS | Circuit complet opérationnel de bout en bout. |

### Définition du « Terminé » (Definition of Done - DoD) :
- [ ] Le code des modules concernés compile avec zéro erreur TypeScript (`npm run build`) et Java (`cd backend && ./mvnw test`).
- [ ] Le linter passe avec succès (`npm run lint`). Ces commandes ont été exécutées pour le socle existant, mais doivent être rejouées après chaque changement.
- [ ] Les 3 blocs communiquent sans rupture : un salarié créé dans le Bloc 5 peut pointer dans le Bloc 6 et poser ses congés dans le Bloc 7. **Critère non satisfait à ce jour : ces modules applicatifs ne sont pas présents.**
- [ ] Les règles de sécurité, l’audit des données sensibles, l’anti-chevauchement et les validations sont couverts par des tests backend et PostgreSQL. **Critère non satisfait à ce jour pour les blocs 5–7.**

---

*Fichier de cadrage technique et opérationnel généré pour l'équipe de développement SIRH Entreprise.*
