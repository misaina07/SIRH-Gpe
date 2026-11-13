# Bloc 7 — Congés et absences

## 1. Objectif du bloc

Le bloc 7 permet de gérer les congés et les absences des salariés.

Il répond à quatre besoins principaux :

1. Consulter les types de congés disponibles.
2. Consulter les soldes de congés d'un salarié.
3. Créer une demande de congé.
4. Faire valider ou refuser une demande par un manager ou les RH.

Le bloc 7 doit garantir que les demandes respectent les règles métier de base :

- la date de fin ne peut pas être antérieure à la date de début ;
- les samedis et dimanches ne sont pas décomptés ;
- le salarié ne peut pas dépasser son solde disponible ;
- deux demandes en attente ne peuvent pas se chevaucher ;
- un justificatif est obligatoire pour certains types d'absence ;
- un motif est obligatoire lorsqu'une demande est refusée ;
- seul le manager du département concerné ou un utilisateur RH peut valider.

## 2. Fonctionnement métier

### 2.1 Consultation des soldes

Le salarié ouvre la page **Congés & absences**. Les soldes disponibles sont récupérés depuis la table `leave_balances`.

Pour chaque type de congé, l'écran affiche :

- le nombre de jours acquis ;
- le nombre de jours déjà pris ;
- le nombre de jours restants.

Exemple :

```text
Congés payés
15 jours restants
5 jours pris sur 20 jours acquis
```

### 2.2 Création d'une demande

Le salarié sélectionne :

- le type de congé ;
- la date de début ;
- la date de fin ;
- le justificatif si le type de congé l'exige.

Le backend calcule lui-même le nombre de jours ouvrés. Le navigateur ne décide donc pas du nombre de jours à décompter.

Une demande valide est créée avec le statut :

```text
en_attente
```

Le salarié peut ensuite suivre l'état de sa demande depuis la même page.

### 2.3 Validation ou refus

Les demandes des départements supervisés sont visibles par le manager concerné. Les RH peuvent consulter les demandes et les traiter.

Une validation :

1. passe la demande à `approuve` ;
2. augmente le nombre de jours pris ;
3. diminue le solde restant.

Un refus :

1. passe la demande à `refuse` ;
2. conserve le solde du salarié ;
3. enregistre le motif du refus.

Les demandes déjà traitées ne peuvent plus être modifiées.

## 3. Ce qui a été développé

### 3.1 Backend Spring Boot

Le backend utilise l'architecture existante du projet :

```text
Controller → Service → JdbcTemplate → PostgreSQL
```

#### Contrôleur

[LeaveController.java](../backend/src/main/java/com/example/sirh/controller/LeaveController.java)

Ce contrôleur expose les routes HTTP du bloc 7 :

| Méthode | Route | Fonction |
|---|---|---|
| `GET` | `/api/leaves/types` | Récupérer les types de congés |
| `GET` | `/api/leaves/balances` | Récupérer les soldes du salarié connecté |
| `GET` | `/api/leaves/requests` | Récupérer les demandes |
| `POST` | `/api/leaves/requests` | Créer une demande |
| `PATCH` | `/api/leaves/requests/{id}/decision` | Approuver ou refuser une demande |

#### Service métier

[LeaveService.java](../backend/src/main/java/com/example/sirh/service/LeaveService.java)

Le service contient les règles importantes :

- calcul des jours ouvrés ;
- recherche du salarié lié au compte connecté ;
- vérification de l'existence du type de congé ;
- vérification du justificatif ;
- vérification du solde ;
- contrôle des chevauchements ;
- filtrage des demandes accessibles au manager ;
- autorisation des RH ;
- mise à jour transactionnelle du solde ;
- protection contre le double traitement d'une demande.

Les opérations de création et de validation utilisent une transaction Spring afin d'éviter une mise à jour partielle du solde.

### 3.2 DTO backend

[CreateLeaveRequest.java](../backend/src/main/java/com/example/sirh/dto/CreateLeaveRequest.java) définit les données nécessaires pour créer une demande :

```json
{
  "leaveTypeId": "CP",
  "startDate": "2026-12-21",
  "endDate": "2026-12-24",
  "justificationFileUrl": null
}
```

[LeaveDecisionRequest.java](../backend/src/main/java/com/example/sirh/dto/LeaveDecisionRequest.java) définit une décision :

```json
{
  "approved": false,
  "rejectionReason": "Période incompatible avec les besoins du service"
}
```

### 3.3 Frontend React

[LeaveManagementView.tsx](../src/views/LeaveManagementView.tsx) fournit l'écran React du bloc 7.

L'écran permet de :

- visualiser les soldes ;
- sélectionner un type de congé ;
- sélectionner une période ;
- fournir une URL de justificatif ;
- envoyer une demande ;
- consulter l'historique des demandes ;
- approuver ou refuser une demande lorsqu'on est manager ou RH.

