# TODO_JAVA — Migration du back-end du Portail SIRH

## 1. Objectif du projet

Développer le back-end du Portail SIRH en **Java avec Spring Boot**, connecté à la base **PostgreSQL** définie dans `schema_sirh_corrige.sql`.

Le front-end existant est développé en **React 19 + TypeScript + Vite**. Il contient déjà les écrans, les composants, les formulaires, les filtres, les tableaux de bord, les modales et les interactions utilisateur décrits dans `todo.md`.

Le travail consiste à **déplacer la logique métier et les traitements de données vers Java**, puis à faire communiquer React avec Spring Boot au moyen d'API REST.

### Règle principale : ne pas casser le front-end existant

- Ne pas refaire les écrans React.
- Ne pas modifier le design, les styles, les composants ou la navigation existante.
- Ne pas supprimer les fonctionnalités actuellement disponibles dans React.
- Ne pas changer les règles d'affichage, les filtres, les vues Tableau/Cartes/Groupé, les modales, les notifications ou les raccourcis clavier.
- Remplacer progressivement les données de simulation de `mockData.ts` par les données reçues de l'API.
- Conserver les mêmes informations et les mêmes comportements visibles. Si une adaptation technique est indispensable pour appeler l'API, elle doit rester limitée à la couche d'accès aux données et aux points de branchement nécessaires.
- La seule évolution fonctionnelle demandée est la suivante : **la validation Finance devient obligatoire avant que la demande puisse accéder à l'étape Direction**.

> React reste responsable de l'interface et de l'expérience utilisateur. Java/Spring Boot devient responsable des règles métier, des validations, des autorisations, des calculs et des opérations sur les données. PostgreSQL devient la source de données persistante.

---

## 2. Architecture cible

```text
┌────────────────────────────────────────────────────────────┐
│                    FRONT-END EXISTANT                       │
│                 React 19 + TypeScript + Vite                │
│                                                            │
│ Login · Dashboard · Demandes · RH · Finance · Direction    │
│ Kanban · Onboarding · Référentiels · Modales · Filtres      │
│                                                            │
│ Les composants et le design restent inchangés.             │
└────────────────────────────┬───────────────────────────────┘
                             │ HTTP / JSON (API REST)
                             │ Authorization: Bearer <token>
                             ▼
┌────────────────────────────────────────────────────────────┐
│                  BACK-END JAVA                              │
│                  Spring Boot                                │
│                                                            │
│ Controllers → Services métier → Repositories               │
│                    │                                       │
│                    ├── Authentification / autorisations     │
│                    ├── Workflow Manager → RH → Finance      │
│                    │                    → Direction         │
│                    ├── Calculs budgétaires                  │
│                    ├── Gestion des candidats                │
│                    ├── Audit / historique                   │
│                    └── Onboarding / référentiels            │
└────────────────────────────┬───────────────────────────────┘
                             │ Spring Data JPA / Hibernate
                             ▼
┌────────────────────────────────────────────────────────────┐
│                     POSTGRESQL                              │
│       schema_sirh_corrige.sql + données de test              │
└────────────────────────────────────────────────────────────┘
```

### Répartition des responsabilités

| Élément | Responsabilité |
|---|---|
| React | Affichage, navigation, saisie, filtres, interactions et messages visuels |
| API REST | Échange des données entre React et le back-end |
| Controllers Spring | Recevoir les requêtes HTTP, vérifier les entrées et retourner les réponses |
| Services Java | Exécuter les règles métier et les traitements |
| Repositories | Lire et enregistrer les données dans PostgreSQL |
| PostgreSQL | Conserver les utilisateurs, départements, demandes, validations, candidats, etc. |

**Important :** masquer un bouton dans React ne constitue pas une sécurité. Toutes les autorisations et toutes les règles métier doivent être vérifiées côté Java, même si React effectue aussi des contrôles d'affichage.

---

## 3. Préparation du projet Spring Boot

### 3.1 Créer le projet

- [ ] Créer un projet Spring Boot avec Java 21.
- [ ] Utiliser Maven (ou Gradle si le projet est déjà standardisé ainsi).
- [ ] Ajouter les dépendances :
  - Spring Web
  - Spring Data JPA
  - PostgreSQL Driver
  - Spring Security
  - Validation
  - Spring Boot DevTools (développement)
  - Lombok (facultatif)
  - Spring Boot Test
- [ ] Configurer le port du serveur, par exemple `8080`.
- [ ] Configurer CORS pour autoriser l'origine du serveur React en développement.
- [ ] Ajouter un fichier `.env` ou une configuration externe pour les secrets ; ne pas inscrire les mots de passe réels dans Git.

