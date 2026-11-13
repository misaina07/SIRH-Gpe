# Guide de test utilisateur - SIRH Entreprise

Ce guide accompagne la recette manuelle des blocs 5, 6 et 7 du portail SIRH.

- **Bloc 5 :** dossier administratif du salarie
- **Bloc 6 :** temps de travail et pointage
- **Bloc 7 :** conges et absences

Les trois images du sujet correspondent a ces trois blocs. Les parcours marques **Obligatoire** doivent etre verifies en priorite. Les fonctionnalites marquees **Bonus** sont des extensions ajoutees au-dela du besoin minimal.

## 1. Preparation

### 1.1 Pre-requis

- Java 21
- Node.js et npm
- PostgreSQL 18 ou compatible
- Base PostgreSQL `sirh`
- Port frontend : `3000`
- Port backend : `8080`

### 1.2 Initialiser PostgreSQL

Depuis la racine du projet, executer les scripts dans cet ordre sur la base `sirh` :

```powershell
psql -U postgres -d sirh -f src/data/schema-possible.sql
psql -U postgres -d sirh -f src/data/02-test-data.sql
psql -U postgres -d sirh -f src/data/03-bloc5-misaina.sql
psql -U postgres -d sirh -f src/data/04-bloc5-dossier-complet.sql
psql -U postgres -d sirh -f src/data/05-bloc6-pointage.sql
psql -U postgres -d sirh -f src/data/06-bloc7-dylan.sql
psql -U postgres -d sirh -f src/data/07-tonton-paie.sql
```

La configuration par defaut utilise :

```text
URL      jdbc:postgresql://localhost:5432/sirh
Utilisateur postgres
Mot de passe vide
```

Les valeurs peuvent etre remplacees avec `SIRH_DB_URL`, `SIRH_DB_USERNAME` et `SIRH_DB_PASSWORD`.

### 1.3 Lancer l'application

Terminal backend :

```powershell
cd backend
$env:SIRH_DEMO_CREDENTIALS_ENABLED='true'
$env:SIRH_DEMO_PASSWORD_RH='rh'
$env:SIRH_DEMO_PASSWORD_MANAGER='manager'
$env:SIRH_DEMO_PASSWORD_FINANCE='finance'
$env:SIRH_DEMO_PASSWORD_DIRECTION='codir'
.\mvnw.cmd spring-boot:run
```

Terminal frontend :

