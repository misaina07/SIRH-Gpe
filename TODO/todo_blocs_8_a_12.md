# To-do list — Blocs 8 à 12 du portail SIRH

- **Bloc 8 :** Paie
- **Bloc 9 :** Évaluation, compétences et formation
- **Bloc 10 :** Carrière et mobilité
- **Bloc 11 :** Discipline et sanctions
- **Bloc 12 :** Rupture et offboarding

Mise à jour : 19 novembre 2026.

## 0. Points à clarifier avant de coder

1. **Taux des heures supplémentaires.** La note de cours dit « 30 % pour les 12 premières heures, 50 % pour les 8 restantes ». L'Excel de calcul HS applique ×1,3 aux **8 premières** heures et ×1,5 aux **12 suivantes** (20 h maximum par semaine), ce qui correspond au code du travail malgache. L'ordre de la note est probablement inversé : à faire valider par l'enseignant.
2. **Plafond CNaPS.** L'Excel utilise un plafond codé en dur (`=SI(Q5*1%>10080;10080;…)`). La règle est : plafond = 8 × le salaire minimum d'embauche. Le SMIG est de 315 000 Ar depuis octobre 2026, soit un plafond d'assiette de 2 520 000 Ar, donc 25 200 Ar de CNaPS 1 %. À vérifier avec l'enseignant, et à stocker en **paramètre versionné**.
3. **Minimum de perception IRSA.** Le minimum légal est de 3 000 Ar (art. 01.03.16 du CGI). Le PLFI 2027 propose 5 000 Ar, mais ce n'est **pas encore voté**. L'Excel affiche « - » pour les bas salaires : le minimum n'y est pas appliqué. Prévoir un paramètre avec date d'effet.
4. **Secteur agricole : 200 h.** Interprété comme un diviseur mensuel de 200 h au lieu de 173,33 h (taux horaire = salaire ÷ 200). À confirmer.
5. **Barème IRSA.** Les tranches ci-dessous proviennent d'une source de vulgarisation. À recouper avec le texte de la Loi n° 2025-021 (loi de finances 2026) avant de figer les paramètres.

## 1. Calcul de l'IRSA (loi de finances 2026)

**Étape 1 — Revenu imposable**
`revenu imposable = brut − CNaPS 1 % − OSTIE 1 %`
Exemple de l'Excel : 3 000 000 − 10 080 − 30 000 = 2 959 920.

**Étape 2 — Barème progressif mensuel (par tranche)**

| Tranche mensuelle (Ar) | Taux |
|---|---|
| 0 – 350 000 | 0 % |
| 350 001 – 400 000 | 5 % |
| 400 001 – 500 000 | 10 % |
| 500 001 – 600 000 | 15 % |
| 600 001 – 4 000 000 | 20 % |
| au-delà de 4 000 000 | 25 % (nouveauté 2026, uniquement sur la part excédentaire) |

**Étape 3 — Réduction pour charges de famille** : 2 000 Ar par personne à charge, après le barème.

**Étape 4 — Minimum de perception** : si l'impôt est inférieur à 3 000 Ar, on prélève 3 000 Ar.

**Exemple avec 2 959 920 Ar**

| Calcul | Montant |
|---|---|
| 50 000 × 5 % | 2 500 |
| 100 000 × 10 % | 10 000 |
| 100 000 × 15 % | 15 000 |
| (2 959 920 − 600 000) × 20 % | 471 984 |
| **IRSA avant réduction** | **499 484** |

## 2. Bloc 8 — Paie

### 2.1 Modélisation
- [ ] Créer les tables `PeriodePaie`, `RubriquePaie`, `VariablePaie`, `BulletinPaie`, `LigneBulletin`.
- [ ] Créer une table de paramètres légaux versionnés avec date d'effet : SMIG, plafond CNaPS, taux CNaPS/OSTIE, barème IRSA, minimum de perception, réduction par charge.
- [ ] Ajouter les catégories professionnelles (4A, 5B, HC…) et les secteurs (agricole = diviseur 200 h).