### 3.2 Configurer PostgreSQL

- [ ] Créer la base `sirh`.
- [ ] Exécuter `schema_sirh_corrige.sql`.
- [ ] Exécuter `sirh_donnees_test_corrige.sql`.
- [ ] Configurer `spring.datasource.url`, `username` et `password`.
- [ ] Configurer Hibernate pour ne pas recréer ou modifier automatiquement le schéma existant (`ddl-auto=validate` conseillé).
- [ ] Vérifier que les tables et les relations sont accessibles depuis Spring Boot.
- [ ] Vérifier les types PostgreSQL utilisés, notamment `TEXT[]`, `NUMERIC`, les dates et les identifiants texte tels que `usr-1`, `req-0042` et `pos-cloud-1`.

### 3.3 Organiser les packages

Exemple d'organisation :

```text
src/main/java/.../sirh/
├── config/
│   ├── CorsConfig.java
│   └── SecurityConfig.java
├── security/
│   ├── JwtAuthenticationFilter.java
│   ├── JwtService.java
│   └── CustomUserDetailsService.java
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   ├── DepartmentController.java
│   ├── RequisitionController.java
│   ├── ApprovalController.java
│   ├── CandidateController.java
│   ├── OnboardingController.java
│   └── DashboardController.java
├── dto/
│   ├── request/
│   └── response/
├── entity/
├── repository/
├── service/
│   ├── AuthService.java
│   ├── RequisitionService.java
│   ├── HrValidationService.java
│   ├── FinanceValidationService.java
│   ├── DirectionApprovalService.java
│   ├── BudgetCalculationService.java
│   ├── CandidateService.java
│   └── AuditService.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   └── ...
└── SirhApplication.java
```

- [ ] Respecter la séparation Controller / Service / Repository / Entity / DTO.
- [ ] Ne pas mettre les règles métier directement dans les controllers.
- [ ] Ne pas retourner directement les entités JPA à React : utiliser des DTO pour maîtriser le format JSON.

---

## 4. Modèle de données Java et correspondance SQL

Créer les entités JPA à partir des tables du fichier SQL existant.

### 4.1 Tables prioritaires — workflow recrutement

- [ ] `User` → `users`
- [ ] `Department` → `departments`
- [ ] `ManagerDepartment` → `manager_departments`
- [ ] `Requisition` → `requisitions`
- [ ] `AvailablePosition` → `available_positions`
- [ ] `RequisitionApproval` → `requisition_approvals`
- [ ] `RequisitionAuditEvent` → `requisition_audit_events`
- [ ] `Candidate` → `candidates`
- [ ] `OnboardingPerson` → `onboarding_people`

### 4.2 Tables complémentaires présentes dans le SQL

Elles doivent être conservées et pourront être développées dans une phase ultérieure si les écrans correspondants sont réellement utilisés :

- [ ] `Employee` → `employees`
- [ ] `EmployeeDocument` → `employee_documents`
- [ ] `TimeClockEvent` → `time_clock_events`
- [ ] `DailyTimeSheet` → `daily_time_sheets`
- [ ] `LeaveType` → `leave_types`
- [ ] `LeaveBalance` → `leave_balances`
- [ ] `LeaveRequest` → `leave_requests`

### 4.3 Règles de mapping

- [ ] Conserver les identifiants texte du jeu de données (`usr-1`, `req-0042`, etc.).
- [ ] Mapper les noms de colonnes SQL en propriétés Java cohérentes.
- [ ] Mapper les tableaux PostgreSQL `TEXT[]` (compétences, vues autorisées) avec une solution compatible avec la version Hibernate retenue ; tester lecture et écriture.
- [ ] Utiliser `BigDecimal` pour les salaires, budgets et montants ; éviter `double` pour les montants financiers.
- [ ] Utiliser `LocalDate` pour les dates sans heure et `LocalDateTime` pour les horodatages.
- [ ] Définir précisément les relations JPA et les stratégies de chargement (`LAZY` par défaut lorsque pertinent).
- [ ] Éviter les boucles de sérialisation JSON entre entités liées ; les DTO doivent exposer uniquement les informations nécessaires.
- [ ] Définir des enums Java pour les rôles, statuts, priorités, étapes et résultats de validation.
- [ ] Vérifier que les valeurs des enums correspondent exactement aux valeurs acceptées par les contraintes SQL.

---

## 5. Authentification et gestion des rôles (RBAC)