```powershell
npm install
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

> Les mots de passe de demonstration ne doivent etre actives que pour les tests locaux.

### 1.4 Comptes de recette

| Compte | Role | Mot de passe local | Tests principaux |
|---|---|---|---|
| `c.delorme@entreprise.fr` | RH | `rh` | Dossier complet, validations RH, GED, calendrier |
| `m.lefebvre@entreprise.fr` | Manager | `manager` | Equipe, pointage manager, validations manager |
| `g.vaudon@entreprise.fr` | Finance | `finance` | Validation budget et export paie |
| `direction@entreprise.fr` | Direction | `codir` | Approbation finale et consultation autorisee |

Le compte employe doit etre relie a une ligne `employees.user_id`. Le test d'integration PostgreSQL cree automatiquement une fixture employe temporaire ; pour une recette manuelle, utiliser un compte ayant `role_type='Employee'`.

## 2. Parcours obligatoires

## Bloc 5 - Dossier administratif du salarie

### B5-01 - Annuaire et fiche salarie

1. Se connecter avec le compte RH.
2. Ouvrir **Employes / Contrats**.
3. Rechercher un salarie par nom ou departement.
4. Ouvrir sa fiche.
5. Verifier les informations suivantes : identite, contact, departement, manager, contrat, poste et statut.
6. Ouvrir l'historique de carriere et les contrats.

**Resultat attendu :** la fiche affiche les donnees correspondant au salarie et les informations sensibles ne sont pas exposees aux roles non autorises.

### B5-02 - Conversion candidat vers salarie

1. Se connecter avec le compte RH.
2. Ouvrir le vivier des candidats.
3. Selectionner un candidat retenu.
4. Utiliser l'action de conversion en salarie.
5. Renseigner le contrat initial et le salaire.
6. Ouvrir la fiche creee.

**Resultat attendu :** un matricule, une fiche salarie, un contrat initial, un rattachement departemental et un evenement de carriere sont crees dans une operation coherente.

### B5-03 - Confidentialite et habilitations

1. Avec le compte RH, consulter la fiche et les donnees autorisees.
2. Avec un compte Manager, consulter un salarie de son departement.
3. Verifier que le manager ne voit ni salaire, ni NIR, ni documents medicaux.
4. Essayer de consulter un salarie d'un autre departement.
5. Avec un compte Employee, essayer de consulter le dossier d'un autre salarie.

**Resultat attendu :** les acces interdits sont refuses par le backend, meme si l'interface est contournee.

## Bloc 6 - Temps de travail et pointage

### B6-01 - Pointage quotidien

1. Se connecter avec un compte Employee.
2. Ouvrir **Pointage**.
3. Cliquer sur **Arrivee**.
4. Verifier l'heure serveur et l'evenement affiche.
5. Cliquer sur **Debut de pause**, puis **Reprise**.
6. Cliquer sur **Depart**.
7. Verifier le cumul du temps travaille.

**Resultat attendu :** les evenements sont enregistres dans l'ordre et l'heure utilisee est celle du serveur.

### B6-02 - Feuille de temps et heures supplementaires

1. Se connecter avec RH ou Manager.
2. Ouvrir les feuilles de temps.
3. Choisir une periode mensuelle.
4. Verifier le temps effectif, les pauses et les heures supplementaires a 25 % et 50 %.
5. Verifier les anomalies affichees.

**Resultat attendu :** les totaux sont calcules par le backend et les donnees sont limitees au perimetre du manager.

### B6-03 - Anomalies et regularisation

1. Depuis un compte Employee, envoyer une demande de regularisation avec un motif.
2. Depuis RH ou Manager, ouvrir la file des regularisations.
3. Approuver ou refuser la demande.
4. Rejouer une transition invalide, par exemple **Depart** immediatement apres **Arrivee** sans pause.

**Resultat attendu :** le motif est obligatoire, la demande passe par un visa, et les transitions impossibles sont refusees.

## Bloc 7 - Conges et absences

### B7-01 - Consultation des soldes

1. Se connecter avec un compte Employee.
2. Ouvrir **Conges**.
3. Verifier les soldes de conges payes, RTT et autres types disponibles.
4. Verifier les annees N et N-1 lorsqu'elles sont configurees.

**Resultat attendu :** les soldes affiches correspondent aux donnees PostgreSQL.

### B7-02 - Simulation et depot d'une demande

1. Choisir un type de conge.
2. Choisir les dates de debut et de fin.
3. Choisir la journee complete, le matin ou l'apres-midi.
4. Cliquer sur **Calculer l'impact**.
5. Verifier la duree demandee, le solde projete et l'impact equipe.
6. Soumettre la demande.

**Resultat attendu :** les jours feries et week-ends sont pris en compte, le solde insuffisant bloque l'envoi et la demande apparait en attente manager.

### B7-03 - Validation manager puis RH

1. Soumettre une demande necessitant un visa RH.
2. Avec le compte Manager, ouvrir la file d'approbation.
3. Approuver, refuser avec motif ou demander un ajustement.
4. Pour une demande exceptionnelle, verifier le passage en attente RH.
5. Avec RH, approuver ou refuser avec motif.
6. Verifier la mise a jour du solde apres approbation.

**Resultat attendu :** une demande ne peut pas sauter une etape ; un refus ou un ajustement exige un motif.

### B7-04 - Chevauchement et justificatif

1. Soumettre une premiere demande.
2. Soumettre une seconde demande sur une periode identique ou intersectee.
3. Pour un arret maladie ou un mariage, essayer d'envoyer sans justificatif.
4. Envoyer ensuite un PDF, JPEG ou PNG valide de moins de 8 Mo.

**Resultat attendu :** le chevauchement est refuse et le justificatif est obligatoire pour les types concernes.

## 3. Fonctionnalites bonus

Ces fonctionnalites ne constituent pas le minimum decrit par les trois sujets, mais elles sont disponibles dans le projet et doivent etre testees apres les parcours obligatoires.

### Bonus B5 - Dossier salarie

- **GED chiffree :** televersement, verification RH, téléchargement et controle du type MIME.
- **Dates d'expiration :** notifications J-30, J-7 et J-0 pour les documents.
- **Masquage des donnees sensibles :** NIR et RIB ne sont reveles qu'avec une autorisation explicite.
- **Demandes de modification personnelles :** un salarie propose une modification, RH l'approuve ou la refuse.
- **Anonymisation RGPD :** un dossier sortant peut etre anonymise uniquement si une politique de conservation existe.
- **Timeline de carriere :** ajout d'evenements de promotion, mobilite ou changement de contrat.
- **Annuaire avance :** filtres par departement, manager, competence et localisation.
- **Organigramme manager :** affichage des equipes et des departements supervises.
- **Audit GDPR :** lecture des donnees sensibles inscrite dans `gdpr_access_audit`.

### Bonus B6 - Temps et pointage

- **Horaires hebdomadaires configurables :** RH definit les horaires de reference par jour.
- **Detection automatique :** sortie oubliee, retard de plus de 15 minutes, amplitude superieure a 10 heures et repos inferieur a 11 heures.
- **Idempotence :** un double clic ou une meme cle d'idempotence ne cree pas deux pointages.
- **Choix de recuperation :** paiement des heures supplementaires ou versement au CET.
- **Regularisation tracee :** auteur, motif, date, validateur et decision sont conserves.
- **Astreinte :** les primes d'astreinte peuvent alimenter les variables de paie.

### Bonus B7 - Conges et absences

- **Calendrier parametrable :** jours ouvrés ou ouvrables.
- **Jours feries regionaux :** ajout et suppression par les RH.
- **Acquisition mensuelle :** configuration des droits, par exemple 2,08 jours de CP par mois.
- **Impact equipe :** alerte configurable selon le ratio d'absents du departement.
- **Calendrier equipe :** vue des absences approuvees par mois.
- **Demandes ajustables :** modification et renvoi apres retour manager/RH.
- **Annulation :** annulation possible tant que la demande n'est pas definitive.
- **Justificatifs chiffres :** stockage chiffre et téléchargement autorise uniquement au salarie concerne et aux RH.

### Bonus transverse - Paie, qualite et securite

- **Variables de paie mensuelles :** consolidation des heures supplementaires, absences non remunerees, astreintes et preference de recuperation.
- **Export paie CSV :** RH ou Finance peuvent utiliser `GET /api/payroll/{yyyy-MM}/export.csv`.
- **Snapshot paie :** les variables generees sont conservees dans `payroll_monthly_variables`.
- **Protection des validations :** les decisions sont transactionnelles et le statut courant est controle.
- **CI PostgreSQL :** [.github/workflows/ci.yml](.github/workflows/ci.yml) initialise PostgreSQL, applique les migrations et execute les tests.
- **Decoupage frontend :** les vues sont chargees a la demande ; le bundle principal reste sous 500 Ko.

## 4. Tests techniques automatises

Depuis la racine :

```powershell
npm run lint
npm run build
```

Depuis `backend` :

```powershell
.\mvnw.cmd test
```

Le test `OperationalFlowPostgresTest` verifie notamment :

- la presence des tables des migrations operationnelles ;
- la creation d'une fixture salariee ;
- l'enregistrement d'un pointage ;
- le refus d'une transition de pointage invalide ;
- la soumission d'un conge ;
- le refus d'un chevauchement ;
- l'audit GDPR d'une lecture ;
- le refus d'acces au dossier d'un autre salarie.

## 5. Fiche de recette

Pour chaque test, noter :

| ID | Resultat | Commentaire | Capture |
|---|---|---|---|
| B5-01 | OK / KO |  |  |
| B5-02 | OK / KO |  |  |
| B5-03 | OK / KO |  |  |
| B6-01 | OK / KO |  |  |
| B6-02 | OK / KO |  |  |
| B6-03 | OK / KO |  |  |
| B7-01 | OK / KO |  |  |
| B7-02 | OK / KO |  |  |
| B7-03 | OK / KO |  |  |
| B7-04 | OK / KO |  |  |
| BONUS | OK / KO |  |  |

Une recette est consideree complete lorsque tous les tests obligatoires sont `OK`, les erreurs sont documentees et les tests automatises passent sans echec.
