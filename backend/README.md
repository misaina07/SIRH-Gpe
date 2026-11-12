# Backend SIRH

API Spring Boot disponible sur `http://localhost:8080/api`. La base attendue est PostgreSQL `sirh`, initialisée avec `src/data/schema-possible.sql`, `src/data/02-test-data.sql`, puis la migration additive `src/data/03-bloc5-misaina.sql` depuis la racine du dépôt.

## Configuration locale

Valeurs par défaut : `jdbc:postgresql://localhost:5432/sirh`, utilisateur `postgres`, mot de passe vide. On peut les remplacer avec `SIRH_DB_URL`, `SIRH_DB_USERNAME`, `SIRH_DB_PASSWORD`, `SIRH_CORS_ORIGINS` et `SIRH_JWT_SECRET`. Ne pas enregistrer de secret local dans Git. Hibernate est en validation de schéma (`ddl-auto=validate`) et ne doit pas créer ni modifier les tables.

Le NIR est chiffré avec AES-256-GCM. Pour saisir ou consulter un NIR, définir `SIRH_NATIONAL_ID_KEY` dans l'environnement du backend avec une clé Base64 de 32 octets (génération locale : `openssl rand -base64 32`). Conserver cette clé dans un gestionnaire de secrets; perdre ou remplacer la clé rend les NIR déjà chiffrés illisibles. Elle est facultative tant qu'aucun NIR n'est renseigné.

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
- `GET /api/employees/managers?departmentId=...`
- `GET /api/employees/{id}/career`, `GET /api/employees/{id}/contracts`
- `POST /api/candidates/{id}/employee` (RH)

Les routes du dossier salarié sont protégées par jeton Bearer et contrôles RH/Direction/Manager/Salarié. Les lectures de dossiers et d'historiques sont consignées dans `gdpr_access_audit`; les managers sont limités à leurs départements et ne reçoivent pas les salaires ni les données personnelles RH. La conversion d'un candidat retenu est atomique et crée le contrat initial, le matricule, le rattachement et l'événement de carrière.
