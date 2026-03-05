# Guide de Migration de la Base de Données

## Modifications récentes
1. ✅ Ajout de `widowed` et `divorced` au champ `maritalStatus` dans `SundaySchool`
2. ✅ Ajout de `MemberCategory` par défaut lors de la création d'église
3. ✅ Amélioration de la suppression en cascade des classes dominicales
4. ✅ Ajout des catégories manquantes pour les églises existantes

## Option 1 : Migration complète (RECOMMANDÉ pour développement)

**⚠️ ATTENTION : Cette option supprime TOUTES les données !**

```powershell
# 1. Arrêter le serveur backend (Ctrl+C si en cours)

# 2. Se placer dans le dossier backend
cd "C:\Users\teach\Desktop\ElyonSys 360\backend"

# 3. Recréer la base de données
node scripts/reset_database.js

# 4. Redémarrer le serveur
npm start
```

## Option 2 : Migration manuelle SQL (RECOMMANDÉ pour production)

Si vous voulez **conserver vos données**, exécutez cette requête SQL directement dans MySQL :

```sql
-- Modifier la table sunday_school pour ajouter les nouveaux statuts maritaux
ALTER TABLE sunday_schools 
MODIFY COLUMN maritalStatus ENUM('single', 'married', 'widowed', 'divorced', 'any') 
DEFAULT 'any';
```

## Vérification après migration

1. **Vérifier les catégories de membres** :
   - Connectez-vous à votre église
   - Allez dans École Dominicale > Créer une classe
   - Le champ "Classification du Contact" doit afficher 8 options

2. **Vérifier les statuts maritaux** :
   - Le champ "État civil" doit afficher 5 options :
     - Peu importe
     - Célibataire
     - Marié(e)
     - Veuf/Veuve
     - Divorcé(e)

3. **Tester la suppression** :
   - Essayez de supprimer une classe avec des membres
   - La suppression doit fonctionner sans erreur

## Script déjà exécuté
✅ `add_member_categories.js` - Ajout de 8 catégories pour votre église