Le front actuel propose une connexion par rôle, un historique des e-mails utilisés et des accès rapides de démonstration. Ces comportements visuels doivent être préservés autant que possible, mais l'identité et les droits réels doivent désormais provenir du back-end.

### À développer

- [ ] Créer `POST /api/auth/login`.
- [ ] Rechercher l'utilisateur à partir de son e-mail.
- [ ] Vérifier le mot de passe avec BCrypt (ou un encodeur sécurisé équivalent).
- [ ] Ne jamais enregistrer ni renvoyer un mot de passe en clair.
- [ ] Retourner un jeton d'authentification (JWT ou mécanisme de session sécurisé) et le profil utilisateur nécessaire au front.
- [ ] Créer `GET /api/auth/me` pour retrouver l'utilisateur connecté.
- [ ] Créer `POST /api/auth/logout` si le mécanisme retenu nécessite une invalidation côté serveur.
- [ ] Charger les rôles et permissions depuis la base (`role_type`, `can_validate_rh`, `can_validate_finance`, etc.).
- [ ] Protéger les routes API selon le rôle et l'action.
- [ ] Refuser les accès non autorisés avec HTTP `403`.
- [ ] Retourner `401` si l'utilisateur n'est pas authentifié.
- [ ] Ne jamais faire confiance à un `userId`, un rôle ou une permission envoyés librement par React.
- [ ] Conserver dans React l'historique des e-mails uniquement ; ne jamais y stocker le mot de passe.
- [ ] Remplacer les connexions de démonstration qui contourneraient l'authentification par un appel réel à l'API, sans supprimer les éléments d'interface correspondants.

### Contrat de profil à préserver

L'API doit fournir les informations utiles au type `UserProfile` du front : `id`, `name`, `role`, `roleType`, `email`, `avatar`, `initials`, `department`, `managedDepartmentIds`, `managedDepartmentNames`, `allowedViews` et les permissions nécessaires.

Si le JSON Java utilise des noms différents, faire la conversion dans les DTO plutôt que de réécrire les composants React.

---

## 6. API des utilisateurs et des départements

### Endpoints proposés

| Méthode | Endpoint | Fonction |
|---|---|---|
| `GET` | `/api/users/me` | Profil connecté |
| `GET` | `/api/users` | Liste des utilisateurs autorisés |
| `GET` | `/api/departments` | Liste des départements |
| `GET` | `/api/departments/{id}` | Détail d'un département |
| `GET` | `/api/departments/{id}/positions` | Postes d'un département |
| `GET` | `/api/positions` | Liste des postes disponibles |

### Travail à faire

- [ ] Lire les utilisateurs depuis `users`.
- [ ] Lire les départements depuis `departments`.
- [ ] Charger les départements gérés par un manager via `manager_departments`.
- [ ] Charger les postes associés à chaque département.
- [ ] Fournir les données budgétaires et les effectifs nécessaires aux cartes départementales.
- [ ] Fournir les filtres nécessaires au menu `DepartmentPositionsDropdown`.
- [ ] Appliquer les règles d'accès aux données selon le profil connecté.
- [ ] Ne pas calculer artificiellement les compteurs dans le front si ces compteurs dépendent de données métier ; fournir les données nécessaires ou les agrégats par API.

---

## 7. Gestion des demandes de recrutement

Cette partie remplace les données `INITIAL_REQUISITIONS` et les traitements simulés associés.

### Endpoints proposés

| Méthode | Endpoint | Fonction |
|---|---|---|
| `GET` | `/api/requisitions` | Liste des demandes |
| `GET` | `/api/requisitions/{id}` | Détail d'une demande |
| `POST` | `/api/requisitions` | Création d'une demande |
| `PUT` | `/api/requisitions/{id}` | Modification autorisée d'une demande |
| `GET` | `/api/requisitions/{id}/history` | Historique d'une demande |
| `GET` | `/api/requisitions/filters` | Valeurs ou agrégats utiles aux filtres, si nécessaire |

### Travail à faire

