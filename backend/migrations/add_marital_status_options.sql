-- Migration SQL pour ajouter les nouveaux statuts maritaux
-- Date: 2026-01-29
-- Description: Ajoute 'widowed' et 'divorced' au champ maritalStatus de la table sunday_schools

-- Modifier la colonne maritalStatus pour inclure les nouveaux statuts
ALTER TABLE sunday_schools 
MODIFY COLUMN maritalStatus ENUM('single', 'married', 'widowed', 'divorced', 'any') 
DEFAULT 'any';

-- Vérification
SELECT COLUMN_NAME, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'sunday_schools' 
AND COLUMN_NAME = 'maritalStatus';
