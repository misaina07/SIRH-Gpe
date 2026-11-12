-- RESET COMPLET DE LA BASE SIRH
-- Cible : tables applicatives SIRH des fichiers schema.sql et schema-possible.sql
--
-- IMPORTANT :
--   1. Ce script supprime les données puis les tables.
--   2. Il ne supprime pas la base PostgreSQL elle-même.
--   3. Le script se termine volontairement par ROLLBACK pour éviter une
--      suppression accidentelle.
--   4. Après vérification, remplacer ROLLBACK par COMMIT pour appliquer.
--
-- À exécuter dans la base sirh avec un compte ayant les droits nécessaires.

BEGIN;

-- Suppression des données dans toutes les tables SIRH existantes.
-- L'ordre n'est pas important ici : les contraintes sont temporairement
-- différées pendant la transaction.
SET CONSTRAINTS ALL DEFERRED;

DO $$
DECLARE
    table_name TEXT;
    sirh_tables CONSTANT TEXT[] := ARRAY[
        'requisition_audit_events',
        'requisition_approvals',
        'position_approvals',
        'requisitions',
        'available_positions',
        'candidates',
        'onboarding_people',
        'employee_documents',
        'employees',
        'time_clock_events',
        'daily_time_sheets',
        'leave_requests',
        'leave_balances',
        'leave_types',
        'manager_departments',
        'departments',
        'users'
    ];
BEGIN
    FOREACH table_name IN ARRAY sirh_tables LOOP
        IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
            EXECUTE format('DELETE FROM public.%I', table_name);
        END IF;
    END LOOP;
END
$$;

-- Suppression des tables. IF EXISTS permet d'utiliser le script avec
-- schema.sql ou schema-possible.sql, qui n'ont pas exactement les mêmes noms.
DROP TABLE IF EXISTS public.requisition_audit_events CASCADE;
DROP TABLE IF EXISTS public.requisition_approvals CASCADE;
DROP TABLE IF EXISTS public.position_approvals CASCADE;
DROP TABLE IF EXISTS public.requisitions CASCADE;
DROP TABLE IF EXISTS public.available_positions CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.onboarding_people CASCADE;
DROP TABLE IF EXISTS public.employee_documents CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.time_clock_events CASCADE;
DROP TABLE IF EXISTS public.daily_time_sheets CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.leave_types CASCADE;
DROP TABLE IF EXISTS public.manager_departments CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Protection contre l'exécution destructive accidentelle.
-- Remplacer uniquement après vérification par :
-- COMMIT;
ROLLBACK;