- [ ] Implémenter la création d'une demande par un manager autorisé.
- [ ] Vérifier que le manager est bien associé au département choisi via `manager_departments`.
- [ ] Valider les champs obligatoires.
- [ ] Vérifier que `salaryMin` est inférieur ou égal à `salaryMax`.
- [ ] Vérifier la cohérence des dates et des montants.
- [ ] Enregistrer la demande dans `requisitions`.
- [ ] Initialiser son statut et son étape selon le workflow.
- [ ] Permettre la consultation des demandes selon les droits de l'utilisateur.
- [ ] Implémenter la modification uniquement pour les statuts et les rôles autorisés.
- [ ] Fournir les informations nécessaires aux 3 modes d'affichage React : Tableau, Cartes et Groupé par département.
- [ ] Gérer côté API la recherche et les filtres combinables : texte, département, manager, statut, priorité, contrat, tranche salariale et conformité budgétaire.
- [ ] Fournir les KPI du registre : total, demandes par manager/département, en attente, urgentes et publiées.
- [ ] Ne pas supprimer les filtres ou les modes d'affichage déjà présents dans React.

---

## 8. Calculs métier et budget

Tous les calculs qui ont une conséquence métier ou financière doivent être exécutés et vérifiés en Java. React peut afficher un aperçu, mais le résultat enregistré doit être recalculé côté serveur.

### Travail à faire

- [ ] Créer `BudgetCalculationService`.
- [ ] Calculer le coût employeur annuel à partir du salaire et du taux de charges applicable.
- [ ] Comparer la rémunération demandée à la grille du grade.
- [ ] Comparer la rémunération aux limites du département.
- [ ] Déterminer la conformité : `conforme`, `tolerable` ou `depassement`, selon les règles métier confirmées.
- [ ] Calculer les écarts en montant et en pourcentage.
- [ ] Vérifier les plafonds et les éventuelles dérogations.
- [ ] Retourner au front les montants calculés et les libellés nécessaires à ses jauges et alertes.
- [ ] Recalculer ces valeurs au moment de l'enregistrement et de chaque validation.
- [ ] Ne pas accepter comme fiables les montants calculés uniquement par React.

**Point à confirmer avant codage :** la documentation front mentionne 40 % de charges patronales dans un exemple, ainsi qu'une tolérance de 10 % dans les filtres. Il faut confirmer que ces taux sont bien des règles générales applicables à toutes les demandes, ou s'ils sont seulement des exemples d'interface. Ne pas les considérer automatiquement comme des règles légales ou universelles.

---

## 9. Workflow de validation — règles centrales

### Workflow cible

```text
MANAGER
  │ Création et soumission de la demande
  ▼
RH — ÉTAPE 2
  │ Vérification fiche de poste, grade, cohérence et observations
  │
  ├── Refus → demande refusée / correction selon règle à définir
  │
  ▼ Validation RH
FINANCE — ÉTAPE 3 (OBLIGATOIRE)
  │ Analyse budgétaire et dérogation éventuelle
  │
  ├── Refus → demande refusée / retour selon règle à définir
  │
  ▼ Validation Finance
DIRECTION — ÉTAPE 4
  │ Approbation et signature finale
  │
  ▼
PUBLIÉE
  │
  ▼
CAMPAGNE DE RECRUTEMENT / CANDIDATS
```

<badge color="success">Modification fonctionnelle demandée</badge>

**La Direction ne doit plus pouvoir valider directement une demande qui n'a pas reçu l'approbation Finance.** Le back-end doit imposer cet ordre, même si quelqu'un appelle directement l'API.

### 9.1 Étape Manager

- [ ] Autoriser la création uniquement aux utilisateurs ayant `can_create_requisition`.
- [ ] Vérifier que le manager est responsable du département concerné.
- [ ] Enregistrer la demande et ses données financières initiales.
- [ ] Définir le statut initial.
- [ ] Ajouter un événement dans `requisition_audit_events`.
- [ ] Empêcher le manager demandeur de valider lui-même l'étape RH.

### 9.2 Étape RH

- [ ] Créer `POST /api/requisitions/{id}/rh-validation`.
- [ ] Autoriser uniquement un utilisateur ayant le droit de validation RH.
- [ ] Interdire au demandeur de valider sa propre demande, même s'il possède par erreur un autre droit.
- [ ] Recevoir les contrôles : fiche de poste, grade et cohérence.
- [ ] Exiger les observations RH obligatoires.
- [ ] Vérifier que les contrôles requis sont réalisés.
- [ ] Enregistrer la décision dans `requisition_approvals`.
- [ ] Enregistrer les observations dans `requisitions`.
- [ ] Ajouter un événement d'audit.
- [ ] Si RH valide, faire passer la demande à `en_cours_finance`.
- [ ] Si RH refuse, appliquer un statut/retour explicite défini dans le contrat métier ; ne pas simuler une validation.

### 9.3 Étape Finance — validation obligatoire