Les modèles TypeScript se trouvent dans [leaves.ts](../src/types/leaves.ts).

La nouvelle vue est déclarée dans [sirh.ts](../src/types/sirh.ts) avec le mode :

```text
conges-absences
```

Elle est accessible depuis la navigation de [Sidebar.tsx](../src/components/Sidebar.tsx).

### 3.4 Données de démonstration

Les profils de démonstration ont été mis à jour dans [02-test-data.sql](../src/data/02-test-data.sql) afin d'autoriser l'accès à la vue `conges-absences`.

## 4. Tables PostgreSQL utilisées

Le développement utilise les tables déjà prévues dans `schema-possible.sql` :

### `leave_types`

Contient les types de congés :

```text
CP       Congés payés
RTT      Réduction du temps de travail
MALADIE  Arrêt maladie
```

La colonne `requires_justification` indique si un justificatif doit être fourni.

### `leave_balances`

Contient le solde annuel d'un salarié :

```text
employee_id
leave_type_id
period_year
acquired_days
taken_days
remaining_days
```

### `leave_requests`

Contient les demandes :

```text
employee_id
leave_type_id
start_date
end_date
total_business_days
status
rejection_reason
justification_file_url
created_at
```

Les statuts utilisés actuellement sont :

```text
en_attente
approuve
refuse
```

## 5. Sécurité et autorisations

Toutes les routes du bloc 7 sont protégées par l'authentification JWT existante.

### Matrice d'accès

| Rôle | Accès à l'interface | Consultation personnelle | Validation des demandes |
|---|---|---|---|
| Salarié | Oui, lorsqu'il est lié à un compte utilisateur | Ses propres soldes et demandes | Non |
| Manager | Oui | Ses propres soldes et demandes | Oui, uniquement pour ses départements |
| RH | Oui | Ses propres soldes et demandes | Oui, pour toutes les demandes |
| Finance | Oui si le profil est activé dans la navigation | Ses propres données si un dossier salarié lui est associé | Non |
| Direction | Oui si le profil est activé dans la navigation | Ses propres données si un dossier salarié lui est associé | Non |

Dans l'implémentation actuelle, les profils de démonstration RH, Manager, Finance et Direction voient le menu **Congés & absences**. Cependant, le droit de validation est limité au Manager et aux RH côté backend.

Un rôle Finance ou Direction ne peut donc pas approuver ou refuser une demande simplement parce qu'il voit l'interface.

Le salarié connecté est identifié à partir de la relation :

```text
users.id → employees.user_id
```

Un utilisateur ne peut consulter que ses propres soldes et ses propres demandes lorsqu'il utilise la vue personnelle.

Pour la validation :

- un manager ne peut traiter que les demandes de ses départements ;
- un utilisateur RH peut traiter les demandes ;
- les autres rôles ne sont pas autorisés à valider.

La sécurité est appliquée côté backend. Le contrôle visuel du frontend ne remplace donc pas les contrôles Spring Boot.

## 6. Tests et validation

Un test a été ajouté dans [LeaveServiceTest.java](../backend/src/test/java/com/example/sirh/LeaveServiceTest.java).

Il vérifie que :

- une semaine complète compte cinq jours ouvrés ;
- une période composée uniquement du week-end compte zéro jour.

Les commandes suivantes passent :

```bash
npm run lint
npm run build
cd backend && ./mvnw test
```

## 7. Limites actuelles

Cette première version constitue le socle fonctionnel du bloc 7. Les éléments suivants restent à ajouter pour une version complète :

- gestion réelle du téléversement des justificatifs ;
- prise en charge des demi-journées ;
- exclusion des jours fériés ;
- calendrier d'équipe ;
- avertissement lorsque trop de salariés d'un département sont absents ;
- notifications email ou notification interne ;
- export des absences vers la paie ;
- historique détaillé des décisions et audit RGPD ;
- workflow en plusieurs étapes si l'entreprise veut distinguer validation manager et validation RH.

Ces fonctionnalités peuvent être ajoutées progressivement sans modifier le principe général des routes et du service métier.

## 8. Préparation de la base de données

Pour tester le parcours complet, la base doit contenir :

1. au moins un salarié dans `employees` ;
2. au moins un type dans `leave_types` ;
3. un solde correspondant dans `leave_balances` ;
4. une relation entre l'utilisateur connecté et le salarié via `employees.user_id`.

Exemple de données minimales :

```sql
INSERT INTO leave_types (id, name, requires_justification)
VALUES ('CP', 'Congés payés', FALSE);

INSERT INTO leave_balances (
    employee_id, leave_type_id, period_year,
    acquired_days, taken_days, remaining_days
)
VALUES (1, 'CP', 2026, 25, 0, 25);
```

L'identifiant `employee_id` doit correspondre à un salarié existant dans la base.
