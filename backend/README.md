# Backend SIRH

API Spring Boot disponible sur `http://localhost:8080/api`. La base attendue est PostgreSQL `sirh`, initialisée avec `src/data/schema-possible.sql` puis `src/data/02-test-data.sql` depuis la racine du dépôt.

## Configuration locale

Valeurs par défaut : `jdbc:postgresql://localhost:5432/sirh`, utilisateur `postgres`, mot de passe vide. On peut les remplacer avec `SIRH_DB_URL`, `SIRH_DB_USERNAME`, `SIRH_DB_PASSWORD`, `SIRH_CORS_ORIGINS` et `SIRH_JWT_SECRET`. Ne pas enregistrer de secret local dans Git. Hibernate est en validation de schéma (`ddl-auto=validate`) et ne doit pas créer ni modifier les tables.

Pour les tests locaux seulement, les comptes démo peuvent recevoir les mots de passe des cartes de connexion (RH `rh`, manager `manager`, finance `finance`, direction `codir`). Dans PowerShell, les définir uniquement dans la session locale avant le lancement : `$env:SIRH_DEMO_CREDENTIALS_ENABLED='true'`, puis `$env:SIRH_DEMO_PASSWORD_RH='rh'`, `$env:SIRH_DEMO_PASSWORD_MANAGER='manager'`, `$env:SIRH_DEMO_PASSWORD_FINANCE='finance'` et `$env:SIRH_DEMO_PASSWORD_DIRECTION='codir'`. L’application les chiffre en BCrypt et ne stocke que les hashes. Ne pas activer cette option hors tests locaux.

## Lancement

Windows PowerShell :

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'
.\mvnw.cmd spring-boot:run
```

## API de lecture disponible

- `GET /api/health`
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/users` (jeton Bearer requis)
- `GET /api/departments`, `GET /api/departments/{id}`
- `GET /api/departments/{id}/positions`, `GET /api/positions`
- `GET /api/requisitions?departmentId=...&status=...&search=...`
- `GET /api/requisitions/{id}`, `GET /api/requisitions/{id}/history`
- `GET /api/candidates`, `GET /api/onboarding`
- `GET /api/dashboard/summary`

Les ressources de lecture sont protégées par jeton Bearer et lues depuis PostgreSQL. Les API d’écriture et le contrôle fin des permissions métier restent à compléter avant tout usage partagé ou de production.