- [ ] Créer `POST /api/requisitions/{id}/finance-validation`.
- [ ] Autoriser uniquement le rôle Finance et les permissions prévues.
- [ ] Vérifier que la demande est au statut `en_cours_finance`.
- [ ] Vérifier qu'une validation RH approuvée existe.
- [ ] Recalculer le budget côté Java.
- [ ] Vérifier la conformité du salaire et le coût employeur.
- [ ] Exiger un motif de dérogation lorsque la règle budgétaire l'impose.
- [ ] Enregistrer le validateur, la décision, les commentaires et la date dans `requisition_approvals`.
- [ ] Ajouter un événement dans `requisition_audit_events`.
- [ ] Si Finance valide, passer le statut à `en_cours_direction`.
- [ ] Si Finance refuse, empêcher le passage à Direction et appliquer la règle de retour/refus décidée.
- [ ] Interdire à l'API Direction de contourner cette étape.

### 9.4 Étape Direction

- [ ] Créer `POST /api/requisitions/{id}/direction-approval`.
- [ ] Autoriser uniquement un utilisateur ayant le droit Direction.
- [ ] Vérifier que la demande est au statut `en_cours_direction`.
- [ ] Vérifier qu'une approbation RH existe.
- [ ] **Vérifier obligatoirement qu'une approbation Finance existe et est au statut `approuve`.**
- [ ] Refuser la requête si Finance n'a pas validé, avec HTTP `409 Conflict` ou `403 Forbidden` selon la nature exacte du refus.
- [ ] Enregistrer le signataire, la date et la décision.
- [ ] Ajouter l'événement d'audit.
- [ ] Si Direction approuve, passer la demande à `publiee`.
- [ ] Créer ou mettre à jour le poste associé dans `available_positions` selon le modèle retenu.
- [ ] Rendre le poste disponible dans le vivier de recrutement.
- [ ] Préserver l'historique des validations précédentes.

### 9.5 Fiabilité du workflow

- [ ] Exécuter chaque décision et changement de statut dans une transaction `@Transactional`.
- [ ] Empêcher les doubles validations et les validations concurrentes.
- [ ] Vérifier le statut courant avant chaque transition.
- [ ] Refuser les transitions non autorisées (ex. Manager → Direction).
- [ ] Ne jamais se baser uniquement sur `currentStep` envoyé par le navigateur.
- [ ] Enregistrer l'identifiant du validateur authentifié côté serveur.
- [ ] Conserver une trace des décisions, dates et commentaires.
- [ ] Définir explicitement la politique de correction après un refus : retour au Manager, retour RH, ou clôture. La documentation actuelle ne détaille pas entièrement ce cas ; cette règle doit être validée avec l'équipe métier.

**Attention au schéma SQL actuel :** `requisitions.status` prévoit `brouillon`, `en_cours_rh`, `en_cours_finance`, `en_cours_direction`, `publiee`, mais ne prévoit pas de statut `refusee` ou `a_corriger`. Avant d'implémenter les refus, décider si le schéma doit être étendu ou si les refus restent uniquement dans `requisition_approvals` avec une règle de statut clairement définie. Ne pas inventer une valeur qui violerait la contrainte SQL.

---

## 10. Historique et audit

- [ ] Créer un service `AuditService`.
- [ ] Enregistrer chaque création, modification, validation, refus et publication.
- [ ] Associer chaque événement à la demande concernée.
- [ ] Enregistrer l'auteur réel depuis le contexte d'authentification, jamais depuis un nom librement envoyé par React.
- [ ] Enregistrer le rôle, la date, l'étape, la décision et le commentaire utile.
- [ ] Créer `GET /api/requisitions/{id}/history`.
- [ ] Retourner les événements dans l'ordre chronologique attendu par l'interface.
- [ ] Ne pas permettre la modification ou la suppression ordinaire d'un événement d'audit.
- [ ] Préserver les événements historiques déjà présents dans `requisition_audit_events`.

---

## 11. Gestion des candidats et Kanban

Remplacer `CANDIDATES_DATA` par les données de la table `candidates`.

### Endpoints proposés

| Méthode | Endpoint | Fonction |
|---|---|---|
| `GET` | `/api/candidates` | Liste des candidats |
| `GET` | `/api/candidates/{id}` | Détail d'un candidat |
| `POST` | `/api/candidates` | Ajouter une candidature |
| `PATCH` | `/api/candidates/{id}/stage` | Changer l'étape Kanban |
| `POST` | `/api/candidates/{id}/interviews` | Planifier un entretien |
| `PATCH` | `/api/candidates/{id}/reject` | Refuser avec motif |

### Travail à faire