### 2.2 Collecte des entrées
- [ ] Récupérer le contrat et le salaire de base.
- [ ] Récupérer le pointage (bloc 6) : HS, nuit, dimanche, jours fériés.
- [ ] Récupérer les congés et absences (bloc 7) pour les retenues sur absence.
- [ ] Gérer les saisies manuelles : indemnités, rappels, autres, avances.

### 2.3 Moteur de calcul (une ligne de bulletin par étape)
- [ ] Salaire de base du mois = base − retenues sur absence.
- [ ] Taux horaire = base ÷ 173,33 (ou ÷ 200 en secteur agricole).
- [ ] Heures supplémentaires et majorations (voir 2.4).
- [ ] Salaire brut = base du mois + indemnités + rappels + autres + HS.
- [ ] CNaPS salarié 1 % et patronal 8 %, plafonnés.
- [ ] OSTIE salarié 1 % et patronal 5 % (plafond à vérifier).
- [ ] Revenu imposable = brut − CNaPS 1 % − OSTIE 1 %.
- [ ] IRSA : barème, réduction pour charges, minimum.
- [ ] Total retenues = CNaPS + OSTIE + IRSA + avances.
- [ ] Salaire net = brut − total retenues.
- [ ] Coût employeur = brut + cotisations patronales.

