# Backend SIRH

API Spring Boot disponible sur `http://localhost:8080/api`. La base attendue est PostgreSQL `sirh`, initialisée avec `src/data/schema-possible.sql`, `src/data/02-test-data.sql`, puis les migrations additives `src/data/03-bloc5-misaina.sql` et `src/data/04-bloc5-dossier-complet.sql` depuis la racine du dépôt.

## Configuration locale

Valeurs par défaut : `jdbc:postgresql://localhost:5432/sirh`, utilisateur `postgres`, mot de passe vide. On peut les remplacer avec `SIRH_DB_URL`, `SIRH_DB_USERNAME`, `SIRH_DB_PASSWORD`, `SIRH_CORS_ORIGINS` et `SIRH_JWT_SECRET`. Ne pas enregistrer de secret local dans Git. Hibernate est en validation de schéma (`ddl-auto=validate`) et ne doit pas créer ni modifier les tables.

Le NIR, le RIB, les demandes de changement personnel et les fichiers GED sont chiffrés avec AES-256-GCM. Pour utiliser ces données, définir `SIRH_NATIONAL_ID_KEY` dans l'environnement du backend avec une clé Base64 de 32 octets (génération locale : `openssl rand -base64 32`). Conserver cette clé dans un gestionnaire de secrets; perdre ou remplacer la clé rend les données déjà chiffrées illisibles. Elle est facultative tant qu'aucune donnée protégée n'est renseignée.

Pour les tests locaux seulement, les comptes démo peuvent recevoir les mots de passe des cartes de connexion (RH `rh`, manager `manager`, finance `finance`, direction `codir`). Dans PowerShell, les définir uniquement dans la session locale avant le lancement : `$env:SIRH_DEMO_CREDENTIALS_ENABLED='true'`, puis `$env:SIRH_DEMO_PASSWORD_RH='rh'`, `$env:SIRH_DEMO_PASSWORD_MANAGER='manager'`, `$env:SIRH_DEMO_PASSWORD_FINANCE='finance'` et `$env:SIRH_DEMO_PASSWORD_DIRECTION='codir'`. L’application les chiffre en BCrypt et ne stocke que les hashes. Ne pas activer cette option hors tests locaux.

## Lancement

Windows PowerShell :

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'
.\mvnw.cmd spring-boot:run
```

## API disponible

- `GET /api/health`
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/users` (jeton Bearer requis)
- `GET /api/departments`, `GET /api/departments/{id}`
- `GET /api/departments/{id}/positions`, `GET /api/positions`
- `GET /api/requisitions?departmentId=...&status=...&search=...`
- `GET /api/requisitions/{id}`, `GET /api/requisitions/{id}/history`
- `GET /api/candidates`, `GET /api/onboarding`
- `GET /api/dashboard/summary`
- `GET /api/employees`, `GET /api/employees/{id}`
- `GET /api/employees/managers?departmentId=...`, `GET /api/employees/manager-directory`
- `GET /api/employees/{id}/career`, `GET /api/employees/{id}/contracts`
- `GET /api/employees/{id}/national-id` (RH uniquement, lecture explicite auditée)
- `POST /api/candidates/{id}/employee` (RH)
- `PATCH /api/employees/{id}` (RH), `POST /api/employees/{id}/contracts` (RH), `POST /api/employees/{id}/career` (RH)
- `/api/employees/{id}/documents` (GED chiffrée, vérification RH, fichiers PDF/JPEG/PNG ≤ 8 Mo)
- `GET /api/employee-document-notifications`, `POST /api/employee-documents/check-expirations` (RH)
- `/api/employees/{id}/change-requests`, `/api/employee-change-requests` (demandes salarié et validation RH)
- `/api/gdpr/retention-policies`, `POST /api/employees/{id}/anonymize` (RH)

Le contrôle quotidien des dates d’expiration est exécuté à 07:00 selon le fuseau horaire local du backend et peut être déclenché manuellement par les RH. Les échéances J-30, J-7 et J-0 créent des notifications consultables dans le module. Les politiques de conservation sont vides après migration et doivent être fixées par le responsable de traitement pour chaque catégorie (`DOSSIER`, `DOCUMENTS`, `CONTRATS`, `CARRIERE`) avant d’autoriser une anonymisation.

Les routes du dossier salarié sont protégées par jeton Bearer et contrôles RH/Direction/Manager/Salarié. Les lectures de dossiers et d'historiques sont consignées dans `gdpr_access_audit`; les managers sont limités à leurs départements et ne reçoivent pas les salaires ni les données personnelles RH. La conversion d'un candidat retenu est atomique et crée le contrat initial, le matricule, le rattachement et l'événement de carrière.

Pour activer l'espace personnel, le compte d'authentification doit avoir `role_type='Employee'` et être relié à sa fiche par `employees.user_id`. La migration autorise ce rôle et ajoute la vue de navigation aux rôles RH, Manager, Direction et Employee; la création des comptes salariés reste à faire par le processus local d'administration des identités.

Validation du bloc 5 effectuée localement : `npm run lint`, `npm run build`, `backend/mvnw.cmd test`, migration PostgreSQL rejouée, puis scénarios HTTP pour lecture paginée, conversion candidat, chiffrement/téléchargement/vérification GED, alerte J-0, refus d'accès Manager aux documents et données de rémunération, et soumission/approbation d'une demande salarié avec RIB masqué.