- [ ] Charger les candidats depuis PostgreSQL.
- [ ] Retourner les champs utilisés par les cartes : nom, initiales, poste, expérience, score, compétences, étape, ancienneté, SLA, notes et prétentions salariales.
- [ ] Conserver les 5 colonnes Kanban existantes.
- [ ] Autoriser les changements d'étape uniquement aux rôles habilités (`can_manage_candidates`).
- [ ] Vérifier les transitions permises entre colonnes.
- [ ] Exiger un motif lors d'un refus.
- [ ] Planifier un entretien avec date, heure, type et candidat.
- [ ] Prévoir une table dédiée aux entretiens si ces rendez-vous doivent être persistés ; elle n'est pas présente dans le schéma SQL actuel.
- [ ] Retourner à React les données nécessaires aux modales et aux invitations.
- [ ] Ne pas inventer d'e-mail ou de téléphone pour les candidats lorsque ces informations ne sont pas renseignées.

---

## 12. Onboarding

- [ ] Créer `GET /api/onboarding`.
- [ ] Créer `GET /api/onboarding/{id}`.
- [ ] Charger les personnes depuis `onboarding_people`.
- [ ] Retourner les informations affichées par les cartes : nom, département, poste, date d'arrivée, jours restants, tâches terminées et total.
- [ ] Si l'interface permet de modifier les tâches, ajouter des endpoints de mise à jour et persister ces changements.
- [ ] Définir les droits de consultation et de modification.
- [ ] Ne pas ajouter de nouveaux écrans React.

---

## 13. Dashboard et indicateurs

- [ ] Créer `GET /api/dashboard`.
- [ ] Calculer les indicateurs depuis PostgreSQL : demandes à qualifier, recrutements actifs, offres publiées et entrées prévues.
- [ ] Adapter les résultats à l'utilisateur connecté et à ses droits.
- [ ] Fournir les données des cartes KPI du registre.
- [ ] Fournir les agrégats nécessaires par département et par manager.
- [ ] Vérifier que les chiffres du dashboard correspondent aux listes détaillées.
- [ ] Ne pas conserver des valeurs fixes de démonstration lorsque les données réelles sont disponibles.

---

## 14. Référentiels et données RH complémentaires

La documentation mentionne `ReferentielsAdminView.tsx`, mais ne décrit pas complètement toutes ses opérations ni le modèle de données des grilles salariales.

- [ ] Examiner les actions exactes déjà proposées dans l'écran des référentiels.
- [ ] Identifier les tables SQL existantes qui correspondent à ces actions.
- [ ] Si les grilles de grades, les plafonds départementaux ou les taux de charges doivent être modifiables, définir les tables manquantes avant de coder les API.
- [ ] Créer les endpoints de lecture et de modification uniquement après validation des règles d'accès.
- [ ] Ne pas inventer de barèmes ou de règles de paie absents des données fournies.

Les tables salariés, documents, pointage et congés sont présentes dans le SQL, mais leur fonctionnement détaillé n'est pas décrit dans la documentation front fournie. Les développer dans une phase séparée après avoir vérifié les écrans et les besoins exacts.

---

## 15. Contrat API : ne pas casser les composants React

C'est un point essentiel de la migration.

- [ ] Étudier les types de `src/types/sirh.ts`.
- [ ] Pour chaque écran, identifier les propriétés réellement lues dans les objets.
- [ ] Créer des DTO dont les réponses JSON correspondent autant que possible aux structures TypeScript existantes.
- [ ] Conserver les identifiants, statuts, noms de propriétés et formats attendus par React.
- [ ] Si les noms SQL/Java sont différents, effectuer le mapping dans les DTO.
- [ ] Prévoir une couche de services API côté React (ex. `src/services/api.ts`, `authApi.ts`, `requisitionApi.ts`, etc.) sans toucher à la présentation des composants.
- [ ] Remplacer les imports directs de `mockData.ts` par des appels API progressivement.
- [ ] Garder les mêmes fonctions et signatures utilisées par les composants lorsque c'est possible.
- [ ] Gérer les états de chargement, erreurs réseau et réponses vides sans supprimer les composants existants.
- [ ] Conserver les messages de succès/erreur et les notifications Toast.
- [ ] Conserver les filtres côté interface ; le back-end peut les exécuter à partir des paramètres transmis.
- [ ] Ne pas faire dépendre le front des noms internes des entités JPA.
- [ ] Ne pas envoyer au serveur les champs de rôle ou de validateur comme preuve d'autorisation : le serveur doit les déduire du token.

