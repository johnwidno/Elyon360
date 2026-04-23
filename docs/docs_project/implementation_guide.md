# Guide d'Implémentation et Développement

---
## PARTIE 1 : FONDAMENTAUX
---

### 1. Conventions de Code
- **React** : Composants fonctionnels avec hooks. Toujours utiliser `lucide-react` pour les icônes.
- **Backend** : Architecture Route-Controller. Toujours valider le `churchId`.

### 2. Ajout d'une Fonctionnalité
1. Créer le **Modèle** (`backend/models/`).
2. Développer le **Controller**.
3. Exposer via une **Route**.
4. Créer la **Page** frontend.

---
## PARTIE 2 : CONFIGURATION ET DÉTAILS AVANCÉS
---

### 3. Environnement (.env)
- **Backend** : `DATABASE_URL`, `JWT_SECRET`, `MONCASH_SECRET`.
- **Frontend** : `REACT_APP_API_URL`.

### 4. Communication API et Axios
Le projet utilise une instance centralisée dans `src/api/axios.js`.
- **Interceptors** : Gestion automatique du token et du `X-Tenant-ID`.
- **Erreurs Critiques** :
    - **401** : Déconnexion automatique.
    - **403 (CHURCH_INACTIVE)** : Blocage si l'abonnement SaaS est expiré.

### 5. Base de Données (Sequelize)
- **Relations** : Les associations vitales (hasMany, belongsTo) sont centralisées dans `backend/models/index.js`.
- **Maintenance** : Utiliser les scripts dans `backend/maintenance/scripts/` pour les opérations de routine ou de réparation.

### 6. Design Premium et PWA
- **Animations** : Utiliser Framer Motion (`motion.div`).
- **PWA** : Le hook `usePWA` est le point d'entrée pour toute logique d'installation ou de détection mobile.

---
*Note: Cette documentation hybride permet une lecture rapide pour les bases et un approfondissement pour les experts.*
