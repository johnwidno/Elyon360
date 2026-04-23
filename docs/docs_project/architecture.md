# Architecture Technique - ElyonSys 360

---
## PARTIE 1 : VUE D'ENSEMBLE
---

### 1. Concept Global
ElyonSys 360 est une plateforme SaaS de gestion d'église multi-entité (Multi-tenancy). Elle supporte plusieurs églises indépendantes sur une même instance, avec une isolation stricte des données.

### 2. Stack Technologique (Résumé)
- **Frontend** : React.js, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend** : Node.js & Express.js.
- **Base de Données** : Sequelize ORM (SQL Relationnel).

### 3. Structure Simplifiée du Projet
```text
ElyonSys 360/
├── backend/            # API et Logique Serveur
├── frontend/           # Interface Utilisateur React
└── docs/               # Documentation et Spécifications
```

---
## PARTIE 2 : ARCHITECTURE DÉTAILLÉE
---

### 4. Système de Multi-Tenancy (Isolation des données)
L'isolation est la priorité absolue du système :
- **Headers Techniques** : Le frontend utilise un interceptor Axios (`src/api/axios.js`) qui injecte un header `X-Tenant-ID` basé sur le sous-domaine actuel ou les données extraites du token JWT.
- **Isolation Serveur** : Un middleware backend intercepte chaque requête pour garantir qu'un utilisateur ne peut accéder qu'aux données rattachées à son `churchId`.

### 5. Sécurité et Flux d'Authentification
- **Authentification JWT** : 
    1. Connexion via `/api/auth/login`.
    2. Stockage du Token dans le `localStorage`.
    3. Injection automatique du token dans les headers Authorization des requêtes Axios.
- **Protection des Routes** : Combinaison de `ProtectedRoute` côté React et de middlewares de validation côté Express.

### 6. Architecture Physique & Communication
- **Hébergement Backend** : Déployé sur **Render**.
- **Gestion d'État** : Utilisation intensive de la **React Context API** (`AuthProvider`, `ThemeContext`, `LanguageContext`) pour éviter la complexité de Redux tout en conservant une réactivité globale.
- **Base de Données** : Système gérant plus de 60 modèles interconnectés (Relations complexes définies dans `backend/models/index.js`).

### 7. Concepts Clés du Logiciel
- **SaaS First** : Tout est pensé pour l'extensibilité vers de nouvelles congrégations sans modification de code.
- **Mode Focus** : Interface spécifique pour les prédicateurs, optimisant la lecture et l'interaction.
- **Design Premium** : Système de thèmes dynamiques (Sombre/Clair) et interface ultra-responsive.