### Exemple de contrat

Requête :
```http
GET /api/requisitions?status=en_cours_finance&departmentId=dept-dsi-cloud
Authorization: Bearer <token>
```

Réponse indicative :
```json
[
  {
    "id": "req-0042",
    "code": "REQ-2026-0042",
    "title": "Ingénieur DevSecOps Senior",
    "departmentId": "dept-dsi-cloud",
    "status": "en_cours_finance",
    "priority": "urgente",
    "salaryMin": 3000,
    "salaryMax": 3600,
    "currency": "EUR"
  }
]
```

Les propriétés exactes doivent être alignées sur `sirh.ts` et sur les champs effectivement utilisés dans les vues. Cet exemple n'est qu'une illustration du contrat.

---

## 16. Gestion des erreurs et validation des entrées

- [ ] Utiliser les annotations Jakarta Validation (`@NotNull`, `@NotBlank`, `@Email`, `@Size`, `@DecimalMin`, etc.).
- [ ] Créer un `GlobalExceptionHandler` avec `@RestControllerAdvice`.
- [ ] Retourner des erreurs JSON cohérentes.
- [ ] Distinguer :
  - `400 Bad Request` : données invalides ;
  - `401 Unauthorized` : non authentifié ;
  - `403 Forbidden` : rôle ou permission insuffisante ;
  - `404 Not Found` : ressource absente ;
  - `409 Conflict` : transition métier impossible ou statut incompatible ;
  - `500 Internal Server Error` : erreur inattendue.
- [ ] Ne jamais retourner de stack trace ou d'information sensible au navigateur.
- [ ] Vérifier les champs obligatoires et les règles de cohérence dans les services Java.
- [ ] Ajouter des messages explicites que React pourra afficher avec ses Toast existants.

---

## 17. Tests à réaliser

### 17.1 Tests unitaires des services

- [ ] Création d'une demande valide.
- [ ] Refus d'une demande avec des champs obligatoires manquants.
- [ ] Refus d'un manager qui choisit un département qu'il ne gère pas.
- [ ] Refus d'une validation RH par le demandeur.
- [ ] Refus d'une validation RH par un utilisateur non RH.
- [ ] Calcul du coût employeur.
- [ ] Détection d'un dépassement budgétaire.
- [ ] Exigence du motif de dérogation lorsque nécessaire.
- [ ] Refus d'une validation Finance par un utilisateur non autorisé.
- [ ] Refus d'une approbation Direction avant validation Finance.
- [ ] Acceptation de l'approbation Direction après validations RH et Finance.
- [ ] Refus des transitions de statut incohérentes.
- [ ] Enregistrement de chaque action dans l'audit.

### 17.2 Tests d'intégration API + PostgreSQL

- [ ] Tester les endpoints avec une vraie base PostgreSQL de test.
- [ ] Tester les relations et contraintes SQL.
- [ ] Vérifier la persistance après redémarrage du serveur.
- [ ] Vérifier les réponses `401`, `403`, `404`, `409` et `400`.
- [ ] Tester les filtres combinés.
- [ ] Tester les transactions : si une validation échoue, aucune partie de la décision ne doit être enregistrée.

### 17.3 Scénario complet de non-régression

1. Se connecter en Manager.
2. Consulter les départements gérés.
3. Créer une demande.
4. Vérifier qu'elle apparaît dans le registre et le dashboard.
5. Se connecter en RH.
6. Qualifier la demande et transmettre à Finance.
7. Tenter d'accéder à l'étape Direction sans validation Finance : l'API doit refuser.
8. Se connecter en Finance.
9. Valider le budget et enregistrer le motif de dérogation si nécessaire.
10. Vérifier que la demande passe à `en_cours_direction`.
11. Se connecter en Direction.
12. Approuver et signer.
13. Vérifier le statut `publiee`, le poste disponible et l'historique complet.
14. Vérifier que le Kanban et les autres vues React continuent à fonctionner.
15. Vérifier les droits d'accès avec chaque rôle.

---

## 18. Plan de migration conseillé, sans régression

Procéder par petites étapes. Ne pas remplacer toutes les données simulées en une seule fois.

### Phase 1 — Socle technique
- [ ] Créer Spring Boot et connecter PostgreSQL.
- [ ] Mapper les entités prioritaires.
- [ ] Tester la lecture simple des utilisateurs et départements.
- [ ] Mettre en place la gestion d'erreurs et CORS.