### 2.4 Heures supplémentaires et majorations
- [ ] Plafond de 20 h supplémentaires par semaine : refus ou alerte au-delà.
- [ ] Tranche 1 : 8 premières heures à +30 % (×1,3).
- [ ] Tranche 2 : 12 heures suivantes à +50 % (×1,5).
- [ ] Coefficients paramétrables : week-end (×1,4 dans l'Excel), dimanche, jours fériés (×2).
- [ ] Travail de nuit de 22 h à 4 h : majoration paramétrable (×1,5 selon la note).
- [ ] Calcul hebdomadaire sur 4 à 5 semaines, comme la feuille « calcul hs ».
- [ ] Vérifier avec l'exemple : base 250 000 → taux horaire 1 442,34 ; 8 h × 1,3 ≈ 15 000 ; 4 h × 1,5 ≈ 8 654 ; total HS ≈ 23 654,30.

### 2.5 Exports
- [ ] **Fiche de paie en PDF** : en-tête société, identité, matricule, N° CNaPS, date d'embauche, ancienneté, classification, désignations/nombre/taux/montant, brut, retenues, net.
- [ ] **État de paie en Excel (.xlsx)** : colonnes NOM, date d'embauche, CAT, fonction, base, retenues absence, indemnités, rappels, HS, brut, CNaPS 1 %/8 %, OSTIE 1 %/5 %, revenu imposable, IRSA, total retenues, net, avance, avec ligne de totaux.
- [ ] Export mensuel global pour la comptabilité.

### 2.6 Sécurité et tests
- [ ] Verrouiller une période validée.
- [ ] Bulletin visible uniquement par l'employé concerné et la RH.
- [ ] Tests unitaires : 3 000 000 (plafond CNaPS), 250 000 avec 12 HS, 300 000.
- [ ] Cas limites : salaire sous 350 000 (minimum IRSA), salaire au-dessus de 4 000 000 (tranche 25 %).

## 3. Bloc 9 — Évaluation, compétences et formation

- [ ] Créer `Compétence`, `EmployéCompétence` (niveau attendu / acquis), `Objectif`, `Évaluation`, `Formation`.
- [ ] Définir objectifs et critères d'évaluation par poste ou par période, avec pondération.
- [ ] Évaluation par le manager (auto-évaluation en option), validation RH.
- [ ] Calculer l'écart entre compétences attendues et acquises.
- [ ] Déclencher un besoin de formation si l'écart dépasse un seuil.
- [ ] Catalogue de formations, inscriptions, statuts, attestations.
- [ ] Mesurer l'évolution après formation (ré-évaluation, comparaison avant/après).
- [ ] Tableau de bord : matrice de compétences par département.
- [ ] Droits : le manager ne voit que son équipe.

## 4. Bloc 10 — Carrière et mobilité

- [ ] Créer `HistoriqueAffectation`, `Promotion`, `Mutation`, `HistoriqueSalaire`.
- [ ] Modèle temporel : `date_debut` / `date_fin` sur chaque ligne, sans écraser l'historique.
- [ ] Workflows promotion, mutation, changement de poste, changement de salaire avec visas (manager, RH, finance).
- [ ] À l'approbation, mettre à jour contrat et salaire en conservant l'historique.
- [ ] Requête « carrière à la date D » : poste, département, manager, salaire, grade.
- [ ] Frise chronologique de carrière dans la fiche salarié.
- [ ] Empêcher les chevauchements de périodes d'affectation.
- [ ] Brancher la paie sur l'historique salaire (rappels rétroactifs).

## 5. Bloc 11 — Discipline et sanctions

- [ ] Créer `Incident`, `ProcédureDisciplinaire`, `Sanction`, `Document`.
- [ ] Workflow : incident → demande d'explication → réponse → décision → sanction éventuelle.
- [ ] Délais de réponse et relances.
- [ ] Types de sanctions : avertissement, blâme, **mise à pied** (dates de début et de fin), **retenue sur salaire**, rétrogradation, licenciement.
- [ ] Mise à pied reliée au pointage et aux congés : jours non travaillés et non payés.
- [ ] Coupure de salaire reliée à la paie : rubrique de retenue disciplinaire (plafond légal à vérifier).
- [ ] Pièces justificatives stockées chiffrées.
- [ ] Accès fortement restreints : RH et direction ; le manager peut seulement déclarer un incident.
- [ ] Journaliser toute consultation ou modification (qui, quand, quoi).
- [ ] Tester le refus d'accès (403) pour les rôles non autorisés.

## 6. Bloc 12 — Rupture et offboarding

- [ ] Motifs : démission, licenciement, fin de CDD, retraite, rupture conventionnelle, décès, etc.
- [ ] Préavis : durée selon motif et catégorie, date de sortie calculée.
- [ ] Droits restants : congés non pris à payer, pro-rata de la dernière période.
- [ ] Dernière paie (bloc 8) avec droits de congés, droits de préavis et indemnités de licenciement.
- [ ] **Solde de tout compte (STC)** = salaire dû + congés non pris + préavis + indemnités − avances et retenues.
- [ ] Indemnité de retraite exonérée d'IRSA dans la limite d'un an de salaire brut ; l'excédent suit le barème normal.
- [ ] **Certificat de travail** en PDF : identité, dates d'entrée et de sortie, postes occupés.
- [ ] **Reçu pour solde de tout compte** en PDF avec le détail du calcul.
- [ ] Gestion du matériel : inventaire, restitution, checklist.
- [ ] Désactivation automatique des accès à la date de sortie.
- [ ] Archivage du dossier avec politique de conservation et anonymisation RGPD (bloc 5).
- [ ] Cohérence avec le bloc 10 : l'événement « sortie » clôture affectations et contrats.

## 7. Transverse

- [ ] Routes backend, écrans frontend et rôles pour chaque bloc.
- [ ] Scripts SQL numérotés dans la suite des existants (`08-…`, `09-…`, etc.).
- [ ] Compléter `guide.md` avec des parcours B8-xx à B12-xx (obligatoire / bonus).
- [ ] Tests d'intégration : paie, STC, workflow disciplinaire.

## 8. Fiche de suivi

| ID | Bloc | Statut | Commentaire |
|---|---|---|---|
| B8 | Paie | À faire | |
| B9 | Évaluation, compétences, formation | À faire | |
| B10 | Carrière et mobilité | À faire | |
| B11 | Discipline et sanctions | À faire | |
| B12 | Rupture et offboarding | À faire | |
