# DTO et calculs de paie

## Flux général

```text
PayrollCalculationRequest
        |
        v
PayrollCollectionService
        |
        v
PayrollInput
        |
        v
PayrollBaseCalculationService
        |
        v
PayrollCalculationResult
        |
        v
PayrollLine -> ligne_bulletin
```

## Rôle des DTO

### PayrollCalculationRequest

Représente les paramètres demandés par une future API de calcul :

- `employeeId` : salarié cible, facultatif pour un calcul global ;
- `from` : début de la période de paie ;
- `to` : fin de la période de paie.

Il ne contient pas de montant calculé. Il décrit uniquement ce que le moteur doit traiter.

### PayrollInput

Contient toutes les données nécessaires au calcul d'un bulletin :

- contrat : salaire mensuel, primes, régime de travail, grade ;
- pointage : heures travaillées et heures supplémentaires ;
- congés : jours d'absence et jours sans solde ;
- majorations : nuit, dimanche et jours fériés ;
- saisies manuelles : indemnités, rappels, avances.

Ce DTO sépare le moteur de calcul de `JdbcTemplate` et des `Map<String, Object>`.

### PayrollManualVariable

Décrit une saisie saisie manuellement par la RH :

- code de rubrique ;
- libellé ;
- gain ou retenue ;
- quantité ;
- montant ;
- semaine, pour les éléments hebdomadaires.

Exemples : `INDEMNITE`, `RAPPEL`, `AVANCE` ou `SANS_SOLDE`.

### PayrollLine

Représente une ligne persistée dans `ligne_bulletin`.

Chaque étape du calcul produit une ligne :

- salaire de base ;
- retenue d'absence ;
- heures supplémentaires ;
- cotisations ;
- IRSA ;
- avances.

Les champs sont :

- `code` : identifiant stable de la rubrique ;
- `label` : libellé affiché ;
- `type` : `GAIN` ou `RETENUE` ;
- `quantity` : nombre d'unités ;
- `rate` : taux ou valeur unitaire ;
- `amount` : montant final de la ligne.

### PayrollCalculationResult

Contient le bulletin calculé pour un salarié :

- identité ;
- salaire de base ;
- retenue d'absence ;
- salaire brut ;
- cotisations CNaPS et OSTIE ;
- revenu imposable ;
- IRSA ;
- retenues totales ;
- salaire net ;
- coût employeur ;
- lignes détaillées.

Ce DTO est la réponse métier finale. Il ne remplace pas `bulletin_paie`, qui est la version persistée.

### PayrollCollectionResponse

Contient uniquement le résultat de la collecte :

- période demandée ;
- liste des `PayrollInput`.

Il peut être remplacé par une liste directe si l'API ne doit pas renvoyer le conteneur de période.

## Calcul du salaire de base

La classe `PayrollBaseCalculationService` réalise ces deux opérations :

```text
salaire de base du mois =
    salaire mensuel - retenue d'absence

taux horaire =
    salaire mensuel / diviseur horaire
```

Le diviseur est :

- `173.33` pour un salarié non agricole ;
- `200.00` pour un salarié du secteur agricole.

Tous les montants utilisent `BigDecimal` et sont arrondis à deux décimales avec `HALF_UP`.

## Exemple

Pour un salaire mensuel de 250 000 Ar :

```text
taux horaire = 250000 / 173.33 = 1442.34 Ar
```

Avec une retenue d'absence de 10 000 Ar :

```text
salaire de base du mois = 250000 - 10000 = 240000 Ar
```

## Règle importante

La retenue d'absence doit être calculée à partir des données approuvées du Bloc 7, puis passée au service de calcul.

Le service ne doit jamais utiliser une valeur envoyée directement par React comme montant imposable ou salaire net.