### Phase 2 — Authentification
- [ ] Implémenter login, token et profil courant.
- [ ] Protéger les API.
- [ ] Brancher la connexion React sur l'API.
- [ ] Vérifier que l'historique des e-mails fonctionne toujours et ne mémorise aucun mot de passe.

### Phase 3 — Lecture des données
- [ ] Brancher utilisateurs, départements et postes.
- [ ] Brancher la liste et le détail des demandes.
- [ ] Brancher les KPI et les filtres.
- [ ] Comparer visuellement et fonctionnellement le front avec la version utilisant les mocks.

### Phase 4 — Écritures et workflow
- [ ] Brancher la création et la modification des demandes.
- [ ] Implémenter les validations RH.
- [ ] Implémenter la validation Finance obligatoire.
- [ ] Implémenter l'approbation Direction après Finance.
- [ ] Ajouter les transactions et l'audit.
- [ ] Tester tous les scénarios de refus et de transitions interdites.

### Phase 5 — Candidats et onboarding
- [ ] Brancher les candidats et les changements Kanban.
- [ ] Brancher la planification d'entretien après définition de son stockage.
- [ ] Brancher l'onboarding.

### Phase 6 — Stabilisation
- [ ] Tester tous les rôles.
- [ ] Tester toutes les vues React.
- [ ] Supprimer les données de démonstration uniquement lorsqu'elles sont effectivement remplacées par l'API.
- [ ] Vérifier qu'aucune fonctionnalité front existante n'a disparu.
- [ ] Documenter les endpoints et les variables de configuration.
- [ ] Préparer les scripts de démarrage et de déploiement.

---

## 19. Critères de validation finale

Le travail back-end est considéré comme terminé lorsque :

- [ ] React utilise l'API Spring Boot pour les données métier au lieu de dépendre de `mockData.ts` en fonctionnement normal.
- [ ] PostgreSQL conserve les données et les changements survivent au redémarrage.
- [ ] Les rôles et permissions sont vérifiés côté serveur.
- [ ] Les calculs et validations métier sont exécutés côté Java.
- [ ] Le workflow suit obligatoirement Manager → RH → Finance → Direction.
- [ ] Une demande ne peut jamais passer à Direction sans validation Finance approuvée.
- [ ] La publication est impossible sans validation Direction.
- [ ] Les décisions et changements sont tracés dans l'audit.
- [ ] Les écrans, styles, composants, filtres, modales, raccourcis et comportements existants de React sont préservés.
- [ ] Tous les scénarios principaux passent les tests.

---

## 20. Points à clarifier avant de commencer

Ces éléments ne sont pas entièrement spécifiés dans la documentation front ou dans le schéma SQL actuel. Il faut les confirmer avec l'équipe avant de figer le comportement :

1. **Refus RH / Finance / Direction :** une demande refusée est-elle clôturée, renvoyée au manager pour correction, ou renvoyée à l'étape précédente ?
2. **Règle budgétaire :** le taux de charges de 40 % et la tolérance de 10 % sont-ils des règles fixes ou des exemples d'interface ?
3. **Référentiels :** où sont stockées les grilles salariales et les règles de plafond si elles doivent être modifiables ?
4. **Entretiens :** faut-il persister les rendez-vous dans une nouvelle table `interviews` ?
5. **Publication :** la validation Direction crée-t-elle toujours un nouvel `available_position`, ou doit-elle rattacher la demande à un poste déjà existant ?
6. **Comptes de démonstration :** quels mots de passe définitifs doivent être configurés côté serveur ? Les mots de passe présents dans les mocks ne doivent pas être utilisés comme mots de passe en clair en production.
7. **Référentiels complémentaires :** les écrans salariés, pointage et congés sont-ils dans le périmètre de cette première version du back-end ?

Tant que ces points ne sont pas confirmés, développer les parties non ambiguës et isoler les règles concernées dans des services configurables, sans inventer de comportement métier.

---

## 21. Fichiers de référence

- `todo.md` : documentation des fonctionnalités et comportements actuels du front React.
- `src/types/sirh.ts` : contrats TypeScript à préserver.
- `src/data/mockData.ts` : données de simulation et valeurs de référence.
- `schema_sirh_corrige.sql` : structure PostgreSQL cible.
- `sirh_donnees_test_corrige.sql` : jeu de données de test.

**Consigne finale pour le développement :** implémenter le back-end autour du fonctionnement existant. Ne pas refaire le front. Ne déplacer vers Java que les traitements, les règles métier, les accès aux données et les contrôles de sécurité. La seule modification fonctionnelle du workflow est l'obligation de validation Finance avant l'étape Direction.
