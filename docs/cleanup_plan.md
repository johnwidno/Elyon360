# Plan de Nettoyage (Cleanup) - ElyonSys 360

## 1. Analyse de l'Architecture Actuelle
Le projet suit une structure Full-Stack (React/Node.js) standard, mais il est actuellement encombré par plus de **200 fichiers utilitaires, scripts de diagnostic et journaux de logs** accumulés pendant la phase de développement et de débogage.

**Problématique principale** : La racine du projet et le dossier `backend/` contiennent des dizaines de scripts `fix_*.js`, `check_*.js` et `debug_*.js` qui rendent la navigation difficile et masquent les fichiers de logique métier importants.

---

## 2. Inventaire et Rôles des Fichiers

### 📄 Fichiers Importants (À Conserver / Organiser)
| Dossier | Rôle | Action |
| :--- | :--- | :--- |
| `frontend/src/` | Code source de l'interface utilisateur | Conserver |
| `backend/server.js` | Point d'entrée de l'API | Conserver |
| `backend/controllers/` | Logique métier de l'API | Conserver |
| `backend/models/` | Schémas de base de données | Conserver |
| `backend/routes/` | Définition des points de terminaison | Conserver |
| `docs/` | Documentation officielle | À centraliser ici |

### 🗑️ Fichiers Inutiles / Éphémères (À Supprimer ou Archiver)
*   **Logs de diagnostic** : `*.txt`, `*.json` (résultats de requêtes passées).
*   **Scripts de "Fix" ponctuels** : Scripts déjà exécutés pour corriger la BDD.
*   **Fichiers temporaires** : `tmp_*`, `debug_*`, `test_*`.

---

## 3. Plan de Réorganisation

### A. Création de Dossiers Dédiés
Nous allons créer une structure de maintenance pour ne plus polluer les dossiers "Sources" :
1.  `backend/maintenance/scripts` : Pour les outils de diagnostic et de réparation utiles.
2.  `backend/maintenance/logs` : Pour les rapports d'erreurs historiques.
3.  `docs/specs_and_manuals` : Pour tous les documents Word de la racine.

### B. Actions Spécifiques

#### ✅ À Déplacer (Restructuration)
*   Tous les documents `.docx` (Cahier des charges, Manuel, etc.) de la racine vers `docs/`.
*   Les scripts essentiels (ex: `seed_db.js`, `create_super_admin.js`) vers `backend/maintenance/scripts`.

#### ❌ À Supprimer (Nettoyage)
*   **Racine du projet** : `check_db.js`, `check_ebep.js`, `debug_db.js`, `dump_output.txt`, `sync_out.txt`, `test_query.js`, etc.
*   **Backend** : Les ~100 fichiers de type `check_*.js`, `diagnostic_*.txt`, `fix_*.js` qui ne sont plus nécessaires à l'exécution quotidienne de l'application.

---

## 4. Journal de Nettoyage (Log Document)
*Chaque catégorie de suppression sera documentée dans un fichier `cleanup_log.md`.*

| Fichier | Rôle Initial | Raison de la suppression | Impact |
| :--- | :--- | :--- | :--- |
| `check_db.js` | Vérification de connexion | Redondant avec la logique de démarrage système | Aucun |
| `diagnostic_output.txt` | Rapport de bug (Février 2026) | Information périmée | Aucun |
| `fix_moncash_handler.js`| Correction bug paiement | Code déjà intégré au contrôleur principal | Aucun |
